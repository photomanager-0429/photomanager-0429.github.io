let EVENTS = [];
let MEMBERS = [];
let POSITIONS = [];
let APP_CONFIG = {};

const OFFICIAL_LINK_HOSTS = new Set(["equal-love.jp", "sp.equal-love.jp", "store.plusmember.jp"]);
function safeOfficialUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || !OFFICIAL_LINK_HOSTS.has(url.hostname)) return "";
    url.username = "";
    url.password = "";
    return url.href;
  } catch (error) {
    return "";
  }
}


async function loadAppData() {
  const [eventsResponse, membersResponse, positionsResponse, configResponse] = await Promise.all([
    fetch("./data/events.json?v=1.00.4",{cache:"no-store"}),
    fetch("./data/members.json?v=1.0.0",{cache:"no-store"}),
    fetch("./data/positions.json?v=1.0.0-orderfix",{cache:"no-store"}),
    fetch("./data/config.json?v=1.00.4",{cache:"no-store"})
  ]);

  if (!eventsResponse.ok || !membersResponse.ok || !positionsResponse.ok || !configResponse.ok) {
    throw new Error("データファイルの読み込みに失敗しました。");
  }

  EVENTS = await eventsResponse.json();
  MEMBERS = await membersResponse.json();
  POSITIONS = await positionsResponse.json();
  const config = await configResponse.json();
  APP_CONFIG = config;

  if(!Array.isArray(EVENTS)||!Array.isArray(MEMBERS)||!Array.isArray(POSITIONS)){
    throw new Error("データ形式が正しくありません。");
  }
  if(!EVENTS.length||!MEMBERS.length||!POSITIONS.length){
    throw new Error("必要なデータが空です。");
  }

  const versionLabel = document.getElementById("versionLabel");
  if (versionLabel) {
    versionLabel.textContent = `Ver ${config.version}`;
  }
  const dataUpdateLabel=document.getElementById("dataUpdateLabel");
  if(dataUpdateLabel){
    const date=config.dataUpdatedAt||config.releaseDate||"不明";
    dataUpdateLabel.textContent=`データ更新日：${date.replaceAll("-","/")}`;
  }

  const VERSION_KEY="equal-love-photo-manager-last-version";
  const previousVersion=localStorage.getItem(VERSION_KEY);
  if(previousVersion&&previousVersion!==config.version){
    const banner=document.getElementById("updateBanner");
    const button=document.getElementById("applyUpdateButton");
    if(banner){
      banner.querySelector("b").textContent=`Ver ${config.version}に更新されました`;
      banner.querySelector("span").textContent="新機能を反映するため、最新版を読み込みます。";
      banner.classList.remove("hidden");
      if(button)button.onclick=()=>{localStorage.setItem(VERSION_KEY,config.version);location.reload()};
    }
  }else{
    localStorage.setItem(VERSION_KEY,config.version);
  }

  initializeApp();
}

