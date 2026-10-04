"use strict";
/*
  生写真セット 追加ツール（管理用・Ver1.01.02）
  - ../data/events.json（マスター）と ../data/events-add.json（追加分）を読み込み
  - 入力内容から id / sort / period / officialName を自動生成
  - data/events-add.json の全文を作り、コピー・保存できるようにする
  ブラウザ内だけで動き、外部への送信は一切しない。
*/
(function () {
  // プログラムが途中で止まった時に、原因を画面へ出す（iPhoneでは開発者ツールが見られないため）
  function reportProblem(message) {
    var box = document.getElementById("jsStatus");
    if (!box) return;
    box.hidden = false;
    box.className = "msg show ng";
    box.textContent = "ツールでエラーが起きました：" + message;
  }
  window.addEventListener("error", function (event) { reportProblem(event.message || "不明なエラー"); });
  window.addEventListener("unhandledrejection", function (event) {
    reportProblem((event.reason && event.reason.message) || String(event.reason || "不明なエラー"));
  });

  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const ORDINAL_SUFFIX = ["", "-Ⅱ", "-Ⅲ", "-Ⅳ", "-Ⅴ", "-Ⅵ", "-Ⅶ", "-Ⅷ"];
  const CATEGORIES = ["通常", "イベント", "コラボ"];
  const ALLOWED_HOSTS = ["equal-love.jp", "sp.equal-love.jp", "store.plusmember.jp"];
  const STORE_KEY = "equal-love-photo-add-tool-v1";
  const FILE_MEMO = "新しく発売された生写真セットは、このファイルの events に追加します。tools/add-event.html で入力して作った全文を、このファイルへ貼り付けて保存（コミット）してください。events.json（マスター）は編集しません。";
  const DEFAULT_REPO = "photomanager-0429/photomanager-0429.github.io";
  const DEFAULT_BRANCH = "main";

  const $ = id => document.getElementById(id);
  const state = {
    master: [],
    members: [],
    published: [],   // events-add.json に入っている分
    drafts: [],      // まだコミットしていない分
    repo: DEFAULT_REPO,
    branch: DEFAULT_BRANCH,
    dirty: {id: false, sort: false, period: false, officialName: false},
    ready: false
  };

  /* ---------- 小さな道具 ---------- */
  const pad2 = value => String(value).padStart(2, "0");
  const cleanText = (value, max) => String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  const todayText = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  };
  function showMessage(id, text, ok) {
    const box = $(id);
    box.textContent = text;
    box.className = `msg show ${ok ? "ok" : "ng"}`;
  }
  function hideMessage(id) {
    $(id).className = "msg";
  }
  function allEntries() {
    return [...state.published, ...state.drafts];
  }
  function usedIds() {
    return new Set([...state.master.map(event => event.id), ...allEntries().map(entry => entry.id)]);
  }
  function maxSort() {
    return [...state.master, ...allEntries()].reduce((max, event) => Math.max(max, Number(event.sort) || 0), 0);
  }
  function selectedCategory() {
    const checked = document.querySelector('input[name="category"]:checked');
    return checked ? checked.value : "通常";
  }
  function saveDrafts() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({drafts: state.drafts, repo: state.repo, branch: state.branch}));
    } catch (error) {
      console.warn("下書きを保存できませんでした", error);
    }
  }
  function loadDrafts() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      state.drafts = Array.isArray(saved.drafts) ? saved.drafts : [];
      state.repo = cleanText(saved.repo, 120) || DEFAULT_REPO;
      state.branch = cleanText(saved.branch, 60) || DEFAULT_BRANCH;
    } catch (error) {
      state.drafts = [];
    }
  }

  /* ---------- 自動生成 ---------- */
  function asciiSlug(value) {
    const slug = String(value || "").toLowerCase().normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
    // 日本語だけの呼び名は英数字が残らないため、数字だけになった場合もid用には使わない
    return /[a-z]/.test(slug) ? slug : "";
  }
  function countInMonth(year, month) {
    const prefix = `${year}-${pad2(month)}`;
    const period = `${year}.${MONTHS[month - 1]}`;
    const ids = usedIds();
    let count = 0;
    for (const id of ids) if (id.startsWith(`${prefix}-`)) count++;
    if (!count) {
      count = [...state.master, ...allEntries()].filter(event => String(event.period || "").startsWith(period)).length;
    }
    return count;
  }
  function buildAuto() {
    const category = selectedCategory();
    const year = Number($("yearInput").value) || new Date().getFullYear();
    const month = Number($("monthInput").value) || 1;
    const ordinal = Math.min(ORDINAL_SUFFIX.length, Math.max(1, Number($("ordinalInput").value) || 1));
    const work = cleanText($("workInput").value, 120);
    const label = cleanText($("labelInput").value, 60);
    const suffix = ORDINAL_SUFFIX[ordinal - 1] || "";
    const taken = usedIds();

    let id;
    let period;
    let officialName;
    if (category === "通常") {
      id = `${year}-${pad2(month)}-${pad2(ordinal)}`;
      period = `${year}.${MONTHS[month - 1]}${suffix}`;
      officialName = `${year} ${MONTHS[month - 1]}${suffix} 生写真セット(${work || "衣装名"})`;
    } else {
      const base = asciiSlug(label) || (category === "コラボ" ? "collaboration" : "event");
      const head = category === "コラボ" && !base.startsWith("collaboration")
        ? `${year}-collaboration-${base}` : `${year}-${base}`;
      id = head;
      let serial = 2;
      while (taken.has(id) && serial < 40) id = `${head}-${pad2(serial++)}`;
      period = `${year}.${label || MONTHS[month - 1]}`;
      officialName = `${year} 生写真セット(${work || "衣装名"})`;
    }
    return {id, period, officialName, sort: maxSort() + 1};
  }
  function refreshAuto() {
    if (!state.ready) return;
    const auto = buildAuto();
    if (!state.dirty.id) $("idInput").value = auto.id;
    if (!state.dirty.sort) $("sortInput").value = auto.sort;
    if (!state.dirty.period) $("periodInput").value = auto.period;
    if (!state.dirty.officialName) $("officialNameInput").value = auto.officialName;

    const work = cleanText($("workInput").value, 120);
    $("pvId").textContent = $("idInput").value || "-";
    $("pvSort").textContent = $("sortInput").value || "-";
    $("pvPeriod").textContent = $("periodInput").value || "-";
    $("pvOfficial").textContent = $("officialNameInput").value || "-";
    $("pvShownPeriod").textContent = $("periodInput").value || "-";
    $("pvShownWork").textContent = `${work || "（衣装名・楽曲名が未入力）"}｜${selectedCategory()}`;
  }
  function syncCategoryFields() {
    const isRegular = selectedCategory() === "通常";
    $("ordinalField").hidden = !isRegular;
    $("labelField").hidden = isRegular;
    refreshDefaultOrdinal();
    refreshAuto();
  }
  function refreshDefaultOrdinal() {
    if (state.dirty.id) return;
    const year = Number($("yearInput").value) || new Date().getFullYear();
    const month = Number($("monthInput").value) || 1;
    const next = Math.min(ORDINAL_SUFFIX.length, countInMonth(year, month) + 1);
    $("ordinalInput").value = String(next);
  }

  /* ---------- 読み込み ---------- */
  async function fetchJson(url) {
    const response = await fetch(url, {cache: "no-store"});
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`${url} を読み込めませんでした（${response.status}）`);
    return response.json();
  }
  async function loadData() {
    const [events, members, additions] = await Promise.all([
      fetchJson("../data/events.json"),
      fetchJson("../data/members.json"),
      fetchJson("../data/events-add.json").catch(() => null)
    ]);
    if (!Array.isArray(events) || !Array.isArray(members)) throw new Error("マスターデータの形式が正しくありません");
    state.master = events;
    state.members = members;
    const list = Array.isArray(additions) ? additions
      : (additions && Array.isArray(additions.events)) ? additions.events : [];
    state.published = list.filter(item => item && typeof item === "object" && item.id);
    // コミット済みになった下書きは、重複しないように取り除く
    const publishedIds = new Set(state.published.map(entry => entry.id));
    const before = state.drafts.length;
    state.drafts = state.drafts.filter(entry => !publishedIds.has(entry.id));
    if (before !== state.drafts.length) saveDrafts();
  }

  /* ---------- 画面の描画 ---------- */
  function renderStatus() {
    $("countMaster").textContent = state.master.length;
    $("countAdded").textContent = allEntries().length;
    $("countTotal").textContent = state.master.length + allEntries().length;
    const latest = [...state.master, ...allEntries()].sort((a, b) => (Number(b.sort) || 0) - (Number(a.sort) || 0))[0];
    $("latestInfo").textContent = latest
      ? `最新のセット：${latest.period || latest.id}｜${latest.work || latest.officialName}（sort ${latest.sort}）`
      : "最新のセット：まだありません";
    $("loadNote").textContent = state.published.length || state.drafts.length
      ? `追加ファイルに${state.published.length}件、未コミットの下書きが${state.drafts.length}件あります。`
      : "マスターデータを読み込みました。追加分はまだありません。";
  }
  function renderEntries() {
    const list = $("entryList");
    const entries = [...allEntries()].sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
    list.innerHTML = "";
    $("entryNote").textContent = entries.length
      ? `${entries.length}件が events-add.json に入ります。`
      : "まだありません。上の欄から追加してください。";
    entries.forEach(entry => {
      const draft = state.drafts.includes(entry);
      const item = document.createElement("li");
      const line = document.createElement("div");
      line.className = "line1";
      const chip = document.createElement("span");
      chip.className = `chip${draft ? " draft" : ""}`;
      chip.textContent = draft ? "未コミット" : "公開済み";
      const title = document.createElement("b");
      title.textContent = `${entry.period || entry.id}｜${entry.work || entry.officialName}`;
      line.append(chip, title);
      const meta = document.createElement("small");
      const exclude = Array.isArray(entry.excludeMemberIds) && entry.excludeMemberIds.length
        ? `／除外 ${entry.excludeMemberIds.map(id => memberName(id)).join("・")}` : "";
      meta.textContent = `${entry.category}｜id ${entry.id}｜sort ${entry.sort}${exclude}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "この行を削除";
      remove.addEventListener("click", () => removeEntry(entry, draft));
      item.append(line, meta, remove);
      list.appendChild(item);
    });
    renderOutput();
    renderStatus();
  }
  function memberName(id) {
    const member = state.members.find(item => item.id === id);
    return member ? member.name : id;
  }
  function removeEntry(entry, draft) {
    const label = `${entry.period || entry.id}｜${entry.work || entry.officialName}`;
    const extra = draft ? "" : "\n\nこの行はすでに公開済みです。削除した全文を反映すると、アプリの一覧からこのセットが消えます。";
    if (!confirm(`「${label}」を追加リストから外しますか？${extra}`)) return;
    if (draft) {
      state.drafts = state.drafts.filter(item => item !== entry);
      saveDrafts();
    } else {
      state.published = state.published.filter(item => item !== entry);
    }
    renderEntries();
    refreshAuto();
  }
  function renderMemberChecks() {
    const box = $("memberCheckList");
    box.innerHTML = "";
    [...state.members]
      .sort((a, b) => String(a.kana || a.name).localeCompare(String(b.kana || b.name), "ja"))
      .forEach(member => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = member.id;
        input.dataset.memberCheck = "1";
        const text = document.createElement("span");
        text.textContent = `${member.emoji || ""} ${member.name}${member.status === "graduated" ? "（卒業）" : ""}`;
        label.append(input, text);
        box.appendChild(label);
      });
  }
  function outputObject() {
    const events = [...allEntries()]
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
      .map(entry => {
        const item = {
          officialName: entry.officialName,
          id: entry.id,
          sort: Number(entry.sort),
          category: entry.category,
          period: entry.period,
          work: entry.work,
          officialUrl: entry.officialUrl || "",
          addedDate: entry.addedDate || ""
        };
        if (Array.isArray(entry.excludeMemberIds) && entry.excludeMemberIds.length) {
          item.excludeMemberIds = entry.excludeMemberIds;
        }
        return item;
      });
    return {_memo: FILE_MEMO, events};
  }
  function renderOutput() {
    $("outputText").value = `${JSON.stringify(outputObject(), null, 2)}\n`;
  }

  /* ---------- 追加 ---------- */
  function checkUrl(value) {
    if (!value) return {ok: true, url: ""};
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !ALLOWED_HOSTS.includes(url.hostname)) {
        return {ok: false, url: value};
      }
      return {ok: true, url: url.href};
    } catch (error) {
      return {ok: false, url: value};
    }
  }
  function addEntry() {
    const work = cleanText($("workInput").value, 120);
    const id = cleanText($("idInput").value, 40);
    const period = cleanText($("periodInput").value, 60);
    const officialName = cleanText($("officialNameInput").value, 160) || `${period} 生写真セット(${work})`;
    const sort = Math.round(Number($("sortInput").value));
    const addedDate = cleanText($("dateInput").value, 10) || todayText();
    const category = selectedCategory();
    const excludeMemberIds = [...document.querySelectorAll("[data-member-check]:checked")].map(input => input.value);

    if (!work) return showMessage("addMessage", "衣装名・楽曲名を入力してください。", false);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,39}$/.test(id)) {
      return showMessage("addMessage", "idは英数字とハイフンで3文字以上にしてください。", false);
    }
    if (usedIds().has(id)) {
      return showMessage("addMessage", `idが重複しています（${id}）。「自動で作った値を手で直す」からidを変更してください。`, false);
    }
    if (!period) return showMessage("addMessage", "periodが空です。", false);
    if (!Number.isFinite(sort) || sort <= 0) return showMessage("addMessage", "sortは1以上の数字にしてください。", false);
    if (excludeMemberIds.length >= state.members.length) {
      return showMessage("addMessage", "全員を除外すると誰も表示されません。除外の指定を見直してください。", false);
    }
    const duplicate = [...state.master, ...allEntries()].find(event => event.period === period && event.work === work);
    if (duplicate && !confirm(`同じ内容（${period}｜${work}）がすでにあります。\nそれでも追加しますか？`)) return;

    const checked = checkUrl($("urlInput").value.trim());
    const entry = {officialName, id, sort, category, period, work, officialUrl: checked.url, addedDate, excludeMemberIds};
    state.drafts.push(entry);
    saveDrafts();
    renderEntries();

    // 次の入力に備えて、衣装名とURLだけ空にする
    $("workInput").value = "";
    $("urlInput").value = "";
    document.querySelectorAll("[data-member-check]:checked").forEach(input => { input.checked = false; });
    state.dirty = {id: false, sort: false, period: false, officialName: false};
    refreshDefaultOrdinal();
    refreshAuto();
    const warn = checked.ok ? "" : "（公式URLは対象外のサイトのため、アプリでは公式サイトのボタンが出ません）";
    showMessage("addMessage", `追加リストへ入れました：${period}｜${work}${warn}`, checked.ok);
  }

  /* ---------- 貼り付けからの読み取り ---------- */
  function parsePasted() {
    const text = cleanText($("pasteInput").value, 500);
    if (!text) return showMessage("parseMessage", "読み取る文字が入っていません。", false);
    const found = [];

    const year = text.match(/20\d{2}/);
    if (year) { $("yearInput").value = year[0]; found.push(`年 ${year[0]}`); }

    const monthIndex = MONTHS.findIndex(month => new RegExp(month, "i").test(text));
    if (monthIndex >= 0) {
      $("monthInput").value = String(monthIndex + 1);
      found.push(`月 ${MONTHS[monthIndex]}`);
    }

    const suffix = text.match(/-\s*(Ⅷ|Ⅶ|Ⅵ|Ⅴ|Ⅳ|Ⅲ|Ⅱ|VIII|VII|VI|V|IV|III|II|[2-8])\b/);
    if (suffix) {
      const table = {"Ⅱ": 2, "Ⅲ": 3, "Ⅳ": 4, "Ⅴ": 5, "Ⅵ": 6, "Ⅶ": 7, "Ⅷ": 8,
        II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8};
      const ordinal = table[suffix[1].toUpperCase()] || table[suffix[1]] || Number(suffix[1]) || 1;
      state.dirty.id = false;
      $("ordinalInput").value = String(Math.min(ORDINAL_SUFFIX.length, ordinal));
      found.push(`${ordinal}本目`);
    } else if (monthIndex >= 0) {
      refreshDefaultOrdinal();
    }

    const work = text.match(/[(（]([^()（）]{1,120})[)）]/);
    if (work) { $("workInput").value = cleanText(work[1], 120); found.push("衣装名"); }

    const url = text.match(/https:\/\/[^\s"'<>）)]+/);
    if (url) { $("urlInput").value = url[0]; found.push("公式URL"); }

    // カテゴリの推定：コラボは語句で判断できる。月名が入っていれば毎月の通常セットとみなし、
    // 月名が無く公演を示す語句だけの場合にイベントとする（衣装名の「◯周年衣装」に引っぱられないようにする）
    const pickCategory = value => {
      const input = document.querySelector(`input[name="category"][value="${value}"]`);
      if (input) input.checked = true;
      found.push(`カテゴリ ${value}`);
    };
    if (/コラボ/.test(text)) pickCategory("コラボ");
    else if (monthIndex >= 0) pickCategory("通常");
    else if (/ツアー|TOUR|LIVE|STADIUM|周年|卒業|ハロウィン|Halloween/i.test(text)) pickCategory("イベント");

    syncCategoryFields();
    if (!found.length) return showMessage("parseMessage", "読み取れませんでした。下の欄に直接入力してください。", false);
    showMessage("parseMessage", `読み取りました：${found.join("・")}。内容を確認してください。`, true);
  }

  /* ---------- 出力 ---------- */
  async function copyOutput() {
    const text = $("outputText").value;
    if (!allEntries().length && !confirm("追加リストが空です。空のファイルとしてコピーしますか？")) return;
    try {
      await navigator.clipboard.writeText(text);
      showMessage("outputMessage", "コピーしました。GitHubの編集画面で、中身を全部消して貼り付けてください。", true);
    } catch (error) {
      const area = $("outputText");
      area.closest("details").open = true;
      area.focus();
      area.select();
      const copied = document.execCommand && document.execCommand("copy");
      showMessage("outputMessage", copied
        ? "コピーしました。GitHubの編集画面で貼り付けてください。"
        : "コピーできませんでした。下の全文を長押しして選択し、コピーしてください。", copied);
    }
  }
  function downloadOutput() {
    const blob = new Blob([$("outputText").value], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "events-add.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showMessage("outputMessage", "events-add.json を保存しました。GitHubの data フォルダへアップロードしてください。", true);
  }
  function openGithub() {
    const repo = cleanText($("repoInput").value, 120) || state.repo;
    const branch = cleanText($("branchInput").value, 60) || state.branch;
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
      return showMessage("outputMessage", "リポジトリを「owner/repo」の形で入力してください。", false);
    }
    window.open(`https://github.com/${repo}/edit/${branch}/data/events-add.json`, "_blank", "noopener");
  }

  /* ---------- 起動 ---------- */
  function setupForm() {
    // 月・何本目の選択肢はHTMLに直接書いてある（プログラムより先に選べるようにするため）
    const now = new Date();
    $("yearInput").value = String(now.getFullYear());
    $("monthInput").value = String(now.getMonth() + 1);
    $("dateInput").value = todayText();
    $("repoInput").value = state.repo;
    $("branchInput").value = state.branch;

    document.querySelectorAll('input[name="category"]').forEach(input =>
      input.addEventListener("change", syncCategoryFields));
    ["yearInput", "monthInput"].forEach(id => $(id).addEventListener("change", () => {
      refreshDefaultOrdinal();
      refreshAuto();
    }));
    ["ordinalInput", "labelInput", "workInput"].forEach(id => {
      $(id).addEventListener("input", refreshAuto);
      $(id).addEventListener("change", refreshAuto);
    });
    [["idInput", "id"], ["sortInput", "sort"], ["periodInput", "period"], ["officialNameInput", "officialName"]]
      .forEach(([id, key]) => $(id).addEventListener("input", () => {
        state.dirty[key] = true;
        refreshAuto();
      }));
    $("parseButton").addEventListener("click", parsePasted);
    $("addButton").addEventListener("click", addEntry);
    $("copyButton").addEventListener("click", copyOutput);
    $("downloadButton").addEventListener("click", downloadOutput);
    $("githubButton").addEventListener("click", openGithub);
    $("saveRepoButton").addEventListener("click", () => {
      state.repo = cleanText($("repoInput").value, 120) || DEFAULT_REPO;
      state.branch = cleanText($("branchInput").value, 60) || DEFAULT_BRANCH;
      saveDrafts();
      showMessage("outputMessage", "リポジトリの設定を覚えました。", true);
    });
  }

  async function start() {
    loadDrafts();
    setupForm();
    $("jsStatus").hidden = true;
    try {
      await loadData();
    } catch (error) {
      $("loadNote").textContent = `データを読み込めませんでした：${error.message}`;
      showMessage("addMessage", "マスターデータが読み込めないため、重複の確認ができません。通信状態を確認して再読み込みしてください。", false);
      return;
    }
    state.ready = true;
    renderMemberChecks();
    renderEntries();
    syncCategoryFields();
    hideMessage("addMessage");
  }

  start().catch(function (error) { reportProblem(error && error.message ? error.message : String(error)); });
})();