function initializeApp() {
  const COUNT_KEY="equal-love-photo-manager-counts-v03",SIGN_KEY="equal-love-photo-manager-signatures-v04",WANT_KEY="equal-love-photo-manager-wants-v05",OSHI_KEY="equal-love-photo-manager-oshi-v099";
  const PREF_KEY="equal-love-photo-manager-preferences-v095";
  const HISTORY_KEY="equal-love-photo-manager-auto-backups-v102";
  const RECENT_KEY="equal-love-photo-manager-recent-edits-v102";
  const SCROLL_KEY="equal-love-photo-manager-scroll-memory-v102";
  const SCHEMA_VERSION=2;
  function safeStorageObject(key){
    try{
      const value=JSON.parse(localStorage.getItem(key)||"{}");
      return value&&typeof value==="object"&&!Array.isArray(value)?value:{};
    }catch(error){
      console.warn(`保存データ ${key} を読み込めませんでした`,error);
      return {};
    }
  }
  function safeStorageArray(key){
    try{const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value:[]}
    catch(error){return []}
  }
  const savedPrefs=safeStorageObject(PREF_KEY);
  const state={
    mode:"all",
    memberId:savedPrefs.memberId||null,
    page:"collection",
    category:savedPrefs.category||"",
    yearFilter:savedPrefs.yearFilter||"",
    sort:savedPrefs.sort||"desc",
    search:savedPrefs.search||"",
    ownership:savedPrefs.ownership||"",
    newFilter:savedPrefs.newFilter||"",
    oshiOnly:savedPrefs.oshiOnly||false,
    pageMemberId:savedPrefs.pageMemberId||"",
    wishlistYear:savedPrefs.wishlistYear||"",
    tradeYear:savedPrefs.tradeYear||"",
    wishlistOrder:savedPrefs.wishlistOrder||"desc",
    tradeOrder:savedPrefs.tradeOrder||"desc",
    missingMemberId:savedPrefs.missingMemberId||"",
    missingPositionId:savedPrefs.missingPositionId||"",
    missingYear:savedPrefs.missingYear||"",
    missingEventOrder:savedPrefs.missingEventOrder||"desc",
    missingSearch:savedPrefs.missingSearch||"",
    quickEventId:savedPrefs.quickOrder?savedPrefs.quickEventId||"":"",
    quickSearch:savedPrefs.quickSearch||"",
    quickYear:savedPrefs.quickYear||"",
    quickOrder:savedPrefs.quickOrder||"asc",
    matrixEventId:savedPrefs.matrixOrder?savedPrefs.matrixEventId||"":"",
    matrixSearch:savedPrefs.matrixSearch||"",
    matrixYear:savedPrefs.matrixYear||"",
    matrixOrder:savedPrefs.matrixOrder||"asc",
    counts:safeStorageObject(COUNT_KEY),
    signs:safeStorageObject(SIGN_KEY),
    wants:safeStorageObject(WANT_KEY),
    oshis:safeStorageObject(OSHI_KEY),
    expanded:{}
  };
  function savePreferences(){
    localStorage.setItem(PREF_KEY,JSON.stringify({
      memberId:state.memberId,
      category:state.category,
      yearFilter:state.yearFilter,
      sort:state.sort,
      search:state.search,
      ownership:state.ownership,
      newFilter:state.newFilter,
      oshiOnly:state.oshiOnly,
      pageMemberId:state.pageMemberId,
      wishlistYear:state.wishlistYear,
      tradeYear:state.tradeYear,
      wishlistOrder:state.wishlistOrder,
      tradeOrder:state.tradeOrder,
      missingMemberId:state.missingMemberId,
      missingPositionId:state.missingPositionId,
      missingYear:state.missingYear,
      missingEventOrder:state.missingEventOrder,
      missingSearch:state.missingSearch,
      quickEventId:state.quickEventId,
      quickSearch:state.quickSearch,
      quickYear:state.quickYear,
      quickOrder:state.quickOrder,
      matrixEventId:state.matrixEventId,
      matrixSearch:state.matrixSearch,
      matrixYear:state.matrixYear,
      matrixOrder:state.matrixOrder
    }));
  }
  const $=id=>document.getElementById(id);

  const MEMBER_IMAGE_DB_NAME="equal-love-photo-manager-member-images";
  const MEMBER_IMAGE_DB_VERSION=1;
  const MEMBER_IMAGE_STORE="memberImages";
  const memberImageRecords=new Map();
  const memberImageUrls=new Map();
  let memberImagesReady=false;
  let memberImageLoadError="";
  let memberImageDbPromise=null;
  let imageEditDraft=null;
  let imageEditPreviewUrl="";

  function openMemberImageDb(){
    if(memberImageDbPromise)return memberImageDbPromise;
    memberImageDbPromise=new Promise((resolve,reject)=>{
      if(!("indexedDB" in window)){reject(new Error("このブラウザは端末内画像保存に対応していません"));return}
      const request=indexedDB.open(MEMBER_IMAGE_DB_NAME,MEMBER_IMAGE_DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(MEMBER_IMAGE_STORE)){
          db.createObjectStore(MEMBER_IMAGE_STORE,{keyPath:"memberId"});
        }
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error("画像保存領域を開けませんでした"));
      request.onblocked=()=>reject(new Error("画像保存領域の更新がブロックされています"));
    });
    return memberImageDbPromise;
  }

  function imageDbRequest(mode,operation){
    return openMemberImageDb().then(db=>new Promise((resolve,reject)=>{
      const transaction=db.transaction(MEMBER_IMAGE_STORE,mode);
      const store=transaction.objectStore(MEMBER_IMAGE_STORE);
      let request,result;
      let settled=false;
      const fail=error=>{
        if(settled)return;
        settled=true;
        reject(error||new Error("画像データを処理できませんでした"));
      };
      try{request=operation(store)}catch(error){fail(error);return}
      if(request){
        request.onsuccess=()=>{result=request.result};
        request.onerror=()=>fail(request.error||new Error("画像データを処理できませんでした"));
      }
      transaction.oncomplete=()=>{
        if(settled)return;
        settled=true;
        resolve(result);
      };
      transaction.onerror=()=>fail(transaction.error||new Error("画像データを保存できませんでした"));
      transaction.onabort=()=>fail(transaction.error||new Error("画像データの処理が中断されました"));
    }));
  }

  function normalizeMemberImageRecord(record){
    return {
      memberId:String(record.memberId||""),
      blob:record.blob instanceof Blob ? record.blob : null,
      dataUrl:typeof record.dataUrl==="string"&&record.dataUrl?record.dataUrl:"",
      positionX:imageNumber(record.positionX,50,0,100),
      positionY:imageNumber(record.positionY,50,0,100),
      zoom:imageNumber(record.zoom,1,1,2.4),
      updatedAt:String(record.updatedAt||new Date().toISOString())
    };
  }

  function blobToDataUrl(blob){
    return new Promise((resolve,reject)=>{
      if(!(blob instanceof Blob)){resolve("");return}
      const reader=new FileReader();
      reader.onload=()=>resolve(typeof reader.result==="string"?reader.result:"");
      reader.onerror=()=>reject(reader.error||new Error("画像データを変換できませんでした"));
      reader.readAsDataURL(blob);
    });
  }

  function recordToDisplayUrl(record){
    if(record?.blob instanceof Blob){
      try{return URL.createObjectURL(record.blob)}catch(error){console.warn("Blob URLの作成に失敗しました",error)}
    }
    return record?.dataUrl||"";
  }

  function cacheMemberImageRecord(record){
    const normalized=normalizeMemberImageRecord(record);
    const nextUrl=recordToDisplayUrl(normalized);
    if(!nextUrl)throw new Error("表示用の画像URLを作成できませんでした");
    const oldUrl=memberImageUrls.get(normalized.memberId);
    memberImageRecords.set(normalized.memberId,normalized);
    memberImageUrls.set(normalized.memberId,nextUrl);
    if(oldUrl&&oldUrl!==nextUrl&&oldUrl.startsWith("blob:"))URL.revokeObjectURL(oldUrl);
  }

  function removeMemberImageCache(memberId){
    const oldUrl=memberImageUrls.get(memberId);
    if(oldUrl&&oldUrl.startsWith("blob:"))URL.revokeObjectURL(oldUrl);
    memberImageUrls.delete(memberId);
    memberImageRecords.delete(memberId);
  }

  async function loadMemberImages(){
    try{
      const records=await imageDbRequest("readonly",store=>store.getAll());
      memberImageRecords.clear();
      memberImageUrls.forEach(url=>{if(url?.startsWith("blob:"))URL.revokeObjectURL(url)});
      memberImageUrls.clear();
      records.forEach(record=>{
        if(record?.memberId&&(record?.blob instanceof Blob||record?.dataUrl))cacheMemberImageRecord(record);
      });
      memberImagesReady=true;
      memberImageLoadError="";
    }catch(error){
      memberImagesReady=true;
      memberImageLoadError=error.message||"画像保存領域を読み込めませんでした";
      console.warn("メンバー画像の読み込みに失敗しました",error);
    }
    renderHomeMembers();
    if(state.page==="memberImages")renderMemberImages();
    if(state.page==="oshi")renderOshi();
  }

  function memberImageRecord(memberId){return memberImageRecords.get(memberId)||null}
  function memberImageUrl(memberId){return memberImageUrls.get(memberId)||""}

  function imageNumber(value,fallback,min,max){
    const number=Number(value);
    return Number.isFinite(number)?Math.min(max,Math.max(min,number)):fallback;
  }

  function memberImageStyle(record){
    if(!record)return "";
    const x=imageNumber(record.positionX,50,0,100);
    const y=imageNumber(record.positionY,50,0,100);
    const zoom=imageNumber(record.zoom,1,1,2.4);
    return `object-position:${x}% ${y}%;transform-origin:${x}% ${y}%;transform:scale(${zoom})`;
  }

  function memberCardPhotoMarkup(member){
    const record=memberImageRecord(member.id),url=memberImageUrl(member.id);
    if(!record||!url)return "";
    return `<img class="member-card-photo" src="${esc(url)}" alt="" style="${memberImageStyle(record)}"><span class="member-card-photo-shade"></span>`;
  }

  function memberAvatarMarkup(member,className="member-local-avatar"){
    const record=memberImageRecord(member.id),url=memberImageUrl(member.id);
    if(!record||!url)return `<span class="${className} emoji-fallback">${member.emoji}</span>`;
    return `<span class="${className} has-photo"><img src="${esc(url)}" alt="" style="${memberImageStyle(record)}"></span>`;
  }

  function imageBytesTotal(){
    return [...memberImageRecords.values()].reduce((sum,record)=>sum+(record.blob?.size||0),0);
  }

  function formatImageBytes(bytes){
    if(bytes<1024)return `${bytes} B`;
    if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/(1024*1024)).toFixed(1)} MB`;
  }

  function loadImageElement(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const image=new Image();
      image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
      image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("画像を読み込めませんでした"))};
      image.src=url;
    });
  }

  function canvasToBlob(canvas,type,quality){
    return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
  }

  const SAFE_IMAGE_TYPES=new Set(["image/jpeg","image/png","image/webp"]);
  async function hasSafeRasterSignature(file){
    const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
    const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
    const png=bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a;
    const webp=String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
    return jpeg||png||webp;
  }

  async function compressMemberImage(file){
    if(!file||!SAFE_IMAGE_TYPES.has(String(file.type||"").toLowerCase()))throw new Error("JPEG・PNG・WebP画像を選択してください");
    if(file.size<=0||file.size>15*1024*1024)throw new Error("画像は15MB以下にしてください");
    if(!(await hasSafeRasterSignature(file)))throw new Error("画像の形式を確認できませんでした。SVGなどは使用できません");
    const image=await loadImageElement(file);
    const naturalWidth=image.naturalWidth||image.width;
    const naturalHeight=image.naturalHeight||image.height;
    if(!Number.isFinite(naturalWidth)||!Number.isFinite(naturalHeight)||naturalWidth<1||naturalHeight<1)throw new Error("画像サイズを確認できませんでした");
    if(naturalWidth>12000||naturalHeight>12000||naturalWidth*naturalHeight>40000000)throw new Error("画像の解像度が大きすぎます");
    const maxSide=1400;
    const scale=Math.min(1,maxSide/Math.max(naturalWidth,naturalHeight));
    const width=Math.max(1,Math.round(naturalWidth*scale));
    const height=Math.max(1,Math.round(naturalHeight*scale));
    const canvas=document.createElement("canvas");
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext("2d",{alpha:false});
    if(!context)throw new Error("画像の処理に対応していません");
    context.fillStyle="#ffffff";
    context.fillRect(0,0,width,height);
    context.drawImage(image,0,0,width,height);
    let blob=await canvasToBlob(canvas,"image/webp",0.84);
    if(!blob)blob=await canvasToBlob(canvas,"image/jpeg",0.86);
    canvas.width=1;canvas.height=1;
    if(!blob)throw new Error("画像を保存用に変換できませんでした");
    return blob;
  }

  function chooseMemberImage(memberId){
    const member=MEMBERS.find(item=>item.id===memberId);
    if(!member)return;
    const input=document.createElement("input");
    input.type="file";
    input.accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
    input.onchange=async()=>{
      const file=input.files?.[0];
      if(!file)return;
      showActionToast("画像を端末内用に処理しています…");
      try{
        const blob=await compressMemberImage(file);
        openImageAdjustSheet(memberId,{
          memberId,
          blob,
          positionX:50,
          positionY:50,
          zoom:1,
          updatedAt:new Date().toISOString()
        });
      }catch(error){
        alert(`画像を設定できませんでした：${error.message}`);
      }
    };
    input.click();
  }

  function updateImageAdjustPreview(){
    if(!imageEditDraft)return;
    const x=imageNumber($("imagePositionX").value,50,0,100);
    const y=imageNumber($("imagePositionY").value,50,0,100);
    const zoom=imageNumber(Number($("imageZoom").value)/100,1,1,2.4);
    imageEditDraft.positionX=x;
    imageEditDraft.positionY=y;
    imageEditDraft.zoom=zoom;
    [$("imageAdjustPreview"),$("imageAdjustAvatarPreview")].forEach(preview=>{
      if(!preview)return;
      preview.style.objectPosition=`${x}% ${y}%`;
      preview.style.transformOrigin=`${x}% ${y}%`;
      preview.style.transform=`scale(${zoom})`;
    });
    const xValue=$("imagePositionXValue"),yValue=$("imagePositionYValue"),zValue=$("imageZoomValue");
    if(xValue)xValue.textContent=String(Math.round(x));
    if(yValue)yValue.textContent=String(Math.round(y));
    if(zValue)zValue.textContent=`${Math.round(zoom*100)}%`;
  }

  function openImageAdjustSheet(memberId,record=null){
    const member=MEMBERS.find(item=>item.id===memberId);
    const source=record||memberImageRecord(memberId);
    if(!member||!source?.blob)return;
    if(imageEditPreviewUrl)URL.revokeObjectURL(imageEditPreviewUrl);
    imageEditDraft=normalizeMemberImageRecord(source);
    imageEditPreviewUrl=URL.createObjectURL(imageEditDraft.blob);
    $("imageAdjustMemberName").textContent=`${member.emoji} ${member.name}`;
    $("imageAdjustPreviewName").textContent=member.name;
    $("imageAdjustPreview").src=imageEditPreviewUrl;
    $("imageAdjustAvatarPreview").src=imageEditPreviewUrl;
    $("imagePositionX").value=String(imageEditDraft.positionX);
    $("imagePositionY").value=String(imageEditDraft.positionY);
    $("imageZoom").value=String(Math.round(imageEditDraft.zoom*100));
    updateImageAdjustPreview();
    openUtilitySheet("imageAdjustSheetOverlay");
  }

  function closeImageAdjustSheet(){
    closeUtilitySheet("imageAdjustSheetOverlay");
    if(imageEditPreviewUrl)URL.revokeObjectURL(imageEditPreviewUrl);
    imageEditPreviewUrl="";
    if($("imageAdjustPreview"))$("imageAdjustPreview").src="";
    if($("imageAdjustAvatarPreview"))$("imageAdjustAvatarPreview").src="";
    imageEditDraft=null;
  }

  function resetImageAdjust(){
    if(!imageEditDraft)return;
    $("imagePositionX").value="50";
    $("imagePositionY").value="50";
    $("imageZoom").value="100";
    updateImageAdjustPreview();
  }

  function setupImageAdjustDrag(){
    const frame=$("imageAdjustPreviewFrame");
    if(!frame||frame.dataset.dragReady==="1")return;
    frame.dataset.dragReady="1";
    let dragging=false,startX=0,startY=0,baseX=50,baseY=50;
    const begin=(clientX,clientY)=>{
      dragging=true;startX=clientX;startY=clientY;
      baseX=Number($("imagePositionX").value||50);
      baseY=Number($("imagePositionY").value||50);
      frame.classList.add("dragging");
    };
    const move=(clientX,clientY)=>{
      if(!dragging)return;
      const rect=frame.getBoundingClientRect();
      const dx=((clientX-startX)/Math.max(rect.width,1))*100;
      const dy=((clientY-startY)/Math.max(rect.height,1))*100;
      $("imagePositionX").value=String(Math.min(100,Math.max(0,baseX-dx)));
      $("imagePositionY").value=String(Math.min(100,Math.max(0,baseY-dy)));
      updateImageAdjustPreview();
    };
    const end=()=>{dragging=false;frame.classList.remove("dragging")};
    frame.addEventListener("pointerdown",event=>{begin(event.clientX,event.clientY);frame.setPointerCapture?.(event.pointerId)});
    frame.addEventListener("pointermove",event=>{move(event.clientX,event.clientY)});
    frame.addEventListener("pointerup",end);
    frame.addEventListener("pointercancel",end);
    frame.addEventListener("pointerleave",()=>{});
  }

  async function saveImageAdjust(){
    if(!imageEditDraft)return;
    updateImageAdjustPreview();
    const saveButton=$("saveImageAdjustButton");
    const originalLabel=saveButton?.textContent||"この表示で保存";
    const record=normalizeMemberImageRecord({
      ...imageEditDraft,
      positionX:imageEditDraft.positionX,
      positionY:imageEditDraft.positionY,
      zoom:imageEditDraft.zoom,
      updatedAt:new Date().toISOString()
    });
    try{
      if(saveButton){saveButton.disabled=true;saveButton.textContent="保存中…"}
      if(record.blob instanceof Blob && !record.dataUrl){
        try{record.dataUrl=await blobToDataUrl(record.blob)}catch(error){console.warn("DataURL生成に失敗しました",error)}
      }
      await imageDbRequest("readwrite",store=>store.put(record));
      const saved=await imageDbRequest("readonly",store=>store.get(record.memberId));
      if(!(saved?.blob instanceof Blob)&&!saved?.dataUrl)throw new Error("保存後の画像データを確認できませんでした");
      const verified=normalizeMemberImageRecord(saved);
      const samePosition=Math.abs(verified.positionX-record.positionX)<0.01&&Math.abs(verified.positionY-record.positionY)<0.01&&Math.abs(verified.zoom-record.zoom)<0.001;
      if(!samePosition)throw new Error("位置設定の保存確認に失敗しました");
      await loadMemberImages();
      closeImageAdjustSheet();
      showActionToast(`画像設定を保存しました（左右 ${Math.round(verified.positionX)}・上下 ${Math.round(verified.positionY)}・${Math.round(verified.zoom*100)}%）`);
    }catch(error){
      alert(`画像設定を保存できませんでした：${error.message}`);
    }finally{
      if(saveButton){saveButton.disabled=false;saveButton.textContent=originalLabel}
    }
  }

  async function deleteMemberImage(memberId){
    const member=MEMBERS.find(item=>item.id===memberId);
    if(!member||!memberImageRecord(memberId))return;
    if(!confirm(`${member.name}の設定画像をこの端末から削除しますか？`))return;
    try{
      await imageDbRequest("readwrite",store=>store.delete(memberId));
      removeMemberImageCache(memberId);
      renderMemberImages();
      renderHomeMembers();
      if(state.page==="oshi")renderOshi();
      showActionToast("設定画像を削除しました");
    }catch(error){
      alert(`画像を削除できませんでした：${error.message}`);
    }
  }

  async function deleteAllMemberImages(){
    if(!memberImageRecords.size)return;
    if(!confirm(`設定済みのメンバー画像 ${memberImageRecords.size}件を、この端末からすべて削除しますか？\n所持データや推し設定は削除されません。`))return;
    try{
      await imageDbRequest("readwrite",store=>store.clear());
      memberImageUrls.forEach(url=>{if(url?.startsWith("blob:"))URL.revokeObjectURL(url)});
      memberImageUrls.clear();
      memberImageRecords.clear();
      renderMemberImages();
      renderHomeMembers();
      if(state.page==="oshi")renderOshi();
      showActionToast("メンバー画像をすべて削除しました");
    }catch(error){
      alert(`画像を削除できませんでした：${error.message}`);
    }
  }

  function renderMemberImages(){
    const page=$("memberImagesPage");
    if(!page)return;
    if(!memberImagesReady){
      page.innerHTML=`<div class="page-head"><h2>🖼️ メンバー画像設定</h2><p>端末内の画像保存領域を読み込んでいます</p></div><div class="panel image-loading-panel">読み込み中…</div>`;
      return;
    }
    if(memberImageLoadError){
      page.innerHTML=`<div class="page-head"><h2>🖼️ メンバー画像設定</h2><p>端末内だけで好きな画像を表示します</p></div><div class="panel image-storage-error"><b>画像保存機能を利用できません</b><p>${esc(memberImageLoadError)}</p></div>`;
      return;
    }
    const cards=rankedMembers(MEMBERS).map(member=>{
      const record=memberImageRecord(member.id),url=memberImageUrl(member.id);
      const preview=record&&url
        ?`<div class="member-image-setting-preview has-photo"><img src="${esc(url)}" alt="" style="${memberImageStyle(record)}"></div>`
        :`<div class="member-image-setting-preview" style="background:linear-gradient(135deg,${member.soft},#fff)"><span>${member.emoji}</span></div>`;
      return `<article class="member-image-setting-card" style="--member-accent:${member.accent};--member-soft:${member.soft}">
        ${preview}
        <div class="member-image-setting-info">
          <b>${member.emoji} ${esc(member.name)}</b>
          <span>${record?`設定済み・左右${Math.round(record.positionX)}／上下${Math.round(record.positionY)}／${Math.round(record.zoom*100)}%・${formatImageBytes(record.blob.size)}`:"画像未設定"}</span>
          ${isGraduated(member)?'<small>卒業メンバー</small>':""}
        </div>
        <div class="member-image-setting-actions">
          <button data-image-select="${esc(member.id)}">${record?"画像を変更":"画像を選択"}</button>
          ${record?`<button data-image-adjust="${esc(member.id)}">位置調整</button><button class="danger" data-image-delete="${esc(member.id)}">削除</button>`:""}
        </div>
      </article>`;
    }).join("");
    page.innerHTML=`
      <div class="page-head"><h2>🖼️ メンバー画像設定</h2><p>メンバーごとに好きな画像を設定できます</p></div>
      <div class="panel local-image-policy">
        <h3>🔒 この端末内だけに保存</h3>
        <p>選択した画像はIndexedDBを使用して、この端末のブラウザ内だけに保存します。GitHubや外部サーバーへの送信、運営者による収集・閲覧、ほかの利用者への配布は行いません。</p>
        <p>画像は通常のバックアップJSONには含まれません。画像の権利と入手元をご確認のうえ、個人利用の範囲で使用してください。画像を含む画面のSNS投稿や第三者への共有は、利用者自身の責任で判断してください。</p>
      </div>
      <div class="member-image-summary">
        <div><b>${memberImageRecords.size}</b><span>画像設定済み</span></div>
        <div><b>${formatImageBytes(imageBytesTotal())}</b><span>端末内使用量</span></div>
      </div>
      <div class="member-image-settings-list">${cards}</div>
      ${memberImageRecords.size?`<div class="panel member-image-danger-panel"><h3>画像設定をリセット</h3><p>所持データ・直筆・欲しい・推し設定は残したまま、端末内のメンバー画像だけを削除します。</p><button id="deleteAllMemberImagesButton">すべての画像を削除</button></div>`:""}
      <div class="settings-page-bottom-space" aria-hidden="true"></div>`;
    document.querySelectorAll("[data-image-select]").forEach(button=>button.onclick=()=>chooseMemberImage(button.dataset.imageSelect));
    document.querySelectorAll("[data-image-adjust]").forEach(button=>button.onclick=()=>openImageAdjustSheet(button.dataset.imageAdjust));
    document.querySelectorAll("[data-image-delete]").forEach(button=>button.onclick=()=>deleteMemberImage(button.dataset.imageDelete));
    const deleteAllButton=$("deleteAllMemberImagesButton");
    if(deleteAllButton)deleteAllButton.onclick=deleteAllMemberImages;
  }

  let pendingScrollTarget="";
  function recordRecentEdit(eventId,memberId){
    if(!eventId||!memberId)return;
    const items=safeStorageArray(RECENT_KEY).filter(item=>!(item.eventId===eventId&&item.memberId===memberId));
    items.unshift({eventId,memberId,updatedAt:new Date().toISOString()});
    localStorage.setItem(RECENT_KEY,JSON.stringify(items.slice(0,5)));
  }
  function renderRecentEvents(){
    const section=$("recentDashboardSection"),list=$("recentEventList");
    if(!section||!list)return;
    const items=safeStorageArray(RECENT_KEY).map(item=>({
      ...item,
      event:EVENTS.find(e=>e.id===item.eventId),
      member:MEMBERS.find(m=>m.id===item.memberId)
    })).filter(item=>item.event&&item.member);
    section.classList.toggle("hidden",!items.length);
    list.innerHTML=items.map(item=>`<button class="recent-event-card" data-recent-event="${esc(item.eventId)}" data-recent-member="${esc(item.memberId)}"><span class="recent-member">${item.member.emoji} ${esc(item.member.name)}</span><b>${esc(item.event.period||item.event.officialName)}</b><small>${esc(item.event.work||item.event.category)}</small><i>›</i></button>`).join("");
    list.querySelectorAll("[data-recent-event]").forEach(button=>button.onclick=()=>openRecentEvent(button.dataset.recentEvent,button.dataset.recentMember));
  }
  function openRecentEvent(eventId,memberId){
    const member=MEMBERS.find(m=>m.id===memberId);
    if(!member)return;
    state.mode="member";state.memberId=memberId;state.pageMemberId=memberId;
    state.search="";state.category="";state.yearFilter="";state.ownership="";state.newFilter="";
    pendingScrollTarget=eventId;
    savePreferences();theme(member);openManager();
  }
  function scrollContextKey(){
    return `${state.mode}:${state.memberId||"all"}:${state.page}`;
  }
  function getScrollMemory(){
    try{const value=JSON.parse(sessionStorage.getItem(SCROLL_KEY)||"{}");return value&&typeof value==="object"?value:{}}
    catch(error){return {}}
  }
  function saveScrollPosition(){
    if($("managerScreen")?.classList.contains("hidden"))return;
    const memory=getScrollMemory();memory[scrollContextKey()]=Math.max(0,Math.round(window.scrollY));
    sessionStorage.setItem(SCROLL_KEY,JSON.stringify(memory));
  }
  function restoreScrollPosition(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(pendingScrollTarget){
        const target=[...document.querySelectorAll("[data-event-id]")].find(node=>node.dataset.eventId===pendingScrollTarget);
        pendingScrollTarget="";
        if(target){target.scrollIntoView({block:"start"});return}
      }
      const top=Number(getScrollMemory()[scrollContextKey()]||0);
      window.scrollTo(0,top);
    }));
  }
  function k(e,m,p){return `${e}__${m}__${p}`} function getCount(e,m,p){return Number(state.counts[k(e,m,p)]||0)}
  function setCount(e,m,p,n){const x=k(e,m,p);if(n<=0)delete state.counts[x];else state.counts[x]=n;localStorage.setItem(COUNT_KEY,JSON.stringify(state.counts));recordRecentEdit(e,m)}
  function isSigned(e,m,p){return !!state.signs[k(e,m,p)]} function toggleSign(e,m,p){const x=k(e,m,p);state.signs[x]?delete state.signs[x]:state.signs[x]=true;localStorage.setItem(SIGN_KEY,JSON.stringify(state.signs));recordRecentEdit(e,m)}
  function isWanted(e,m,p){return !!state.wants[k(e,m,p)]} function toggleWant(e,m,p){const x=k(e,m,p);state.wants[x]?delete state.wants[x]:state.wants[x]=true;localStorage.setItem(WANT_KEY,JSON.stringify(state.wants));recordRecentEdit(e,m)}
  const OSHI_RANKS={favorite:{label:"最推し",icon:"👑",weight:3},oshi:{label:"推し",icon:"⭐",weight:2},interest:{label:"気になる",icon:"♡",weight:1}};
  function oshiRank(id){return state.oshis[id]||""}
  function isOshi(id){return !!oshiRank(id)}
  function rankedMembers(list=MEMBERS){return [...list].sort((a,b)=>(a.kana||a.name).localeCompare(b.kana||b.name,"ja"))}
  function setOshiRank(id,rank){
    if(rank==="favorite")Object.keys(state.oshis).forEach(key=>{if(state.oshis[key]==="favorite")delete state.oshis[key]});
    if(rank)state.oshis[id]=rank;else delete state.oshis[id];
    localStorage.setItem(OSHI_KEY,JSON.stringify(state.oshis));
  }
  function oshiBadge(m){const rank=OSHI_RANKS[oshiRank(m.id)];return rank?`<span class="oshi-badge rank-${oshiRank(m.id)}">${rank.icon} ${rank.label}</span>`:""}

  function esc(v){return String(v||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
  function yearOf(e){const s=(e.period||e.id||"").match(/20\d{2}/);return s?s[0]:"不明"}
  function yearOptions(selected="",allLabel="すべての年代"){
    const years=[...new Set(EVENTS.map(yearOf).filter(y=>y!=="不明"))].sort((a,b)=>Number(b)-Number(a));
    return `<option value="">${allLabel}</option>`+years.map(y=>`<option value="${y}" ${String(selected)===String(y)?"selected":""}>${y}年</option>`).join("");
  }
  function normalizeText(value){return String(value||"").toLowerCase().replace(/[\s　・･「」『』（）()【】\-_.]/g,"")}
  function eventSearchText(e){
    const parts=String(e.id||"").match(/(20\d{2})-(\d{2})/);
    const aliases=parts?[`${parts[1]}/${Number(parts[2])}`,`${parts[1]}年${Number(parts[2])}月`,`${parts[1]}${parts[2]}`]:[];
    return normalizeText([e.period,e.work,e.officialName,e.id,e.category,...aliases].join(" "));
  }
  function newestSortThreshold(){
    const count=Number(APP_CONFIG.newItemCount||12);
    return [...EVENTS].sort((a,b)=>b.sort-a.sort)[Math.max(0,count-1)]?.sort||Infinity;
  }
  function isNewEvent(e){return Number(e.sort)>=newestSortThreshold()}
  function isGraduated(m){return m?.status==="graduated"}
  function eventAvailableForMember(e,m){
    if(!m)return true;
    const include=Array.isArray(m.includeEventIds)?m.includeEventIds:[];
    const exclude=Array.isArray(m.excludeEventIds)?m.excludeEventIds:[];
    if(exclude.includes(e.id))return false;
    if(include.includes(e.id))return true;
    return !isGraduated(m)||Number(e.sort)<=Number(m.maxSort);
  }
  function eligibleEventsForMember(m,events=EVENTS){return events.filter(e=>eventAvailableForMember(e,m))}
  function eligibleMembersForEvent(e){const base=state.oshiOnly?MEMBERS.filter(m=>isOshi(m.id)):MEMBERS;return base.filter(m=>eventAvailableForMember(e,m))}
  function scopeMembers(){
    if(state.page!=="collection"&&state.pageMemberId)return MEMBERS.filter(m=>m.id===state.pageMemberId);
    const base=state.mode==="all"?MEMBERS:MEMBERS.filter(m=>m.id===state.memberId);
    return state.oshiOnly?base.filter(m=>isOshi(m.id)):base;
  }
  function pageMemberOptions(){
    const active=MEMBERS.filter(m=>!isGraduated(m)).map(m=>`<option value="${m.id}" ${state.pageMemberId===m.id?"selected":""}>${m.emoji} ${m.name}</option>`).join("");
    const graduated=MEMBERS.filter(isGraduated).map(m=>`<option value="${m.id}" ${state.pageMemberId===m.id?"selected":""}>${m.emoji} ${m.name}（卒業）</option>`).join("");
    return `<option value="">全メンバー</option><optgroup label="現役メンバー">${active}</optgroup><optgroup label="卒業メンバー">${graduated}</optgroup>`;
  }
  function bindPageMemberFilter(){
    const el=document.getElementById("pageMemberFilter");
    if(el)el.onchange=e=>{state.pageMemberId=e.target.value;if(state.page==="stats")renderStats();if(state.page==="wishlist")renderWishlist();if(state.page==="trade")renderTrade()};
  }
  function eventOwnershipMatches(e){
    if(!state.ownership||state.mode==="all")return true;
    const counts=POSITIONS.map(p=>getCount(e.id,state.memberId,p.id));
    return state.ownership==="owned"?counts.some(n=>n>0):counts.every(n=>n===0);
  }
  function memberTotal(id){let t=0;const m=MEMBERS.find(x=>x.id===id);eligibleEventsForMember(m).forEach(e=>POSITIONS.forEach(p=>t+=getCount(e.id,id,p.id)));return t}
  function collectionFilterEntries(){
    const entries=[];
    if(state.yearFilter)entries.push({key:"year",label:`${state.yearFilter}年`});
    if(state.category)entries.push({key:"category",label:state.category});
    if(state.mode!=="all"&&state.ownership)entries.push({key:"ownership",label:state.ownership==="owned"?"所持あり":"未所持"});
    if(state.newFilter==="new")entries.push({key:"new",label:"NEWのみ"});
    if(state.mode==="all"&&state.oshiOnly)entries.push({key:"oshi",label:"推しだけ"});
    return entries;
  }
  function listFilterEntries(page){
    if(page==="wishlist"){
      const entries=[];
      if(state.pageMemberId){const m=MEMBERS.find(x=>x.id===state.pageMemberId);if(m)entries.push({key:"member",label:`${m.emoji} ${m.name}`})}
      if(state.wishlistYear)entries.push({key:"year",label:`${state.wishlistYear}年`});
      return entries;
    }
    if(page==="trade"){
      const entries=[];
      if(state.pageMemberId){const m=MEMBERS.find(x=>x.id===state.pageMemberId);if(m)entries.push({key:"member",label:`${m.emoji} ${m.name}`})}
      if(state.tradeYear)entries.push({key:"year",label:`${state.tradeYear}年`});
      return entries;
    }
    if(page==="missing"){
      const entries=[];
      if(state.missingMemberId){const m=MEMBERS.find(x=>x.id===state.missingMemberId);if(m)entries.push({key:"member",label:`${m.emoji} ${m.name}`})}
      if(state.missingPositionId){const p=POSITIONS.find(x=>x.id===state.missingPositionId);if(p)entries.push({key:"position",label:p.name})}
      if(state.missingYear)entries.push({key:"year",label:`${state.missingYear}年`});
      if(state.oshiOnly)entries.push({key:"oshi",label:"推しだけ"});
      return entries;
    }
    return [];
  }
  function sortLabel(page){
    const order=page==="collection"?state.sort:
      page==="wishlist"?state.wishlistOrder:
      page==="trade"?state.tradeOrder:
      page==="quick"?state.quickOrder:
      page==="matrix"?state.matrixOrder:
      state.missingEventOrder;
    if(order==="asc")return "古い順";
    if(order==="new")return "NEW優先";
    return "新しい順";
  }
  function filterChipsHtml(entries,page){
    return entries.map(item=>`<button class="active-filter-chip" data-filter-page="${page}" data-filter-key="${item.key}">${esc(item.label)} <span>×</span></button>`).join("");
  }
  function listToolbarHtml(page){
    const entries=listFilterEntries(page);
    return `<div class="unified-list-tools">
      <div class="unified-filter-toolbar">
        <button class="filter-action-button" data-open-filter="${page}"><span>⚙️</span><b>絞り込み</b>${entries.length?`<i class="filter-count">${entries.length}</i>`:""}</button>
        <button class="filter-action-button" data-open-sort="${page}"><span>↕</span><b>${sortLabel(page)}</b></button>
      </div>
      <div class="active-filter-chips">${filterChipsHtml(entries,page)}</div>
    </div>`;
  }
  function renderCollectionFilterUi(){
    const entries=collectionFilterEntries();
    const count=$("collectionFilterCount");
    if(count){count.textContent=entries.length;count.classList.toggle("hidden",!entries.length)}
    const label=$("collectionSortLabel");if(label)label.textContent=sortLabel("collection");
    const chips=$("collectionFilterChips");if(chips)chips.innerHTML=filterChipsHtml(entries,"collection");
    bindFilterChipButtons();
  }
  function bindListToolbar(page){
    document.querySelectorAll(`[data-open-filter="${page}"]`).forEach(button=>button.onclick=()=>openFilterSheet(page));
    document.querySelectorAll(`[data-open-sort="${page}"]`).forEach(button=>button.onclick=()=>openSortSheet(page));
    bindFilterChipButtons();
  }
  function bindFilterChipButtons(){
    document.querySelectorAll("[data-filter-page][data-filter-key]").forEach(button=>{
      button.onclick=()=>removeFilterChip(button.dataset.filterPage,button.dataset.filterKey);
    });
  }
  function removeFilterChip(page,key){
    if(page==="collection"){
      if(key==="year")state.yearFilter="";
      if(key==="category")state.category="";
      if(key==="ownership")state.ownership="";
      if(key==="new")state.newFilter="";
      if(key==="oshi")state.oshiOnly=false;
      savePreferences();renderCollection();return;
    }
    if(page==="wishlist"){
      if(key==="member")state.pageMemberId="";
      if(key==="year")state.wishlistYear="";
      savePreferences();renderWishlist();return;
    }
    if(page==="trade"){
      if(key==="member")state.pageMemberId="";
      if(key==="year")state.tradeYear="";
      savePreferences();renderTrade();return;
    }
    if(page==="missing"){
      if(key==="member")state.missingMemberId="";
      if(key==="position")state.missingPositionId="";
      if(key==="year")state.missingYear="";
      if(key==="oshi")state.oshiOnly=false;
      savePreferences();renderMissing();
    }
  }
  let activeFilterPage="collection";
  function filterSheetField(label,content){return `<label class="sheet-field"><span>${label}</span>${content}</label>`}
  function filterSheetToggle(id,label,checked){return `<label class="sheet-toggle"><input id="${id}" type="checkbox" ${checked?"checked":""}><span>${label}</span></label>`}
  function openFilterSheet(page="collection"){
    activeFilterPage=page;
    const body=$("filterSheetBody");
    $("filterSheetTitle").textContent=page==="collection"?"生写真一覧の絞り込み":page==="wishlist"?"欲しい一覧の絞り込み":page==="trade"?"提供可能一覧の絞り込み":"未所持一覧の絞り込み";
    if(page==="collection"){
      body.innerHTML=`
        ${filterSheetField("年代",`<select id="sheetYear">${yearOptions(state.yearFilter)}</select>`)}
        ${filterSheetField("カテゴリ",`<select id="sheetCategory"><option value="">すべて</option><option value="通常" ${state.category==="通常"?"selected":""}>通常</option><option value="イベント" ${state.category==="イベント"?"selected":""}>イベント</option><option value="コラボ" ${state.category==="コラボ"?"selected":""}>コラボ</option></select>`)}
        ${state.mode!=="all"?filterSheetField("所持状況",`<select id="sheetOwnership"><option value="">すべて</option><option value="owned" ${state.ownership==="owned"?"selected":""}>所持ありのみ</option><option value="unowned" ${state.ownership==="unowned"?"selected":""}>未所持のみ</option></select>`):""}
        <div class="sheet-toggle-group">${filterSheetToggle("sheetNew","NEWのみ",state.newFilter==="new")}${state.mode==="all"?filterSheetToggle("sheetOshi","推しだけ表示",state.oshiOnly):""}</div>`;
    }else if(page==="wishlist"||page==="trade"){
      const selectedYear=page==="wishlist"?state.wishlistYear:state.tradeYear;
      body.innerHTML=`
        ${filterSheetField("メンバー",`<select id="sheetMember">${pageMemberOptions()}</select>`)}
        ${filterSheetField("年代",`<select id="sheetYear">${yearOptions(selectedYear)}</select>`)}`;
    }else{
      body.innerHTML=`
        ${filterSheetField("メンバー",`<select id="sheetMissingMember">${missingMemberOptions()}</select>`)}
        ${filterSheetField("ポジション",`<select id="sheetPosition">${missingPositionOptions()}</select>`)}
        ${filterSheetField("年代",`<select id="sheetYear">${yearOptions(state.missingYear)}</select>`)}
        <div class="sheet-toggle-group">${filterSheetToggle("sheetOshi","推しだけ表示",state.oshiOnly)}</div>`;
    }
    openUtilitySheet("filterSheetOverlay");
  }
  function clearFilterSheet(){
    if(activeFilterPage==="collection"){
      ["sheetYear","sheetCategory","sheetOwnership"].forEach(id=>{const el=$(id);if(el)el.value=""});
      ["sheetNew","sheetOshi"].forEach(id=>{const el=$(id);if(el)el.checked=false});
    }else if(activeFilterPage==="wishlist"||activeFilterPage==="trade"){
      const member=$("sheetMember"),year=$("sheetYear");if(member)member.value="";if(year)year.value="";
    }else{
      const member=$("sheetMissingMember"),position=$("sheetPosition"),year=$("sheetYear"),oshi=$("sheetOshi");
      if(member)member.value="";if(position)position.value="";if(year)year.value="";if(oshi)oshi.checked=false;
    }
  }
  function applyFilterSheet(){
    if(activeFilterPage==="collection"){
      state.yearFilter=$("sheetYear")?.value||"";
      state.category=$("sheetCategory")?.value||"";
      state.ownership=$("sheetOwnership")?.value||"";
      state.newFilter=$("sheetNew")?.checked?"new":"";
      if($("sheetOshi"))state.oshiOnly=$("sheetOshi").checked;
      savePreferences();closeUtilitySheet("filterSheetOverlay");renderCollection();
    }else if(activeFilterPage==="wishlist"){
      state.pageMemberId=$("sheetMember")?.value||"";
      state.wishlistYear=$("sheetYear")?.value||"";
      savePreferences();closeUtilitySheet("filterSheetOverlay");renderWishlist();
    }else if(activeFilterPage==="trade"){
      state.pageMemberId=$("sheetMember")?.value||"";
      state.tradeYear=$("sheetYear")?.value||"";
      savePreferences();closeUtilitySheet("filterSheetOverlay");renderTrade();
    }else{
      state.missingMemberId=$("sheetMissingMember")?.value||"";
      state.missingPositionId=$("sheetPosition")?.value||"";
      state.missingYear=$("sheetYear")?.value||"";
      state.oshiOnly=$("sheetOshi")?.checked||false;
      savePreferences();closeUtilitySheet("filterSheetOverlay");renderMissing();
    }
  }
  let activeSortPage="collection";
  function openSortSheet(page="collection"){
    activeSortPage=page;
    const current=page==="collection"?state.sort:
      page==="wishlist"?state.wishlistOrder:
      page==="trade"?state.tradeOrder:
      page==="quick"?state.quickOrder:
      page==="matrix"?state.matrixOrder:
      state.missingEventOrder;
    const choices=page==="collection"?[["desc","新しい順"],["asc","古い順"],["new","NEW優先"]]:[["desc","新しい順"],["asc","古い順"]];
    $("sortSheetBody").innerHTML=`<div class="sort-choice-list">${choices.map(([value,label])=>`<button class="sort-choice ${current===value?"selected":""}" data-sort-value="${value}"><span>${label}</span><i>${current===value?"✓":""}</i></button>`).join("")}</div>`;
    document.querySelectorAll("[data-sort-value]").forEach(button=>button.onclick=()=>applySortChoice(button.dataset.sortValue));
    openUtilitySheet("sortSheetOverlay");
  }
  function applySortChoice(value){
    if(activeSortPage==="collection"){state.sort=value;savePreferences();renderCollection()}
    if(activeSortPage==="wishlist"){state.wishlistOrder=value;savePreferences();renderWishlist()}
    if(activeSortPage==="trade"){state.tradeOrder=value;savePreferences();renderTrade()}
    if(activeSortPage==="quick"){state.quickOrder=value;savePreferences();renderQuick()}
    if(activeSortPage==="matrix"){state.matrixOrder=value;savePreferences();renderMatrix()}
    if(activeSortPage==="missing"){state.missingEventOrder=value;savePreferences();renderMissing()}
    closeUtilitySheet("sortSheetOverlay");
  }
  function openUtilitySheet(id){
    const overlay=$(id);overlay.classList.remove("hidden");overlay.setAttribute("aria-hidden","false");document.body.classList.add("utility-sheet-open");
  }
  function closeUtilitySheet(id){
    const overlay=$(id);if(!overlay)return;
    const sheet=overlay.querySelector(".utility-sheet");
    if(sheet){sheet.classList.remove("swiping");sheet.style.transform=""}
    overlay.style.background="";
    overlay.classList.add("hidden");overlay.setAttribute("aria-hidden","true");document.body.classList.remove("utility-sheet-open");
  }
  function setupUtilitySheetSwipe(id){
    const overlay=$(id),sheet=overlay?.querySelector(".utility-sheet"),body=overlay?.querySelector(".utility-sheet-body");
    if(!overlay||!sheet||!body)return;
    let startY=0,startX=0,deltaY=0,active=false;
    const reset=()=>{active=false;deltaY=0;sheet.classList.remove("swiping");sheet.style.transform="";overlay.style.background=""};
    sheet.addEventListener("touchstart",event=>{
      if(event.touches.length!==1||body.scrollTop>0)return;
      startY=event.touches[0].clientY;startX=event.touches[0].clientX;deltaY=0;active=true;
    },{passive:true});
    sheet.addEventListener("touchmove",event=>{
      if(!active||event.touches.length!==1)return;
      const dy=event.touches[0].clientY-startY,dx=Math.abs(event.touches[0].clientX-startX);
      if(dy<=0||dy<dx)return;
      deltaY=Math.min(dy,320);sheet.classList.add("swiping");sheet.style.transform=`translateY(${deltaY}px)`;
      overlay.style.background=`rgba(48,29,39,${Math.max(.08,.42-deltaY/700)})`;event.preventDefault();
    },{passive:false});
    sheet.addEventListener("touchend",()=>{
      if(!active)return;
      if(deltaY>=90){sheet.style.transform="translateY(110%)";setTimeout(()=>{closeUtilitySheet(id);reset()},140)}
      else reset();
    },{passive:true});
    sheet.addEventListener("touchcancel",reset,{passive:true});
  }
  function filtered(){
    const q=normalizeText(state.search);
    const base=state.mode==="member"?eligibleEventsForMember(MEMBERS.find(m=>m.id===state.memberId)):EVENTS;
    return base
      .filter(e=>!state.category||e.category===state.category)
      .filter(e=>!state.yearFilter||yearOf(e)===state.yearFilter)
      .filter(eventOwnershipMatches)
      .filter(e=>state.newFilter!=="new"||isNewEvent(e))
      .filter(e=>!q||eventSearchText(e).includes(q))
      .sort((a,b)=>{
        if(state.sort==="asc")return a.sort-b.sort;
        if(state.sort==="new"){
          const newDiff=Number(isNewEvent(b))-Number(isNewEvent(a));
          return newDiff||b.sort-a.sort;
        }
        return b.sort-a.sort;
      });
  }
  function theme(m){document.documentElement.style.setProperty("--accent",m?.accent||"#ef7fad");document.documentElement.style.setProperty("--soft",m?.soft||"#fff0f6");document.documentElement.style.setProperty("--page",m?.soft||"#fff8fb")}
    let pendingMemberDestination="collection";
  function openMemberSelector(destination="collection"){
    pendingMemberDestination=destination||"collection";
    const quick=pendingMemberDestination==="quick";
    $("memberSelectorTitle").textContent=quick?"クイック入力するメンバー":"メンバーを選ぶ";
    const description=$("memberSelectorTitle").parentElement.querySelector("p");
    if(description)description.textContent=quick?"購入した生写真を登録するメンバーを選択してください":"所持状況を管理するメンバーを選択してください";
    const overlay=$("memberSelectorOverlay");
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden","false");
    document.body.classList.add("selector-open");
  }
  function closeMemberSelector(){
    const overlay=$("memberSelectorOverlay");
    if(!overlay)return;
    const sheet=overlay.querySelector(".member-selector-sheet");
    if(sheet){
      sheet.classList.remove("swiping");
      sheet.style.transform="";
    }
    overlay.style.background="";
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden","true");
    document.body.classList.remove("selector-open");
  }
function openMember(id){
    const destination=pendingMemberDestination||"collection";
    pendingMemberDestination="collection";
    closeMemberSelector();
    state.mode="member";
    state.memberId=id;
    state.pageMemberId=id;
    savePreferences();
    theme(MEMBERS.find(m=>m.id===id));
    openManager(destination);
  }
  function openAll(){
    state.mode="all";
    state.memberId=null;
    state.pageMemberId="";
    state.oshiOnly=false;
    savePreferences();
    theme(null);
    openManager();
    const filter=document.getElementById("oshiFilter");
    if(filter)filter.value="";
  }
  function openManager(page="collection"){$("homeScreen").classList.add("hidden");$("managerScreen").classList.remove("hidden");showPage(page,true)}
  function updateHeader(){const m=MEMBERS.find(x=>x.id===state.memberId);$("memberTitle").textContent=state.mode==="all"?"🌈 全メンバー":m?`${m.emoji} ${m.name}`:"生写真管理";const labels={collection:"生写真コレクション",quick:"クイック入力",matrix:"イベント別チェック表",stats:"統計・年代別コンプ率",wishlist:"欲しい生写真一覧",trade:"ダブり・提供可能一覧",missing:"未所持一覧",oshi:"推しカスタマイズ",help:"使い方",about:"バージョン情報",legal:"本サイトについて・利用上の注意",backup:"バックアップ・復元"};const pageLabel=labels[state.page]||"生写真管理";$("memberSub").textContent=state.mode==="member"&&m&&isGraduated(m)?`${m.graduation}｜${pageLabel}`:pageLabel}
  function showPage(page,skipScrollSave=false){
    if(!skipScrollSave)saveScrollPosition();
    if($("homeScreen").classList.contains("hidden")===false){state.mode="all";state.memberId=null;theme(null);$("homeScreen").classList.add("hidden");$("managerScreen").classList.remove("hidden")}
    state.page=page;
    ["collection","quick","matrix","stats","wishlist","trade","missing","oshi","memberImages","backup","help","legal","about"].forEach(p=>$(p+"Page").classList.toggle("hidden",p!==page));
    $("managerTools").classList.toggle("hidden",page!=="collection");
    document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
    updateHeader();
    if(page==="collection")renderCollection();
    if(page==="quick")renderQuick();
    if(page==="matrix")renderMatrix();
    if(page==="stats")renderStats();
    if(page==="wishlist")renderWishlist();
    if(page==="trade")renderTrade();
    if(page==="missing")renderMissing();
    if(page==="oshi")renderOshi();
    if(page==="memberImages")renderMemberImages();
    if(page==="backup")renderBackup();
    if(page==="help")renderHelp();
    if(page==="legal")renderLegal();
    if(page==="about")renderAbout();
    restoreScrollPosition();
  }
  function modeEventList(kind){
    const member=kind==="quick"?MEMBERS.find(m=>m.id===state.memberId):null;
    const source=kind==="quick"?eligibleEventsForMember(member):EVENTS;
    const search=normalizeText(kind==="quick"?state.quickSearch:state.matrixSearch);
    const year=kind==="quick"?state.quickYear:state.matrixYear;
    const order=kind==="quick"?state.quickOrder:state.matrixOrder;
    return source
      .filter(e=>!year||yearOf(e)===year)
      .filter(e=>!search||eventSearchText(e).includes(search))
      .sort((a,b)=>order==="desc"?b.sort-a.sort:a.sort-b.sort);
  }
  function ensureSelectedEvent(kind,list){
    const key=kind==="quick"?"quickEventId":"matrixEventId";
    if(!list.length){state[key]="";return null}
    if(!list.some(e=>e.id===state[key]))state[key]=list[0].id;
    return list.find(e=>e.id===state[key])||list[0];
  }
  function eventSelectOptions(list,selected){return list.map(e=>`<option value="${esc(e.id)}" ${e.id===selected?"selected":""}>${esc(e.period)}｜${esc(e.work||e.officialName)}</option>`).join("")}
  function focusSearchAfterRender(id,position){requestAnimationFrame(()=>{const input=$(id);if(input){input.focus();try{input.setSelectionRange(position,position)}catch(error){}}})}
  function openQuickInput(){
    if(state.mode!=="member"||!state.memberId){renderHomeMembers();openMemberSelector("quick");return}
    showPage("quick");
  }
  function openEventMatrix(){
    state.mode="all";state.memberId=null;state.pageMemberId="";theme(null);savePreferences();openManager("matrix");
  }
  function moveModeEvent(kind,direction){
    const list=modeEventList(kind),key=kind==="quick"?"quickEventId":"matrixEventId";
    const index=Math.max(0,list.findIndex(e=>e.id===state[key]));
    const next=Math.min(list.length-1,Math.max(0,index+direction));
    if(list[next]){state[key]=list[next].id;savePreferences();kind==="quick"?renderQuick():renderMatrix()}
  }
  function renderQuick(){
    const member=MEMBERS.find(m=>m.id===state.memberId);
    if(!member){openMemberSelector("quick");return}
    const list=modeEventList("quick"),event=ensureSelectedEvent("quick",list),index=event?list.findIndex(e=>e.id===event.id):-1;
    $("quickPage").innerHTML=`<div class="page-head mode-page-head"><div><h2>⚡ クイック入力</h2><p>${member.emoji} ${esc(member.name)}｜購入後の登録を素早く行えます</p></div><button id="quickBackToList" class="mode-back-button">一覧へ</button></div>
      <div class="mode-filter-grid mode-filter-grid-with-sort"><div class="searchbox"><span>🔍</span><input id="quickSearchInput" type="search" value="${esc(state.quickSearch)}" placeholder="イベント名を検索"></div><select id="quickYearFilter">${yearOptions(state.quickYear)}</select><button id="quickSortButton" class="mode-sort-button"><span>↕</span>${sortLabel("quick")}</button></div>
      ${list.length?`<select id="quickEventSelect" class="mode-event-select">${eventSelectOptions(list,event.id)}</select>
      <article id="quickSwipeCard" class="quick-input-card">
        <div class="quick-event-head"><div><span>${esc(event.period)}</span><h3>${esc(event.work||event.officialName)}</h3><small>${esc(event.category)}｜${index+1}/${list.length}</small></div><button id="quickBulkButton" class="card-bulk-button">⋯ 一括操作</button></div>
        <div id="quickPositionList" class="quick-position-list"></div>
        <div class="quick-nav-row"><button id="quickPreviousButton" ${index<=0?"disabled":""}>← 前へ</button><button id="quickNextButton" ${index>=list.length-1?"disabled":""}>次へ →</button></div>
      </article>`:'<div class="empty-state"><span>🔍</span><h3>該当するイベントがありません</h3><p>検索語または年代を変更してください。</p></div>'}`;
    $("quickBackToList").onclick=()=>showPage("collection");
    const search=$("quickSearchInput");search.oninput=e=>{state.quickSearch=e.target.value;savePreferences();const pos=e.target.selectionStart;renderQuick();focusSearchAfterRender("quickSearchInput",pos)};
    $("quickYearFilter").onchange=e=>{state.quickYear=e.target.value;savePreferences();renderQuick()};
    $("quickSortButton").onclick=()=>openSortSheet("quick");
    if(!event)return;
    $("quickEventSelect").onchange=e=>{state.quickEventId=e.target.value;savePreferences();renderQuick()};
    const positionList=$("quickPositionList");
    POSITIONS.forEach(p=>{
      const row=document.createElement("div");row.className="quick-position-row";
      row.innerHTML=`<div class="quick-position-title"><b>${esc(p.name)}</b><small>${getCount(event.id,member.id,p.id)>0?"所持済み":"未所持"}</small></div><div class="quick-stepper"><button class="minus">−</button><strong>${getCount(event.id,member.id,p.id)}</strong><button class="plus">＋</button></div><button class="quick-toggle want ${isWanted(event.id,member.id,p.id)?"on":""}">♡</button><button class="quick-toggle sign ${isSigned(event.id,member.id,p.id)?"on":""}">✍️</button>`;
      row.querySelector(".minus").onclick=()=>{setCount(event.id,member.id,p.id,Math.max(0,getCount(event.id,member.id,p.id)-1));renderQuick()};
      row.querySelector(".plus").onclick=()=>{setCount(event.id,member.id,p.id,getCount(event.id,member.id,p.id)+1);renderQuick()};
      row.querySelector(".want").onclick=()=>{toggleWant(event.id,member.id,p.id);renderQuick()};
      row.querySelector(".sign").onclick=()=>{toggleSign(event.id,member.id,p.id);renderQuick()};
      positionList.appendChild(row);
    });
    $("quickPreviousButton").onclick=()=>moveModeEvent("quick",-1);$("quickNextButton").onclick=()=>moveModeEvent("quick",1);
    $("quickBulkButton").onclick=()=>openBulkSheet(event.id,member.id);
    const card=$("quickSwipeCard");let startX=0,startY=0;
    card.addEventListener("touchstart",e=>{if(e.touches.length===1){startX=e.touches[0].clientX;startY=e.touches[0].clientY}},{passive:true});
    card.addEventListener("touchend",e=>{const t=e.changedTouches?.[0];if(!t)return;const dx=t.clientX-startX,dy=Math.abs(t.clientY-startY);if(Math.abs(dx)>75&&Math.abs(dx)>dy*1.3)moveModeEvent("quick",dx<0?1:-1)},{passive:true});
  }
  function matrixMembersForEvent(event){return rankedMembers(MEMBERS.filter(m=>eventAvailableForMember(event,m)))}
  function renderMatrix(){
    const list=modeEventList("matrix"),event=ensureSelectedEvent("matrix",list),members=event?matrixMembersForEvent(event):[];
    $("matrixPage").innerHTML=`<div class="page-head mode-page-head"><div><h2>▦ イベント別チェック表</h2><p>全メンバーのヨリ・チュウ・ヒキを1画面で登録</p></div><button id="matrixBackToList" class="mode-back-button">一覧へ</button></div>
      <div class="mode-filter-grid mode-filter-grid-with-sort"><div class="searchbox"><span>🔍</span><input id="matrixSearchInput" type="search" value="${esc(state.matrixSearch)}" placeholder="イベント名を検索"></div><select id="matrixYearFilter">${yearOptions(state.matrixYear)}</select><button id="matrixSortButton" class="mode-sort-button"><span>↕</span>${sortLabel("matrix")}</button></div>
      ${list.length?`<select id="matrixEventSelect" class="mode-event-select">${eventSelectOptions(list,event.id)}</select>
      <div class="matrix-event-summary"><div><b>${esc(event.period)}</b><span>${esc(event.work||event.officialName)}</span></div><button id="matrixBulkButton" class="card-bulk-button">⋯ イベント一括操作</button></div>
      <div class="matrix-help">＋／−で枚数を変更。「3種」はそのメンバーの未所持だけを1枚にします。</div>
      <div class="matrix-table-wrap"><table class="matrix-table"><thead><tr><th>メンバー</th>${POSITIONS.map(p=>`<th>${esc(p.name)}</th>`).join("")}</tr></thead><tbody>${members.map(m=>`<tr><th><span>${m.emoji} ${esc(m.name)}</span>${isGraduated(m)?'<small>卒業</small>':''}<button data-matrix-complete="${esc(m.id)}">3種</button></th>${POSITIONS.map(p=>`<td><div class="matrix-stepper count-${Math.min(2,getCount(event.id,m.id,p.id))}"><button class="matrix-minus" data-member="${esc(m.id)}" data-position="${esc(p.id)}">−</button><b>${getCount(event.id,m.id,p.id)}</b><button class="matrix-plus" data-member="${esc(m.id)}" data-position="${esc(p.id)}">＋</button></div></td>`).join("")}</tr>`).join("")}</tbody></table></div>`:'<div class="empty-state"><span>🔍</span><h3>該当するイベントがありません</h3><p>検索語または年代を変更してください。</p></div>'}`;
    $("matrixBackToList").onclick=()=>showPage("collection");
    const search=$("matrixSearchInput");search.oninput=e=>{state.matrixSearch=e.target.value;savePreferences();const pos=e.target.selectionStart;renderMatrix();focusSearchAfterRender("matrixSearchInput",pos)};
    $("matrixYearFilter").onchange=e=>{state.matrixYear=e.target.value;savePreferences();renderMatrix()};
    $("matrixSortButton").onclick=()=>openSortSheet("matrix");
    if(!event)return;
    $("matrixEventSelect").onchange=e=>{state.matrixEventId=e.target.value;savePreferences();renderMatrix()};
    $("matrixBulkButton").onclick=()=>openBulkSheet(event.id,"");
    document.querySelectorAll(".matrix-minus").forEach(button=>button.onclick=()=>{setCount(event.id,button.dataset.member,button.dataset.position,Math.max(0,getCount(event.id,button.dataset.member,button.dataset.position)-1));renderMatrix()});
    document.querySelectorAll(".matrix-plus").forEach(button=>button.onclick=()=>{setCount(event.id,button.dataset.member,button.dataset.position,getCount(event.id,button.dataset.member,button.dataset.position)+1);renderMatrix()});
    document.querySelectorAll("[data-matrix-complete]").forEach(button=>button.onclick=()=>applyBulkAction("complete",event.id,button.dataset.matrixComplete,true));
  }
  let bulkTarget={eventId:"",memberId:""};
  function openBulkSheet(eventId,memberId=""){
    const event=EVENTS.find(e=>e.id===eventId),member=MEMBERS.find(m=>m.id===memberId);
    if(!event)return;
    bulkTarget={eventId,memberId};
    $("bulkSheetTitle").textContent=member?`${member.emoji} ${member.name}の一括操作`:"イベント一括操作";
    $("bulkSheetDescription").textContent=`${event.period}｜${event.work||event.officialName}`;
    const scope=member?"このメンバー":"対象メンバー全員";
    $("bulkSheetBody").innerHTML=`<div class="bulk-action-list">
      <button data-bulk-action="complete"><span>✅</span><div><b>3種を所持済みにする</b><small>${scope}の未所持だけを1枚にします</small></div><i>›</i></button>
      <button data-bulk-action="wantMissing"><span>♡</span><div><b>未所持を欲しいへ追加</b><small>${scope}の未所持だけを欲しい登録します</small></div><i>›</i></button>
      <button data-bulk-action="clearWants"><span>◇</span><div><b>欲しいをすべて解除</b><small>${scope}の欲しい登録を解除します</small></div><i>›</i></button>
      <button data-bulk-action="resetCounts" class="danger"><span>🗑️</span><div><b>所持数をすべて0にする</b><small>${scope}の枚数をリセットします</small></div><i>›</i></button>
    </div>`;
    document.querySelectorAll("[data-bulk-action]").forEach(button=>button.onclick=()=>applyBulkAction(button.dataset.bulkAction,eventId,memberId));
    openUtilitySheet("bulkSheetOverlay");
  }
  function applyBulkAction(action,eventId=bulkTarget.eventId,memberId=bulkTarget.memberId,skipSheet=false){
    const event=EVENTS.find(e=>e.id===eventId);if(!event)return;
    const members=memberId?MEMBERS.filter(m=>m.id===memberId):matrixMembersForEvent(event);
    const destructive=action==="clearWants"||action==="resetCounts";
    const broad=!memberId;
    if((destructive||broad)&&!confirm(`${broad?"対象メンバー全員":"このメンバー"}へ一括操作を実行しますか？`))return;
    saveAutoBackup(`一括操作の直前：${event.period}`);
    let changed=0;
    members.forEach(member=>{
      POSITIONS.forEach(position=>{
        const key=k(event.id,member.id,position.id),count=getCount(event.id,member.id,position.id);
        if(action==="complete"&&count===0){state.counts[key]=1;changed++}
        if(action==="wantMissing"&&count===0&&!state.wants[key]){state.wants[key]=true;changed++}
        if(action==="clearWants"&&state.wants[key]){delete state.wants[key];changed++}
        if(action==="resetCounts"&&count>0){delete state.counts[key];changed++}
      });
      if(changed)recordRecentEdit(event.id,member.id);
    });
    localStorage.setItem(COUNT_KEY,JSON.stringify(state.counts));localStorage.setItem(WANT_KEY,JSON.stringify(state.wants));
    if(!skipSheet)closeUtilitySheet("bulkSheetOverlay");
    showActionToast(changed?`${changed}件を更新しました`:`変更対象はありませんでした`);
    if(state.page==="quick")renderQuick();else if(state.page==="matrix")renderMatrix();else renderCollection();
  }
  let toastTimer=0;
  function showActionToast(message){const toast=$("actionToast");toast.textContent=message;toast.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.add("hidden"),2400)}
  function statsFor(ms,evs=EVENTS){let total=0,types=0,signed=0,wanted=0,possible=0;ms.forEach(m=>evs.filter(e=>eventAvailableForMember(e,m)).forEach(e=>POSITIONS.forEach(p=>{possible++;const n=getCount(e.id,m.id,p.id);total+=n;if(n>0)types++;if(isSigned(e.id,m.id,p.id))signed++;if(isWanted(e.id,m.id,p.id))wanted++})));return{total,types,signed,wanted,possible,rate:possible?Math.round(types/possible*100):0}}
  function updateSummary(list){const s=statsFor(scopeMembers());$("ownedTotal").textContent=s.total;$("ownedTypes").textContent=s.types;$("signedTotal").textContent=s.signed}
  function complete(e,m){return POSITIONS.every(p=>getCount(e.id,m.id,p.id)>0)}
  function renderPositionRow(e,m,p,compact=false){const row=document.createElement("div");row.className=compact?"mini-pos":"pos-row";row.innerHTML=compact?`<div class="mini-label">${p.name}</div><div class="mini-actions"><button class="minus">−</button><b class="num">${getCount(e.id,m.id,p.id)}</b><button class="plus">＋</button><button class="wide sign ${isSigned(e.id,m.id,p.id)?"on":""}">✍️</button><button class="wide want ${isWanted(e.id,m.id,p.id)?"on":""}">♡</button></div>`:`<span>${p.name}</span><div class="pos-actions"><button class="icon-btn want ${isWanted(e.id,m.id,p.id)?"on":""}">♡</button><button class="icon-btn sign ${isSigned(e.id,m.id,p.id)?"on":""}">✍️</button><div class="counter"><button class="minus">−</button><span class="count num">${getCount(e.id,m.id,p.id)}</span><button class="plus">＋</button></div></div>`;
  row.querySelector(".minus").onclick=()=>{setCount(e.id,m.id,p.id,Math.max(0,getCount(e.id,m.id,p.id)-1));renderCollection()};row.querySelector(".plus").onclick=()=>{setCount(e.id,m.id,p.id,getCount(e.id,m.id,p.id)+1);renderCollection()};row.querySelector(".sign").onclick=()=>{toggleSign(e.id,m.id,p.id);renderCollection()};row.querySelector(".want").onclick=()=>{toggleWant(e.id,m.id,p.id);renderCollection()};return row}
  function renderMemberCard(e,m){const card=document.createElement("article");card.className="event-card";card.dataset.eventId=e.id;card.innerHTML=`<div class="event-head"><div class="event-topline"><div><div class="period">${esc(e.period||e.officialName)}</div><div class="work">${esc(e.work)}</div></div><div class="badges"><span class="badge">${esc(e.category)}</span>${isNewEvent(e)?'<span class="badge new-badge">NEW</span>':''}${complete(e,m)?'<span class="badge complete">COMPLETE</span>':''}</div></div></div><div class="member-line">${m.emoji} ${m.name}</div><div class="positions"></div><div class="event-footer"></div>`;
  POSITIONS.forEach(p=>card.querySelector(".positions").appendChild(renderPositionRow(e,m,p)));const f=card.querySelector(".event-footer");f.innerHTML=`<button class="card-bulk-button">⋯ 一括操作</button>${safeOfficialUrl(e.officialUrl)?`<a href="${esc(safeOfficialUrl(e.officialUrl))}" target="_blank" rel="noopener noreferrer">公式サイト ↗</a>`:""}`;f.querySelector(".card-bulk-button").onclick=()=>openBulkSheet(e.id,m.id);return card}
  function renderAllCard(e){const card=document.createElement("article");card.className="event-card";card.dataset.eventId=e.id;const eligible=eligibleMembersForEvent(e),owned=eligible.reduce((t,m)=>t+POSITIONS.reduce((s,p)=>s+getCount(e.id,m.id,p.id),0),0),want=eligible.reduce((t,m)=>t+POSITIONS.filter(p=>isWanted(e.id,m.id,p.id)).length,0),comp=eligible.filter(m=>complete(e,m)).length;card.innerHTML=`<div class="event-head"><div class="event-topline"><div><div class="period">${esc(e.period||e.officialName)}</div><div class="work">${esc(e.work)}</div><div class="all-summary">所持 ${owned}枚 ／ 欲しい ${want}種 ／ コンプ ${comp}/${eligible.length}人</div></div><div class="badges">${isNewEvent(e)?'<span class="badge new-badge">NEW</span>':''}<span class="badge">${esc(e.category)}</span></div></div></div><div class="event-footer"><button class="expand-btn">${state.expanded[e.id]?"閉じる":`${eligible.length}人分を開く`}</button><button class="card-bulk-button">⋯ 一括操作</button>${safeOfficialUrl(e.officialUrl)?`<a href="${esc(safeOfficialUrl(e.officialUrl))}" target="_blank" rel="noopener noreferrer">公式サイト ↗</a>`:""}</div>`;card.querySelector(".expand-btn").onclick=()=>{state.expanded[e.id]=!state.expanded[e.id];renderCollection()};card.querySelector(".card-bulk-button").onclick=()=>openBulkSheet(e.id,"");if(state.expanded[e.id]){const box=document.createElement("div");box.className="all-members";eligible.forEach(m=>{const r=document.createElement("div");r.className="all-row";r.innerHTML=`<div class="all-name">${m.emoji} ${m.name}${isGraduated(m)?'<span class="mini-graduated">卒業</span>':''}</div><div class="all-pos-grid"></div>`;POSITIONS.forEach(p=>r.querySelector(".all-pos-grid").appendChild(renderPositionRow(e,m,p,true)));box.appendChild(r)});card.insertBefore(box,card.querySelector(".event-footer"))}return card}
  function renderCollection(){
    renderCollectionFilterUi();
    const list=filtered();
    updateSummary(list);
    $("eventList").innerHTML="";
    if(!list.length){
      $("eventList").innerHTML=`<div class="empty-state"><span>🔍</span><h3>該当するデータがありません</h3><p>検索条件やフィルターを変更してください。</p><button id="resetFiltersButton">条件をリセット</button></div>`;
      document.getElementById("resetFiltersButton").onclick=()=>{
        state.category="";state.yearFilter="";state.sort="desc";state.search="";state.ownership="";state.newFilter="";state.oshiOnly=false;savePreferences();
        $("searchInput").value="";
        renderCollection();
      };
      return;
    }
    const frag=document.createDocumentFragment();
    if(state.mode==="all")list.forEach(e=>frag.appendChild(renderAllCard(e)));
    else{const m=MEMBERS.find(x=>x.id===state.memberId);list.forEach(e=>frag.appendChild(renderMemberCard(e,m)))}
    $("eventList").appendChild(frag);
  }
  function renderStats(){
    const ms=scopeMembers(),all=statsFor(ms);
    let years=[...new Set(EVENTS.filter(e=>ms.some(m=>eventAvailableForMember(e,m))).map(yearOf))].sort();
    let yearHtml=years.map(y=>{const ev=EVENTS.filter(e=>yearOf(e)===y),s=statsFor(ms,ev);return `<div class="year-row"><div class="year-line"><span>${y}年</span><span>${s.types}/${s.possible}種・${s.rate}%</span></div><div class="bar"><span style="width:${s.rate}%"></span></div></div>`}).join("");
    $("statsPage").innerHTML=`<div class="page-head"><h2>📊 統計</h2><p>メンバーごとの収集状況を確認できます</p></div><div class="page-filter dual-filter"><select id="pageMemberFilter">${pageMemberOptions()}</select><button id="statsOshiToggle" class="oshi-toggle ${state.oshiOnly?"on":""}">👑 推しだけ</button></div><div class="stat-grid"><div class="big-stat"><b>${all.total}</b><span>総所持枚数</span></div><div class="big-stat"><b>${all.types}</b><span>所持種類数</span></div><div class="big-stat"><b>${all.signed}</b><span>直筆あり</span></div><div class="big-stat"><b>${all.rate}%</b><span>全体コンプ率</span></div></div><div class="panel" style="margin-top:13px"><h3>年代別コンプ率</h3>${yearHtml}</div>`;
    bindPageMemberFilter();
    document.getElementById("statsOshiToggle").onclick=()=>{state.oshiOnly=!state.oshiOnly;savePreferences();renderStats()};
  }
  function groupedWantedItems(){
    const map=new Map();
    scopeMembers().forEach(m=>eligibleEventsForMember(m).forEach(e=>POSITIONS.forEach(p=>{
      if(!isWanted(e.id,m.id,p.id))return;
      const key=`${m.id}__${e.id}`;
      if(!map.has(key))map.set(key,{m,e,positions:[]});
      map.get(key).positions.push({p,count:getCount(e.id,m.id,p.id)});
    })));
    return [...map.values()]
      .filter(x=>!state.wishlistYear||yearOf(x.e)===state.wishlistYear)
      .sort((a,b)=>state.wishlistOrder==="asc"?a.e.sort-b.e.sort:b.e.sort-a.e.sort);
  }
  function groupedTradeItems(){
    const map=new Map();
    scopeMembers().forEach(m=>eligibleEventsForMember(m).forEach(e=>POSITIONS.forEach(p=>{
      const n=getCount(e.id,m.id,p.id);
      if(n<2)return;
      const key=`${m.id}__${e.id}`;
      if(!map.has(key))map.set(key,{m,e,positions:[]});
      map.get(key).positions.push({p,extra:n-1,total:n});
    })));
    return [...map.values()]
      .filter(x=>!state.tradeYear||yearOf(x.e)===state.tradeYear)
      .sort((a,b)=>state.tradeOrder==="asc"?a.e.sort-b.e.sort:b.e.sort-a.e.sort);
  }
  function renderGroupedWantItem(x){
    const tags=x.positions.map(v=>`<span class="pill">♡ ${v.p.name}${v.count>0?`（所持 ${v.count}枚）`:""}</span>`).join("");
    return `<div class="item">
      <div class="item-title">${x.m.emoji} ${x.m.name}</div>
      <div class="item-meta">${esc(x.e.period)}｜${esc(x.e.work)}｜${esc(x.e.category)}</div>
      <div class="item-tags">${tags}</div>
    </div>`;
  }
  function renderGroupedTradeItem(x){
    const tags=x.positions.map(v=>`<span class="pill">${v.p.name}：提供 ${v.extra}枚（所持 ${v.total}枚）</span>`).join("");
    return `<div class="item">
      <div class="item-title">${x.m.emoji} ${x.m.name}</div>
      <div class="item-meta">${esc(x.e.period)}｜${esc(x.e.work)}｜${esc(x.e.category)}</div>
      <div class="item-tags">${tags}</div>
    </div>`;
  }
  function renderWishlist(){
    const groups=groupedWantedItems();
    const typeCount=groups.reduce((sum,g)=>sum+g.positions.length,0);
    $("wishlistPage").innerHTML=`<div class="page-head"><h2>♡ 欲しい生写真一覧</h2><p>${groups.length}イベント・${typeCount}種類を登録中</p></div>${listToolbarHtml("wishlist")}<div class="list-page">${groups.length?groups.map(renderGroupedWantItem).join(""):'<div class="empty">条件に該当する欲しい生写真はありません。</div>'}</div>`;
    bindListToolbar("wishlist");
  }
  function renderTrade(){
    const groups=groupedTradeItems();
    const typeCount=groups.reduce((sum,g)=>sum+g.positions.length,0);
    $("tradePage").innerHTML=`<div class="page-head"><h2>🔄 ダブり・提供可能一覧</h2><p>${groups.length}イベント・${typeCount}種類を表示中</p></div>${listToolbarHtml("trade")}<div class="list-page">${groups.length?groups.map(renderGroupedTradeItem).join(""):'<div class="empty">条件に該当する提供可能データはありません。</div>'}</div>`;
    bindListToolbar("trade");
  }


  function missingMemberOptions(){
    const active=MEMBERS.filter(m=>!isGraduated(m)).map(m=>`<option value="${m.id}" ${state.missingMemberId===m.id?"selected":""}>${m.emoji} ${m.name}</option>`).join("");
    const graduated=MEMBERS.filter(isGraduated).map(m=>`<option value="${m.id}" ${state.missingMemberId===m.id?"selected":""}>${m.emoji} ${m.name}（卒業）</option>`).join("");
    return `<option value="">全メンバー横断</option><optgroup label="現役メンバー">${active}</optgroup><optgroup label="卒業メンバー">${graduated}</optgroup>`;
  }
  function missingPositionOptions(){
    return `<option value="">全ポジション</option>`+POSITIONS.map(p=>`<option value="${p.id}" ${state.missingPositionId===p.id?"selected":""}>${p.name}</option>`).join("");
  }
  function groupedMissingItems(){
    const q=normalizeText(state.missingSearch);
    const members=(state.missingMemberId?MEMBERS.filter(m=>m.id===state.missingMemberId):[...MEMBERS]).filter(m=>!state.oshiOnly||isOshi(m.id))
      .sort((a,b)=>(a.kana||a.name).localeCompare(b.kana||b.name,"ja"));
    const positionIds=state.missingPositionId?[state.missingPositionId]:POSITIONS.map(p=>p.id);
    return members.map(m=>{
      const items=eligibleEventsForMember(m)
        .filter(e=>!state.missingYear||yearOf(e)===state.missingYear)
        .filter(e=>!q||eventSearchText(e).includes(q))
        .map(e=>({e,positions:POSITIONS.filter(p=>positionIds.includes(p.id)&&getCount(e.id,m.id,p.id)===0)}))
        .filter(x=>x.positions.length)
        .sort((a,b)=>state.missingEventOrder==="asc"?a.e.sort-b.e.sort:b.e.sort-a.e.sort);
      return {m,items};
    }).filter(group=>group.items.length);
  }
  function renderMissing(){
    const memberGroups=groupedMissingItems();
    const eventCount=memberGroups.reduce((sum,g)=>sum+g.items.length,0);
    const typeCount=memberGroups.reduce((sum,g)=>sum+g.items.reduce((s,x)=>s+x.positions.length,0),0);
    $("missingPage").innerHTML=`
      <div class="page-head"><h2>🔎 未所持一覧</h2><p>${memberGroups.length}人・${eventCount}イベント・${typeCount}種類が未所持です</p></div>
      <div class="searchbox missing-search"><span>🔍</span><input id="missingSearchInput" type="search" value="${esc(state.missingSearch)}" placeholder="年月・楽曲名・ツアー名など"></div>
      ${listToolbarHtml("missing")}
      <div class="missing-member-list">${memberGroups.length?memberGroups.map(group=>`
        <section class="missing-member-section">
          <div class="missing-member-head" style="--member-accent:${group.m.accent};--member-soft:${group.m.soft}">
            <div><b>${group.m.emoji} ${group.m.name}</b>${isGraduated(group.m)?'<span class="mini-graduated">卒業</span>':''}</div>
            <span>${group.items.reduce((s,x)=>s+x.positions.length,0)}種類</span>
          </div>
          <div class="missing-event-list">${group.items.map(x=>`
            <div class="item missing-event-item">
              <div class="item-title">${isNewEvent(x.e)?'<span class="inline-new">NEW</span>':''}${esc(x.e.period)}</div>
              <div class="item-meta">${esc(x.e.work)}｜${esc(x.e.category)}</div>
              <div class="item-tags">${x.positions.map(p=>`<span class="pill missing-pill">${p.name}</span>`).join("")}</div>
            </div>`).join("")}
          </div>
        </section>`).join(""):'<div class="empty">条件に該当する未所持データはありません。</div>'}</div>`;
    bindListToolbar("missing");
    document.getElementById("missingSearchInput").oninput=e=>{state.missingSearch=e.target.value;savePreferences();renderMissing()};
  }


  function memberOshiStats(m){
    const s=statsFor([m]);
    return {...s,missing:Math.max(0,s.possible-s.types)};
  }
  function openOshiMissing(id){
    state.missingMemberId=id;
    state.oshiOnly=false;
    savePreferences();
    showPage("missing");
  }
  function openOshiWishlist(id){
    state.pageMemberId=id;
    state.oshiOnly=false;
    savePreferences();
    showPage("wishlist");
  }
  function renderOshi(){
    const ordered=rankedMembers(MEMBERS);
    const selected=ordered.filter(m=>isOshi(m.id));
    const cards=ordered.map(m=>{
      const s=memberOshiStats(m),rank=oshiRank(m.id);
      return `<div class="oshi-setting-card ${rank?`selected rank-${rank}`:""}" style="--member-accent:${m.accent};--member-soft:${m.soft}">
        <div class="oshi-setting-main">
          <div class="oshi-setting-name">${memberAvatarMarkup(m,"oshi-setting-avatar")}<span class="oshi-setting-name-text"><b>${m.name}</b>${isGraduated(m)?'<span class="mini-graduated">卒業</span>':''}${oshiBadge(m)}</span></div>
          <select class="oshi-rank-select" data-member="${m.id}">
            <option value="" ${!rank?"selected":""}>設定なし</option>
            <option value="favorite" ${rank==="favorite"?"selected":""}>👑 最推し</option>
            <option value="oshi" ${rank==="oshi"?"selected":""}>⭐ 推し</option>
            <option value="interest" ${rank==="interest"?"selected":""}>♡ 気になる</option>
          </select>
        </div>
        <div class="oshi-mini-stats"><span><b>${s.rate}%</b>コンプ率</span><span><b>${s.missing}</b>未所持</span><span><b>${s.signed}</b>直筆</span></div>
        <div class="member-rate-bar"><i style="width:${s.rate}%;background:${m.accent}"></i></div>
      </div>`;
    }).join("");
    const focus=selected.map(m=>{
      const s=memberOshiStats(m),rank=OSHI_RANKS[oshiRank(m.id)];
      return `<article class="oshi-focus-card ${s.rate===100?"complete-oshi":""}" style="--member-accent:${m.accent};--member-soft:${m.soft}">
        ${s.rate===100?'<div class="oshi-celebrate">🎉 推しメンコンプリート！</div>':""}
        <div class="oshi-focus-head">${memberAvatarMarkup(m,"oshi-focus-avatar")}<div><span>${rank.icon} ${rank.label}</span><h3>${m.name}</h3></div><b>${s.rate}%</b></div>
        <div class="oshi-focus-stats"><span>所持 <b>${s.total}枚</b></span><span>未所持 <b>${s.missing}種</b></span><span>直筆 <b>${s.signed}種</b></span></div>
        <div class="oshi-actions"><button data-missing="${m.id}">未所持を見る</button><button data-wishlist="${m.id}">欲しい一覧</button></div>
      </article>`;
    }).join("");
    $("oshiPage").innerHTML=`
      <div class="page-head"><h2>👑 推しカスタマイズ</h2><p>最推しは1人、推し・気になるは複数設定できます</p></div>
      ${selected.length?`<div class="oshi-focus-list">${focus}</div>`:'<div class="oshi-empty">メンバーを選んで推し設定してみよう！</div>'}
      <div class="panel oshi-settings-panel"><h3>推しランク設定</h3><p>メンバーは常に五十音順で表示し、推しはカードのバッジと枠で分かりやすく表示します。設定はバックアップにも保存されます。</p><div class="oshi-settings-list">${cards}</div></div>
      <div class="settings-page-bottom-space" aria-hidden="true"></div>`;
    document.querySelectorAll(".oshi-rank-select").forEach(select=>select.onchange=e=>{setOshiRank(e.target.dataset.member,e.target.value);renderOshi();renderHomeMembers()});
    document.querySelectorAll("[data-missing]").forEach(b=>b.onclick=()=>openOshiMissing(b.dataset.missing));
    document.querySelectorAll("[data-wishlist]").forEach(b=>b.onclick=()=>openOshiWishlist(b.dataset.wishlist));
  }


  function renderHelp(){
    $("helpPage").innerHTML=`
      <div class="page-head"><h2>📖 使い方</h2><p>基本操作とデータを安全に使うための案内です</p></div>
      <div class="guide-list">
        <section class="panel guide-card"><span>1</span><div><h3>メンバーを選ぶ</h3><p>TOPからメンバーを選択します。「全メンバー」ではイベント単位でまとめて確認できます。</p></div></section>
        <section class="panel guide-card"><span>2</span><div><h3>生写真を登録する</h3><p>通常一覧のほか、クイック入力とイベント別チェック表が使えます。イベントカードの「一括操作」からコンプ登録や欲しい一括追加もできます。</p></div></section>
        <section class="panel guide-card"><span>3</span><div><h3>一覧を絞り込む</h3><p>検索欄と「絞り込み」「並び順」を使います。選択中の条件はチップで表示され、個別に解除できます。</p></div></section>
        <section class="panel guide-card"><span>4</span><div><h3>未所持・提供可能を確認する</h3><p>未所持一覧はメンバーの五十音順、各メンバー内はイベント順です。2枚目以降は提供可能として表示されます。</p></div></section>
        <section class="panel guide-card"><span>5</span><div><h3>推しを設定する</h3><p>最推し・推し・気になるの3段階です。メンバーカードの推しバッジや、推しだけの統計・未所持確認に使えます。</p></div></section>
        <section class="panel guide-card"><span>6</span><div><h3>メンバー画像を設定する</h3><p>TOP右上の設定から、端末内の好きな画像をメンバーごとに登録できます。画像は編集画面で表示範囲を確認しながら位置調整でき、外部送信もされません。</p></div></section>
        <section class="panel guide-card important"><span>7</span><div><h3>定期的にバックアップする</h3><p>端末変更、Safariのデータ削除、ブラウザ変更に備えてJSONを保存してください。復元前には日時と件数を確認できます。</p></div></section>
        <section class="panel guide-card"><span>8</span><div><h3>iPhoneでアプリ化する</h3><p>Safariの共有ボタンから「ホーム画面に追加」を選択します。一度読み込めばオフラインでも閲覧できます。</p></div></section>
        <section class="panel guide-card important"><span>9</span><div><h3>利用上の注意を確認する</h3><p>本サイトは非公式です。画像の利用、端末内保存、免責事項について、設定内の「本サイトについて・利用上の注意」を確認してください。</p></div></section>
      </div>`;
  }

  function renderLegal(){
    $("legalPage").innerHTML=`
      <div class="page-head"><h2>🛡️ 本サイトについて・利用上の注意</h2><p>安心して利用するため、以下をご確認ください</p></div>
      <div class="legal-stack">
        <section class="panel legal-card legal-primary">
          <h3>非公式の個人制作ツールです</h3>
          <p>本サイトは、＝LOVEのファンが個人で制作・運営する非公式の生写真管理ツールです。＝LOVE、所属事務所、レコード会社、運営会社およびその他の関係各社とは一切関係ありません。</p>
        </section>
        <section class="panel legal-card">
          <h3>名称・画像などの権利について</h3>
          <p>＝LOVEに関する名称、作品、画像、商標その他の権利は、それぞれの権利者に帰属します。本サイトには公式写真やメンバー画像を収録・配布していません。</p>
        </section>
        <section class="panel legal-card">
          <h3>メンバー画像設定について</h3>
          <p>利用者が選択した画像は、その端末のブラウザ内だけに保存されます。外部サーバーへの送信、運営者による収集・閲覧、ほかの利用者への共有は行いません。</p>
          <p>画像の権利と入手元をご確認のうえ、個人利用の範囲で使用してください。設定画像を含む画面のSNS投稿や第三者への配布については、利用者自身の責任で判断してください。</p>
        </section>
        <section class="panel legal-card">
          <h3>保存データとプライバシー</h3>
          <p>所持枚数、直筆、欲しい、推し設定などは利用者のブラウザ内に保存されます。本公開版には、ログイン、広告、独自のアクセス解析、所持情報や設定画像を外部送信する機能はありません。</p>
          <p>本サイトはGitHub Pagesを利用して配信しています。GitHubはサービスの運用・セキュリティ目的で、アクセス時のIPアドレスなどの技術情報を記録・保存する場合があります。本サイト運営者は、利用者の所持情報・推し設定・設定画像を収集または閲覧しません。</p>
          <p>ブラウザのサイトデータ削除、端末変更、URL変更などでデータが消失する場合があります。定期的にバックアップJSONを保存してください。メンバー画像は通常バックアップに含まれません。</p>
          <p>共有端末での利用は避け、端末ロックをご利用ください。端末内データについて、暗号化保管を保証するものではありません。</p>
        </section>
        <section class="panel legal-card">
          <h3>データと動作の保証</h3>
          <p>掲載する生写真データの正確性・完全性・継続的な提供を保証するものではありません。本サイトの利用、データ消失、表示不具合などによって生じた損害について、運営者は責任を負いかねます。</p>
          <p>本サイトは、必要に応じて内容の変更、公開の一時停止または終了を行う場合があります。</p>
        </section>
        <section class="panel legal-card">
          <h3>不具合・データ修正の連絡</h3>
          <p>一般的な不具合、掲載データの誤り、権利上の修正・削除要望はGitHub Issuesからご連絡ください。Issuesは公開されるため、バックアップJSON、設定画像、個人情報を含むスクリーンショットは投稿しないでください。</p>
          <a class="legal-contact-link" href="https://github.com/photomanager-0429/photomanager-0429.github.io/issues" target="_blank" rel="noopener noreferrer">GitHub Issuesを開く</a>
        </section>
        <section class="panel legal-card legal-security">
          <h3>セキュリティ上の問題</h3>
          <p>脆弱性の詳細を公開Issueへ投稿すると、修正前に第三者へ知られるおそれがあります。GitHubの「Security → Advisories → Report a vulnerability」から非公開で報告してください。</p>
          <p>本サイトと同じドメイン配下に別のGitHub Pagesサイトを公開しない運用とし、保存データへアクセスできる同一オリジンの範囲を増やさない方針です。</p>
          <a class="legal-contact-link" href="https://github.com/photomanager-0429/photomanager-0429.github.io/security" target="_blank" rel="noopener noreferrer">セキュリティ報告ページを開く</a>
        </section>
      </div>`;
  }

  function renderAbout(){
    const active=MEMBERS.filter(m=>!isGraduated(m)).length;
    const graduated=MEMBERS.filter(isGraduated).length;
    $("aboutPage").innerHTML=`
      <div class="page-head"><h2>ℹ️ バージョン情報</h2><p>${esc(APP_CONFIG.appName||"＝LOVE 生写真管理")}</p></div>
      <div class="panel about-hero">
        <div class="about-version">Ver ${esc(APP_CONFIG.version)}</div>
        <div class="about-status">一般公開版</div>
        <p>データ更新日：${esc((APP_CONFIG.dataUpdatedAt||"不明").replaceAll("-","/"))}</p>
      </div>
      <div class="about-grid">
        <div class="panel"><b>${EVENTS.length}</b><span>登録イベント</span></div>
        <div class="panel"><b>${active}</b><span>現役メンバー</span></div>
        <div class="panel"><b>${graduated}</b><span>卒業メンバー</span></div>
      </div>
      <div class="panel about-notes">
        <h3>公開版Ver1.00.4（正式公開候補）</h3>
        <p>公開前監査の指摘を反映し、バージョン・キャッシュ統一、プライバシー表記、データ補完を行った正式公開候補版です。</p>
        <h3>保存について</h3>
        <p>登録内容はこのブラウザ内に保存されます。別端末へ移す場合は、バックアップ画面からJSONファイルを保存してください。画像は再設定が必要です。</p>
        <h3>非公式サイト</h3>
        <p>本サイトはファンが個人で制作・運営しており、＝LOVEおよび関係各社とは関係ありません。</p>
      </div>`;
  }

  function backupStats(){
    return {
      counts:Object.keys(state.counts).length,
      signs:Object.keys(state.signs).length,
      wants:Object.keys(state.wants).length
    };
  }
  function backupFileName(){
    const d=new Date(),pad=n=>String(n).padStart(2,"0");
    return `equal-love-photo-backup-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  }
  function currentPreferences(){
    return {
      memberId:state.memberId,category:state.category,yearFilter:state.yearFilter,sort:state.sort,search:state.search,
      ownership:state.ownership,newFilter:state.newFilter,oshiOnly:state.oshiOnly,pageMemberId:state.pageMemberId,
      wishlistYear:state.wishlistYear,tradeYear:state.tradeYear,wishlistOrder:state.wishlistOrder,tradeOrder:state.tradeOrder,
      missingMemberId:state.missingMemberId,missingPositionId:state.missingPositionId,missingYear:state.missingYear,
      missingEventOrder:state.missingEventOrder,missingSearch:state.missingSearch,
      quickEventId:state.quickEventId,quickSearch:state.quickSearch,quickYear:state.quickYear,quickOrder:state.quickOrder,
      matrixEventId:state.matrixEventId,matrixSearch:state.matrixSearch,matrixYear:state.matrixYear,matrixOrder:state.matrixOrder
    };
  }
  function buildBackupPayload(reason="manual"){
    return {
      app:"equal-love-photo-manager",
      backupVersion:2,
      schemaVersion:SCHEMA_VERSION,
      reason,
      exportedAt:new Date().toISOString(),
      sourceVersion:APP_CONFIG.version,
      dataVersion:APP_CONFIG.dataVersion||APP_CONFIG.dataUpdatedAt||"",
      data:{counts:state.counts,signs:state.signs,wants:state.wants,oshis:state.oshis,preferences:currentPreferences()}
    };
  }
  function exportBackup(){
    const payload=buildBackupPayload("manual");
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=backupFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    const msg=document.getElementById("backupMessage");
    if(msg){msg.textContent="バックアップファイルを保存しました。";msg.className="backup-message success"}
  }
  function getAutoBackups(){
    try{
      const items=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
      return Array.isArray(items)?items.filter(item=>item&&item.app==="equal-love-photo-manager"):[];
    }catch(error){return []}
  }
  function saveAutoBackup(reason){
    const history=getAutoBackups();
    history.unshift(buildBackupPayload(reason));
    const max=Math.max(1,Number(APP_CONFIG.maxAutoBackups||3));
    localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,max)));
    return history[0];
  }
  function clearAutoBackups(){
    if(confirm("端末内の自動バックアップ履歴をすべて削除しますか？")){
      localStorage.removeItem(HISTORY_KEY);renderBackup();
    }
  }
  function migrateStorageMap(map){
    const migrations=APP_CONFIG.eventIdMigrations&&typeof APP_CONFIG.eventIdMigrations==="object"?APP_CONFIG.eventIdMigrations:{};
    const migrated={};
    let migrationCount=0;
    Object.entries(map||{}).forEach(([key,value])=>{
      const parts=key.split("__");
      if(parts.length!==3){migrated[key]=value;return}
      const target=migrations[parts[0]];
      if(typeof target==="string"&&target&&target!==parts[0]){
        parts[0]=target;migrationCount++;
      }
      migrated[parts.join("__")]=value;
    });
    return {data:migrated,migrationCount};
  }
  function applyBackupData(backup){
    const counts=migrateStorageMap(backup.counts);
    const signs=migrateStorageMap(backup.signs);
    const wants=migrateStorageMap(backup.wants);
    localStorage.setItem(COUNT_KEY,JSON.stringify(counts.data));
    localStorage.setItem(SIGN_KEY,JSON.stringify(signs.data));
    localStorage.setItem(WANT_KEY,JSON.stringify(wants.data));
    localStorage.setItem(OSHI_KEY,JSON.stringify(backup.oshis||{}));
    localStorage.setItem(PREF_KEY,JSON.stringify(backup.preferences||{}));
    return counts.migrationCount+signs.migrationCount+wants.migrationCount;
  }
  function restoreAutoBackup(index){
    const item=getAutoBackups()[Number(index)];
    if(!item)return;
    try{
      const backup=validateBackupPayload(item);
      if(!confirm(`自動バックアップ（${formatBackupDate(backup.exportedAt)}）を復元しますか？`))return;
      saveAutoBackup("自動履歴から復元する直前");
      const migrated=applyBackupData(backup);
      alert(`復元しました。${migrated?`旧event_idを${migrated}件移行しました。`:""}画面を再読み込みします。`);
      location.reload();
    }catch(error){alert(`復元できませんでした：${error.message}`)}
  }
  const MAX_BACKUP_BYTES=5*1024*1024;
  const MAX_TEXT_FIELD=160;
  const DANGEROUS_KEYS=new Set(["__proto__","prototype","constructor"]);
  function validObject(value){
    return value!==null&&typeof value==="object"&&!Array.isArray(value);
  }
  function validDateString(value){return typeof value==="string"&&value.length<=64&&!Number.isNaN(Date.parse(value))}
  function cleanShortText(value,fallback="不明"){
    const text=String(value??fallback).replace(/[\u0000-\u001f\u007f]/g,"").trim();
    return (text||fallback).slice(0,MAX_TEXT_FIELD);
  }
  function validBackupKey(key){
    if(typeof key!=="string"||key.length<5||key.length>240)return false;
    const parts=key.split("__");
    if(parts.length!==3||parts.some(part=>!part||DANGEROUS_KEYS.has(part)))return false;
    const [eventId,memberId,positionId]=parts;
    const migrations=APP_CONFIG.eventIdMigrations&&typeof APP_CONFIG.eventIdMigrations==="object"?APP_CONFIG.eventIdMigrations:{};
    const currentEventId=typeof migrations[eventId]==="string"?migrations[eventId]:eventId;
    return EVENTS.some(event=>event.id===currentEventId)&&MEMBERS.some(member=>member.id===memberId)&&POSITIONS.some(position=>position.id===positionId);
  }
  function sanitizeBackupMap(value,type){
    if(!validObject(value))throw new Error(`${type}データがオブジェクトではありません`);
    const entries=Object.entries(value);
    const maximum=EVENTS.length*MEMBERS.length*POSITIONS.length;
    if(entries.length>maximum)throw new Error(`${type}データの件数が多すぎます`);
    const clean=Object.create(null);
    for(const [key,item] of entries){
      if(!validBackupKey(key))throw new Error(`${type}データに不正なキーがあります`);
      if(type==="所持"){
        const n=Number(item);
        if(!Number.isInteger(n)||n<0||n>99)throw new Error(`${type}データの値が不正です`);
        if(n>0)clean[key]=n;
      }else{
        if(item!==true&&item!==false)throw new Error(`${type}データの値が不正です`);
        if(item===true)clean[key]=true;
      }
    }
    return clean;
  }
  function sanitizePreferences(value){
    if(!validObject(value))return {};
    const out=Object.create(null);
    const memberIds=new Set(MEMBERS.map(item=>item.id));
    const eventIds=new Set(EVENTS.map(item=>item.id));
    const positionIds=new Set(POSITIONS.map(item=>item.id));
    const categories=new Set(EVENTS.map(item=>item.category).filter(Boolean));
    const memberFields=["memberId","pageMemberId","missingMemberId"];
    memberFields.forEach(key=>{const v=String(value[key]||"");out[key]=memberIds.has(v)?v:""});
    ["quickEventId","matrixEventId"].forEach(key=>{const v=String(value[key]||"");out[key]=eventIds.has(v)?v:""});
    out.missingPositionId=positionIds.has(String(value.missingPositionId||""))?String(value.missingPositionId):"";
    out.category=categories.has(String(value.category||""))?String(value.category):"";
    ["yearFilter","wishlistYear","tradeYear","missingYear","quickYear","matrixYear"].forEach(key=>{
      const v=String(value[key]||"");out[key]=/^20\d{2}$/.test(v)?v:"";
    });
    ["sort","wishlistOrder","tradeOrder","missingEventOrder","quickOrder","matrixOrder"].forEach(key=>{
      out[key]=value[key]==="asc"?"asc":"desc";
    });
    ["search","missingSearch","quickSearch","matrixSearch"].forEach(key=>{out[key]=cleanShortText(value[key]||"","").slice(0,200)});
    out.ownership=["","owned","unowned"].includes(value.ownership)?value.ownership:"";
    out.newFilter=value.newFilter==="new"?"new":"";
    out.oshiOnly=value.oshiOnly===true;
    return out;
  }
  function validateBackupPayload(payload){
    if(!validObject(payload))throw new Error("JSONの中身が正しくありません");
    if(payload.app!=="equal-love-photo-manager")throw new Error("別のアプリのバックアップです");
    if(!Number.isInteger(Number(payload.backupVersion)))throw new Error("バックアップのバージョンが不正です");
    const schemaVersion=Number(payload.schemaVersion||1);
    if(!Number.isInteger(schemaVersion)||schemaVersion<1||schemaVersion>SCHEMA_VERSION)throw new Error("対応していないデータ形式です");
    if(!validDateString(payload.exportedAt))throw new Error("バックアップ作成日時がありません");
    if(!validObject(payload.data))throw new Error("バックアップデータがありません");
    const oshis=Object.create(null);
    if(validObject(payload.data.oshis)){
      const entries=Object.entries(payload.data.oshis);
      if(entries.length>MEMBERS.length)throw new Error("推し設定の件数が多すぎます");
      entries.forEach(([id,rank])=>{if(MEMBERS.some(member=>member.id===id)&&["favorite","oshi","interest"].includes(rank))oshis[id]=rank});
    }
    return {
      exportedAt:new Date(payload.exportedAt),
      counts:sanitizeBackupMap(payload.data.counts,"所持"),
      signs:sanitizeBackupMap(payload.data.signs,"直筆"),
      wants:sanitizeBackupMap(payload.data.wants,"欲しい"),
      oshis,
      preferences:sanitizePreferences(payload.data.preferences),
      sourceVersion:cleanShortText(payload.sourceVersion),
      schemaVersion,
      dataVersion:cleanShortText(payload.dataVersion)
    };
  }
  function formatBackupDate(date){
    return new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(date);
  }
  let pendingBackup=null;
  function importBackupFile(file){
    if(!file)return;
    pendingBackup=null;
    const msg=document.getElementById("backupMessage");
    const preview=document.getElementById("backupPreview");
    const lowerName=String(file.name||"").toLowerCase();
    if(file.size<=0||file.size>MAX_BACKUP_BYTES){
      msg.textContent="読み込みを中止しました：バックアップは5MB以下にしてください。";
      msg.className="backup-message error";
      return;
    }
    if(!lowerName.endsWith(".json")){
      msg.textContent="読み込みを中止しました：JSONファイルを選択してください。";
      msg.className="backup-message error";
      return;
    }
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const payload=JSON.parse(reader.result);
        pendingBackup=validateBackupPayload(payload);
        preview.innerHTML=`
          <div class="backup-preview-title">✅ バックアップを確認しました</div>
          <div class="backup-preview-date">作成日時：${formatBackupDate(pendingBackup.exportedAt)}\n作成元：Ver ${esc(pendingBackup.sourceVersion)}\nデータ形式：Schema ${pendingBackup.schemaVersion}\nマスターデータ：${esc(pendingBackup.dataVersion)}</div>
          <div class="backup-preview-counts">
            <span>所持 ${Object.keys(pendingBackup.counts).length}件</span>
            <span>直筆 ${Object.keys(pendingBackup.signs).length}件</span>
            <span>欲しい ${Object.keys(pendingBackup.wants).length}件</span><span>推し ${Object.keys(pendingBackup.oshis||{}).length}人</span>
          </div>
          <button id="restoreBackupButton" class="primary-action">このバックアップを復元</button>`;
        preview.className="backup-preview valid";
        msg.textContent="内容に問題はありません。作成日時と件数を確認してから復元してください。";
        msg.className="backup-message success";
        document.getElementById("restoreBackupButton").onclick=restorePendingBackup;
      }catch(error){
        console.error(error);
        pendingBackup=null;
        preview.innerHTML="";
        preview.className="backup-preview invalid";
        msg.textContent=`読み込みを中止しました：${error.message}`;
        msg.className="backup-message error";
      }
    };
    reader.onerror=()=>{
      pendingBackup=null;
      msg.textContent="ファイルの読み込みに失敗しました。";
      msg.className="backup-message error";
    };
    reader.readAsText(file,"utf-8");
  }
  function restorePendingBackup(){
    if(!pendingBackup)return;
    const summary=`作成日時：${formatBackupDate(pendingBackup.exportedAt)}\n作成元：Ver ${pendingBackup.sourceVersion}\n所持 ${Object.keys(pendingBackup.counts).length}件\n直筆 ${Object.keys(pendingBackup.signs).length}件\n欲しい ${Object.keys(pendingBackup.wants).length}件\n推し設定 ${Object.keys(pendingBackup.oshis||{}).length}人`;
    if(!confirm(`現在のデータを上書きします。\n\n${summary}\n\n復元しますか？`))return;
    saveAutoBackup("ファイル復元の直前");
    const migrated=applyBackupData(pendingBackup);
    alert(`復元が完了しました。${migrated?`旧event_idを${migrated}件移行しました。`:""}画面を再読み込みします。`);
    location.reload();
  }
  function deleteAllUserData(){
    if(!confirm("所持枚数・直筆・欲しい情報・フィルター設定をすべて削除します。\nこの操作は元に戻せません。\n\n続けますか？"))return;
    const answer=prompt("最終確認です。\n削除する場合は「全削除」と入力してください。");
    if(answer!=="全削除"){
      const msg=document.getElementById("backupMessage");
      if(msg){msg.textContent="入力が一致しなかったため、削除を中止しました。";msg.className="backup-message error"}
      return;
    }
    saveAutoBackup("全削除の直前");
    [COUNT_KEY,SIGN_KEY,WANT_KEY,OSHI_KEY,PREF_KEY,RECENT_KEY].forEach(key=>localStorage.removeItem(key));
    sessionStorage.removeItem(SCROLL_KEY);
    alert("すべての保存データを削除しました。画面を再読み込みします。");
    location.reload();
  }
  function renderBackup(){
    const s=backupStats();
    $("backupPage").innerHTML=`
      <div class="page-head"><h2>💾 バックアップ・復元</h2><p>端末変更やブラウザデータ消去に備えて、定期的に保存してください</p></div>
      <div class="backup-summary">
        <div><b>${s.counts}</b><span>所持データ</span></div>
        <div><b>${s.signs}</b><span>直筆データ</span></div>
        <div><b>${s.wants}</b><span>欲しいデータ</span></div>
      </div>
      <div class="panel backup-panel">
        <div class="backup-icon">📤</div>
        <h3>バックアップを保存</h3>
        <p>所持枚数・直筆・欲しい・推し・フィルター設定を、1つのJSONファイルに保存します。端末内のメンバー画像は含まれません。</p>
        <button id="exportBackupButton" class="primary-action">バックアップファイルを保存</button>
      </div>
      <div class="panel backup-panel">
        <div class="backup-icon">📥</div>
        <h3>バックアップから復元</h3>
        <p>選択したファイルを自動検査し、作成日時と件数を表示してから復元します。</p>
        <input id="importBackupInput" class="file-input" type="file" accept=".json,application/json">
        <label for="importBackupInput" class="secondary-action">バックアップファイルを選択</label>
        <div id="backupPreview" class="backup-preview"></div>
        <div class="backup-warning">⚠️ 壊れたJSON・別形式のJSON・不正な値を含むファイルは復元できません。</div>
      </div>
      <div class="panel backup-panel">
        <div class="backup-icon">🕘</div>
        <h3>自動バックアップ履歴</h3>
        <p>復元・全削除の直前に、現在の状態を端末内へ最大${APP_CONFIG.maxAutoBackups||3}件保存します。</p>
        <div class="auto-backup-list">${getAutoBackups().length?getAutoBackups().map((item,index)=>`<div class="auto-backup-row"><div><b>${formatBackupDate(new Date(item.exportedAt))}</b><span>${esc(item.reason||"自動保存")}｜所持 ${Object.keys(item.data?.counts||{}).length}件</span></div><button data-restore-history="${index}">復元</button></div>`).join(""):'<div class="empty compact-empty">自動バックアップはまだありません。</div>'}</div>
        <div class="history-actions"><button id="saveHistoryNowButton" class="secondary-action">現在の状態を履歴へ保存</button>${getAutoBackups().length?'<button id="clearHistoryButton" class="text-danger-button">履歴を削除</button>':""}</div>
      </div>
      <div class="panel danger-panel">
        <div class="backup-icon">🗑️</div>
        <h3>保存データを全削除</h3>
        <p>所持枚数・直筆・欲しい情報・保存済みフィルター設定を削除します。メンバー画像は画像設定から別途削除できます。確認は2段階です。</p>
        <button id="deleteAllDataButton" class="danger-action">すべての保存データを削除</button>
      </div>
      <div id="backupMessage" class="backup-message"></div>`;
    document.getElementById("exportBackupButton").onclick=exportBackup;
    document.getElementById("importBackupInput").onchange=e=>importBackupFile(e.target.files?.[0]);
    document.getElementById("deleteAllDataButton").onclick=deleteAllUserData;
    document.querySelectorAll("[data-restore-history]").forEach(button=>button.onclick=()=>restoreAutoBackup(button.dataset.restoreHistory));
    const saveHistoryButton=document.getElementById("saveHistoryNowButton");
    if(saveHistoryButton)saveHistoryButton.onclick=()=>{saveAutoBackup("手動履歴保存");renderBackup()};
    const clearHistoryButton=document.getElementById("clearHistoryButton");
    if(clearHistoryButton)clearHistoryButton.onclick=clearAutoBackups;
  }

  function createMemberButton(m){
    const b=document.createElement("button");
    const rank=oshiRank(m.id),hasImage=!!memberImageRecord(m.id);
    b.className=`member-card${isGraduated(m)?" graduated":""}${rank?` oshi-card rank-${rank}`:""}${hasImage?" has-custom-image":""}`;
    b.style.background=isGraduated(m)?"linear-gradient(135deg,#d8d8d8,#fff)":`linear-gradient(135deg,${m.soft},rgba(255,255,255,.88))`;
    b.style.setProperty("--card-accent",m.accent);
    b.style.setProperty("--card-soft",m.soft);
    b.style.borderColor=isGraduated(m)?"rgba(255,255,255,.82)":`${m.accent}66`;
    const memberStats=statsFor([m]);
    b.innerHTML=`${memberCardPhotoMarkup(m)}${oshiBadge(m)}${state.memberId===m.id?'<span class="last-used">前回</span>':''}<span class="emoji">${m.emoji}</span><span class="name">${m.name}</span><span class="small">${isGraduated(m)?`${m.graduation}｜`:""}所持：${memberTotal(m.id)}枚</span><span class="member-rate-line"><span>コンプ率</span><b>${memberStats.rate}%</b></span><span class="member-rate-bar"><i style="width:${memberStats.rate}%"></i></span>`;
    b.onclick=()=>openMember(m.id);
    return b;
  }
  function renderHomeMembers(){
    $("memberGrid").innerHTML="";
    $("graduatedMemberGrid").innerHTML="";
    rankedMembers(MEMBERS.filter(m=>!isGraduated(m))).forEach(m=>$("memberGrid").appendChild(createMemberButton(m)));
    rankedMembers(MEMBERS.filter(isGraduated)).forEach(m=>$("graduatedMemberGrid").appendChild(createMemberButton(m)));
  }
  renderHomeMembers();
  loadMemberImages();
  renderRecentEvents();
  $("openSettingsButton").onclick=()=>openUtilitySheet("settingsSheetOverlay");
  $("closeSettingsSheetButton").onclick=()=>closeUtilitySheet("settingsSheetOverlay");
  $("closeImageAdjustSheetButton").onclick=closeImageAdjustSheet;
  $("cancelImageAdjustButton").onclick=closeImageAdjustSheet;
  $("resetImageAdjustButton").onclick=resetImageAdjust;
  $("saveImageAdjustButton").onclick=saveImageAdjust;
  ["imagePositionX","imagePositionY","imageZoom"].forEach(id=>$(id).oninput=updateImageAdjustPreview);
  $("imageAdjustSheetOverlay").onclick=e=>{if(e.target===$("imageAdjustSheetOverlay"))closeImageAdjustSheet()};
  setupImageAdjustDrag();
  $("settingsSheetOverlay").onclick=e=>{if(e.target===$("settingsSheetOverlay"))closeUtilitySheet("settingsSheetOverlay")};
  document.querySelectorAll("[data-settings-page]").forEach(button=>button.onclick=()=>{
    const page=button.dataset.settingsPage;
    closeUtilitySheet("settingsSheetOverlay");
    showPage(page);
  });
  $("openMemberSelectorButton").onclick=()=>openMemberSelector("collection");
  $("closeMemberSelectorButton").onclick=closeMemberSelector;
  $("allMembersDashboardButton").onclick=openAll;
  $("quickInputDashboardButton").onclick=()=>{renderHomeMembers();openMemberSelector("quick")};
  $("eventMatrixDashboardButton").onclick=openEventMatrix;
  $("quickMemberSwitchButton").onclick=()=>{renderHomeMembers();openMemberSelector(state.page==="quick"?"quick":"collection")};
  $("memberSelectorOverlay").onclick=e=>{if(e.target===$("memberSelectorOverlay"))closeMemberSelector()};

  const selectorOverlay=$("memberSelectorOverlay");
  const selectorSheet=selectorOverlay.querySelector(".member-selector-sheet");
  const selectorBody=selectorOverlay.querySelector(".member-selector-body");
  let selectorStartY=0;
  let selectorStartX=0;
  let selectorDeltaY=0;
  let selectorSwipeActive=false;

  const resetSelectorSwipe=()=>{
    selectorSwipeActive=false;
    selectorDeltaY=0;
    selectorSheet.classList.remove("swiping");
    selectorSheet.style.transform="";
    selectorOverlay.style.background="";
  };

  selectorSheet.addEventListener("touchstart",e=>{
    if(e.touches.length!==1||selectorBody.scrollTop>0)return;
    const touch=e.touches[0];
    selectorStartY=touch.clientY;
    selectorStartX=touch.clientX;
    selectorDeltaY=0;
    selectorSwipeActive=true;
  },{passive:true});

  selectorSheet.addEventListener("touchmove",e=>{
    if(!selectorSwipeActive||e.touches.length!==1)return;
    const touch=e.touches[0];
    const deltaY=touch.clientY-selectorStartY;
    const deltaX=Math.abs(touch.clientX-selectorStartX);
    if(deltaY<=0||deltaY<deltaX)return;
    selectorDeltaY=Math.min(deltaY,320);
    selectorSheet.classList.add("swiping");
    selectorSheet.style.transform=`translateY(${selectorDeltaY}px)`;
    const opacity=Math.max(.08,.4-(selectorDeltaY/700));
    selectorOverlay.style.background=`rgba(55,33,45,${opacity})`;
    e.preventDefault();
  },{passive:false});

  selectorSheet.addEventListener("touchend",()=>{
    if(!selectorSwipeActive)return;
    if(selectorDeltaY>=90){
      selectorSheet.style.transform="translateY(110%)";
      setTimeout(()=>{
        closeMemberSelector();
        resetSelectorSwipe();
      },140);
    }else{
      resetSelectorSwipe();
    }
  },{passive:true});

  selectorSheet.addEventListener("touchcancel",resetSelectorSwipe,{passive:true});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeMemberSelector();closeUtilitySheet("filterSheetOverlay");closeUtilitySheet("sortSheetOverlay");closeUtilitySheet("bulkSheetOverlay");closeUtilitySheet("settingsSheetOverlay");closeImageAdjustSheet()}});
  $("searchInput").value=state.search;
  $("backButton").onclick=()=>{saveScrollPosition();renderRecentEvents();$("managerScreen").classList.add("hidden");$("homeScreen").classList.remove("hidden");window.scrollTo(0,0)};
  $("searchInput").oninput=e=>{state.search=e.target.value;savePreferences();renderCollection()};
  $("openCollectionFilterButton").onclick=()=>openFilterSheet("collection");
  $("openCollectionSortButton").onclick=()=>openSortSheet("collection");
  $("openQuickInputButton").onclick=openQuickInput;
  $("openEventMatrixButton").onclick=openEventMatrix;
  $("closeFilterSheetButton").onclick=()=>closeUtilitySheet("filterSheetOverlay");
  $("closeSortSheetButton").onclick=()=>closeUtilitySheet("sortSheetOverlay");
  $("clearFilterSheetButton").onclick=clearFilterSheet;
  $("applyFilterSheetButton").onclick=applyFilterSheet;
  $("filterSheetOverlay").onclick=e=>{if(e.target===$("filterSheetOverlay"))closeUtilitySheet("filterSheetOverlay")};
  $("sortSheetOverlay").onclick=e=>{if(e.target===$("sortSheetOverlay"))closeUtilitySheet("sortSheetOverlay")};
  $("closeBulkSheetButton").onclick=()=>closeUtilitySheet("bulkSheetOverlay");
  $("bulkSheetOverlay").onclick=e=>{if(e.target===$("bulkSheetOverlay"))closeUtilitySheet("bulkSheetOverlay")};
  setupUtilitySheetSwipe("filterSheetOverlay");
  setupUtilitySheetSwipe("sortSheetOverlay");
  setupUtilitySheetSwipe("bulkSheetOverlay");
  setupUtilitySheetSwipe("settingsSheetOverlay");
  setupUtilitySheetSwipe("imageAdjustSheetOverlay");
  document.querySelectorAll("[data-home-page]").forEach(button=>button.onclick=()=>showPage(button.dataset.homePage));
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  const topButton=document.createElement("button");
  topButton.id="backToTop";
  topButton.className="back-to-top";
  topButton.setAttribute("aria-label","ページ上部へ戻る");
  topButton.textContent="↑";
  topButton.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
  document.body.appendChild(topButton);
  const toggleTopButton=()=>topButton.classList.toggle("visible",window.scrollY>500);
  let scrollSaveTimer=0;
  window.addEventListener("scroll",()=>{toggleTopButton();clearTimeout(scrollSaveTimer);scrollSaveTimer=setTimeout(saveScrollPosition,160)},{passive:true});
  window.addEventListener("pagehide",saveScrollPosition);
  toggleTopButton();
}

loadAppData().catch(error => {
  console.error(error);
  const offline=!navigator.onLine;
  document.body.innerHTML=`
    <main class="fatal-error">
      <div class="fatal-error-card">
        <div class="fatal-error-icon">${offline?"📴":"⚠️"}</div>
        <h1>${offline?"オフラインデータがありません":"データを読み込めませんでした"}</h1>
        <p>${offline?"最初の1回は通信できる状態でアプリを開いてください。":"通信状態を確認して、もう一度読み込んでください。"}</p>
        <details><summary>詳しい情報</summary><code>${String(error.message||error).replaceAll("<","&lt;")}</code></details>
        <button id="fatalReloadButton">もう一度読み込む</button>
        <a href="./">TOPへ戻る</a>
      </div>
    </main>`;
  document.getElementById("fatalReloadButton")?.addEventListener("click",()=>location.reload());
});
