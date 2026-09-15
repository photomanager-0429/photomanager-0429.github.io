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
    fetch("./data/events.json?v=1.02.01",{cache:"no-store"}),
    fetch("./data/members.json?v=1.02.01",{cache:"no-store"}),
    fetch("./data/positions.json?v=1.02.01",{cache:"no-store"}),
    fetch("./data/config.json?v=1.02.01",{cache:"no-store"})
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
      const title=banner.querySelector("b"),note=banner.querySelector("span");
      if(title)title.textContent=`Ver ${config.version}に更新されました`;
      if(note)note.textContent="新機能を反映するため、最新版を読み込みます。";
      banner.dataset.owner="app";
      banner.classList.remove("hidden");
      if(button)button.onclick=()=>{
        try{localStorage.setItem(VERSION_KEY,config.version)}catch(error){console.warn("バージョン記録を保存できませんでした",error)}
        location.reload();
      };
    }
  }else{
    try{localStorage.setItem(VERSION_KEY,config.version)}catch(error){console.warn("バージョン記録を保存できませんでした",error)}
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
  let storageWarned=false;
  function safeStorageWrite(key,value){
    try{
      localStorage.setItem(key,typeof value==="string"?value:JSON.stringify(value));
      return true;
    }catch(error){
      console.warn(`保存データ ${key} を書き込めませんでした`,error);
      if(!storageWarned){
        storageWarned=true;
        try{showActionToast("保存できませんでした。端末の空き容量やプライベートモードを確認してください")}
        catch(toastError){console.warn("通知を表示できませんでした",toastError)}
      }
      return false;
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
    bulkMemberId:savedPrefs.bulkMemberId||"",
    counts:safeStorageObject(COUNT_KEY),
    signs:safeStorageObject(SIGN_KEY),
    wants:safeStorageObject(WANT_KEY),
    oshis:safeStorageObject(OSHI_KEY),
    expanded:{}
  };
  function savePreferences(){
    safeStorageWrite(PREF_KEY,({
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
      matrixOrder:state.matrixOrder,
      bulkMemberId:state.bulkMemberId
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

  function memberAccent2(member){
    return member?.accent2||member?.accent||"#ef7fad";
  }

  function memberAccent3(member){
    return member?.accent3||memberAccent2(member);
  }

  function memberSoft2(member){
    return member?.soft2||member?.soft||"#fff0f6";
  }

  function memberSoft3(member){
    return member?.soft3||memberSoft2(member);
  }

  function memberBackground(member){
    if(!member)return "linear-gradient(135deg,#fbd7e7 0%,#d9e9ff 100%)";
    if(member.soft3){
      return `linear-gradient(135deg,${member.soft} 0%,${member.soft} 31%,${member.soft2} 35%,${member.soft2} 64%,${member.soft3} 69%,${member.soft3} 100%)`;
    }
    if(member.soft2){
      return `linear-gradient(135deg,${member.soft} 0%,${member.soft} 46%,${member.soft2} 54%,${member.soft2} 100%)`;
    }
    return `linear-gradient(135deg,${member.soft} 0%,color-mix(in srgb,${member.soft} 72%,white) 100%)`;
  }

  function memberStrongBackground(member){
    if(!member)return "linear-gradient(90deg,#ef7fad,#6d9ee8)";
    if(member.accent3){
      return `linear-gradient(90deg,${member.accent} 0%,${member.accent2} 50%,${member.accent3} 100%)`;
    }
    if(member.accent2){
      return `linear-gradient(90deg,${member.accent},${member.accent2})`;
    }
    return member.accent;
  }

  function memberCssVars(member){
    if(!member){
      return "--member-accent:#ef7fad;--member-accent-2:#6d9ee8;--member-accent-3:#6d9ee8;--member-soft:#fbd7e7;--member-soft-2:#d9e9ff;--member-soft-3:#d9e9ff;--member-bg:linear-gradient(135deg,#fbd7e7 0%,#d9e9ff 100%);--member-strong-bg:linear-gradient(90deg,#ef7fad,#6d9ee8)";
    }
    return `--member-accent:${member.accent};--member-accent-2:${memberAccent2(member)};--member-accent-3:${memberAccent3(member)};--member-soft:${member.soft};--member-soft-2:${memberSoft2(member)};--member-soft-3:${memberSoft3(member)};--member-bg:${memberBackground(member)};--member-strong-bg:${memberStrongBackground(member)}`;
  }

  function applyMemberVars(element,member){
    if(!element)return;
    const values={
      "--member-accent":member?.accent||"#ef7fad",
      "--member-accent-2":memberAccent2(member),
      "--member-accent-3":memberAccent3(member),
      "--member-soft":member?.soft||"#fbd7e7",
      "--member-soft-2":memberSoft2(member),
      "--member-soft-3":memberSoft3(member),
      "--member-bg":memberBackground(member),
      "--member-strong-bg":memberStrongBackground(member)
    };
    Object.entries(values).forEach(([key,value])=>element.style.setProperty(key,value));
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
    return `<img class="member-card-photo" src="${esc(url)}" alt="" style="${memberImageStyle(record)}">`;
  }

  function memberAvatarMarkup(member,className="member-local-avatar"){
    const record=memberImageRecord(member.id),url=memberImageUrl(member.id);
    if(!record||!url)return `<span class="${className} emoji-fallback">${member.emoji}</span>`;
    return `<span class="${className} has-photo"><img src="${esc(url)}" alt="${esc(member.name)}" loading="lazy" decoding="async" style="${memberImageStyle(record)}"></span>`;
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
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality="high";
    context.fillStyle="#ffffff";
    context.fillRect(0,0,width,height);
    let source=image,sourceWidth=naturalWidth,sourceHeight=naturalHeight;
    while(sourceWidth>width*2&&sourceHeight>height*2){
      const stepWidth=Math.max(width,Math.round(sourceWidth/2));
      const stepHeight=Math.max(height,Math.round(sourceHeight/2));
      const stepCanvas=document.createElement("canvas");
      stepCanvas.width=stepWidth;stepCanvas.height=stepHeight;
      const stepContext=stepCanvas.getContext("2d",{alpha:false});
      if(!stepContext)break;
      stepContext.imageSmoothingEnabled=true;
      stepContext.imageSmoothingQuality="high";
      stepContext.drawImage(source,0,0,stepWidth,stepHeight);
      if(source!==image){source.width=1;source.height=1}
      source=stepCanvas;sourceWidth=stepWidth;sourceHeight=stepHeight;
    }
    context.drawImage(source,0,0,width,height);
    if(source!==image){source.width=1;source.height=1}
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
    applyMemberVars($("imageAdjustSheetOverlay"),member);
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
        :`<div class="member-image-setting-preview" style="background:${memberBackground(member)}"><span>${member.emoji}</span></div>`;
      return `<article class="member-image-setting-card" style="${memberCssVars(member)}">
        ${preview}
        <div class="member-image-setting-info name-only">
          <b>${member.emoji} ${esc(member.name)}</b>
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
    safeStorageWrite(RECENT_KEY,(items.slice(0,5)));
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
  function resetCollectionView(options={}){
    state.category="";
    state.yearFilter="";
    state.sort="desc";
    state.search="";
    state.ownership="";
    state.newFilter="";
    state.oshiOnly=false;
    state.expanded={};
    savePreferences();
    const searchInput=$("searchInput");
    if(searchInput)searchInput.value="";
    if(options.scrollTop)window.scrollTo({top:0,behavior:options.smooth?"smooth":"auto"});
    if(options.render&&state.page==="collection")renderCollection();
  }

  function openRecentEvent(eventId,memberId){
    const member=MEMBERS.find(m=>m.id===memberId);
    if(!member)return;
    state.mode="member";state.memberId=memberId;state.pageMemberId=memberId;
    resetCollectionView();
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
  function setCount(e,m,p,n){const x=k(e,m,p);if(n<=0)delete state.counts[x];else state.counts[x]=n;safeStorageWrite(COUNT_KEY,(state.counts));recordRecentEdit(e,m)}
  function isSigned(e,m,p){return !!state.signs[k(e,m,p)]} function toggleSign(e,m,p){const x=k(e,m,p);state.signs[x]?delete state.signs[x]:state.signs[x]=true;safeStorageWrite(SIGN_KEY,(state.signs));recordRecentEdit(e,m)}
  function isWanted(e,m,p){return !!state.wants[k(e,m,p)]} function toggleWant(e,m,p){const x=k(e,m,p);state.wants[x]?delete state.wants[x]:state.wants[x]=true;safeStorageWrite(WANT_KEY,(state.wants));recordRecentEdit(e,m)}
  const OSHI_RANKS={favorite:{label:"最推し",icon:"👑",weight:3},oshi:{label:"推し",icon:"⭐",weight:2},interest:{label:"気になる",icon:"♡",weight:1}};
  function oshiRank(id){return state.oshis[id]||""}
  function isOshi(id){return !!oshiRank(id)}
  function rankedMembers(list=MEMBERS){return [...list].sort((a,b)=>(a.kana||a.name).localeCompare(b.kana||b.name,"ja"))}
  function setOshiRank(id,rank){
    if(rank==="favorite")Object.keys(state.oshis).forEach(key=>{if(state.oshis[key]==="favorite")delete state.oshis[key]});
    if(rank)state.oshis[id]=rank;else delete state.oshis[id];
    safeStorageWrite(OSHI_KEY,(state.oshis));
  }
  function oshiBadge(m){const rank=OSHI_RANKS[oshiRank(m.id)];return rank?`<span class="oshi-badge rank-${oshiRank(m.id)}">${rank.icon} ${rank.label}</span>`:""}

  function esc(v){return String(v===0||v===false?v:(v||"")).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
  const yearCache=new WeakMap();
  function yearOf(e){
    const cached=yearCache.get(e);
    if(cached!==undefined)return cached;
    const hit=String(e.period||e.id||"").match(/20\d{2}/);
    const year=hit?hit[0]:"不明";
    yearCache.set(e,year);
    return year;
  }
  function yearOptions(selected="",allLabel="すべての年代"){
    const years=[...new Set(EVENTS.map(yearOf).filter(y=>y!=="不明"))].sort((a,b)=>Number(b)-Number(a));
    return `<option value="">${allLabel}</option>`+years.map(y=>`<option value="${y}" ${String(selected)===String(y)?"selected":""}>${y}年</option>`).join("");
  }
  function normalizeText(value){return String(value||"").toLowerCase().replace(/[\s　・･「」『』（）()【】\-_.]/g,"")}
  const searchTextCache=new WeakMap();
  function eventSearchText(e){
    const cached=searchTextCache.get(e);
    if(cached!==undefined)return cached;
    const parts=String(e.id||"").match(/(20\d{2})-(\d{2})/);
    const aliases=parts?[`${parts[1]}/${Number(parts[2])}`,`${parts[1]}年${Number(parts[2])}月`,`${parts[1]}${parts[2]}`]:[];
    const text=normalizeText([e.period,e.work,e.officialName,e.id,e.category,...aliases].join(" "));
    searchTextCache.set(e,text);
    return text;
  }
  function newestSortThreshold(){
    const count=Number(APP_CONFIG.newItemCount||12);
    return [...EVENTS].sort((a,b)=>b.sort-a.sort)[Math.max(0,count-1)]?.sort||Infinity;
  }
  function isNewEvent(e){return Number(e.sort)>=newestSortThreshold()}
  function isGraduated(m){return m?.status==="graduated"}
  const memberRuleCache=new WeakMap();
  function memberRules(m){
    let rules=memberRuleCache.get(m);
    if(!rules){
      rules={
        include:new Set(Array.isArray(m.includeEventIds)?m.includeEventIds:[]),
        exclude:new Set(Array.isArray(m.excludeEventIds)?m.excludeEventIds:[]),
        graduated:isGraduated(m),
        maxSort:Number(m.maxSort)
      };
      memberRuleCache.set(m,rules);
    }
    return rules;
  }
  function eventAvailableForMember(e,m){
    if(!m)return true;
    const rules=memberRules(m);
    if(rules.exclude.has(e.id))return false;
    if(rules.include.has(e.id))return true;
    return !rules.graduated||Number(e.sort)<=rules.maxSort;
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
    const graduated=MEMBERS.filter(isGraduated).map(m=>`<option value="${m.id}" ${state.pageMemberId===m.id?"selected":""}>${m.emoji} ${m.name}</option>`).join("");
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
    const threshold=newestSortThreshold();
    return base
      .filter(e=>{
        if(state.category&&e.category!==state.category)return false;
        if(state.yearFilter&&yearOf(e)!==state.yearFilter)return false;
        if(state.newFilter==="new"&&Number(e.sort)<threshold)return false;
        if(q&&!eventSearchText(e).includes(q))return false;
        return eventOwnershipMatches(e);
      })
      .slice()
      .sort((a,b)=>{
        if(state.sort==="asc")return a.sort-b.sort;
        if(state.sort==="new"){
          const newDiff=Number(isNewEvent(b))-Number(isNewEvent(a));
          return newDiff||b.sort-a.sort;
        }
        return b.sort-a.sort;
      });
  }
  function theme(m){
    const root=document.documentElement;
    root.style.setProperty("--accent",m?.accent||"#ef7fad");
    root.style.setProperty("--accent-2",memberAccent2(m));
    root.style.setProperty("--soft",m?.soft||"#fff0f6");
    root.style.setProperty("--soft-2",memberSoft2(m));
    root.style.setProperty("--page",m?.soft||"#fff8fb");
    root.style.setProperty("--member-bg",memberBackground(m));
    root.style.setProperty("--member-strong-bg",memberStrongBackground(m));
  }
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
    resetCollectionView();
    savePreferences();
    theme(MEMBERS.find(m=>m.id===id));
    openManager(destination);
  }
  function openAll(){
    state.mode="all";
    state.memberId=null;
    state.pageMemberId="";
    resetCollectionView();
    savePreferences();
    theme(null);
    openManager();
    const filter=document.getElementById("oshiFilter");
    if(filter)filter.value="";
  }
  function openManager(page="collection"){$("homeScreen").classList.add("hidden");$("managerScreen").classList.remove("hidden");showPage(page,true)}
  function updateHeader(){
    const m=MEMBERS.find(x=>x.id===state.memberId);
    $("memberTitle").textContent=state.mode==="all"?"🌈 全メンバー":m?`${m.emoji} ${m.name}`:"生写真管理";
    const labels={collection:"生写真コレクション",quick:"クイック入力",matrix:"イベント別チェック表",stats:"統計・年代別コンプ率",wishlist:"欲しい生写真一覧",trade:"ダブり・提供可能一覧",missing:"未所持一覧",oshi:"推しカスタマイズ",memberImages:"メンバー画像設定",bulkManage:"未所持・欲しい一括操作",help:"使い方",about:"バージョン情報",legal:"本サイトについて・利用上の注意",backup:"バックアップ・復元"};
    const pageLabel=labels[state.page]||"生写真管理";
    $("memberSub").textContent=state.mode==="member"&&m&&isGraduated(m)?`${m.graduation}｜${pageLabel}`:pageLabel;
    const heading=$("memberTitle")?.parentElement;
    if(heading){
      const themed=state.mode==="member"&&!!m;
      heading.classList.toggle("member-color-heading",themed);
      applyMemberVars(heading,themed?m:null);
    }
  }
  function showPage(page,skipScrollSave=false){
    if(!skipScrollSave)saveScrollPosition();
    if($("homeScreen").classList.contains("hidden")===false){state.mode="all";state.memberId=null;theme(null);$("homeScreen").classList.add("hidden");$("managerScreen").classList.remove("hidden")}
    state.page=page;
    ["collection","quick","matrix","stats","wishlist","trade","missing","oshi","bonus","bonusAdd","memberImages","bulkManage","backup","help","legal","about"].forEach(p=>$(p+"Page").classList.toggle("hidden",p!==page));
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
    if(page==="bonus")renderBonus();
    if(page==="bonusAdd")renderBonusAdd();
    if(page==="memberImages")renderMemberImages();
    if(page==="bulkManage")renderBulkManage();
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
    safeStorageWrite(COUNT_KEY,(state.counts));safeStorageWrite(WANT_KEY,(state.wants));
    if(!skipSheet)closeUtilitySheet("bulkSheetOverlay");
    showActionToast(changed?`${changed}件を更新しました`:`変更対象はありませんでした`);
    if(state.page==="quick")renderQuick();else if(state.page==="matrix")renderMatrix();else renderCollection();
  }
  let toastTimer=0;
  function showActionToast(message,undo){
    const toast=$("actionToast");
    toast.textContent="";
    const label=document.createElement("span");
    label.textContent=message;
    toast.appendChild(label);
    if(typeof undo==="function"){
      const button=document.createElement("button");
      button.type="button";
      button.className="toast-undo";
      button.textContent="元に戻す";
      button.onclick=()=>{toast.classList.add("hidden");clearTimeout(toastTimer);undo()};
      toast.appendChild(button);
    }
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.add("hidden"),undo?5200:2400);
  }
  function statsFor(ms,evs=EVENTS){
    let total=0,types=0,signed=0,wanted=0,possible=0;
    const counts=state.counts,signs=state.signs,wants=state.wants;
    for(const m of ms){
      const mid=m.id;
      for(const e of evs){
        if(!eventAvailableForMember(e,m))continue;
        const prefix=`${e.id}__${mid}__`;
        for(const p of POSITIONS){
          const key=prefix+p.id;
          possible++;
          const n=Number(counts[key]||0);
          total+=n;
          if(n>0)types++;
          if(signs[key])signed++;
          if(wants[key])wanted++;
        }
      }
    }
    return{total,types,signed,wanted,possible,rate:possible?Math.round(types/possible*100):0};
  }
  function updateSummary(){
    const s=statsFor(scopeMembers());
    const total=$("ownedTotal"),types=$("ownedTypes"),signed=$("signedTotal");
    if(total)total.textContent=s.total;
    if(types)types.textContent=s.types;
    if(signed)signed.textContent=s.signed;
  }
  function refreshCardBadges(e,m){
    const card=$("eventList")?.querySelector(`.event-card[data-event-id="${CSS.escape(e.id)}"]`);
    if(!card)return;
    const badges=card.querySelector(".badges");
    if(badges&&state.mode!=="all"){
      const has=badges.querySelector(".complete");
      const done=complete(e,m);
      if(done&&!has){
        const badge=document.createElement("span");
        badge.className="badge complete";
        badge.textContent="COMPLETE";
        badges.appendChild(badge);
      }else if(!done&&has)has.remove();
    }
    const summary=card.querySelector(".all-summary");
    if(summary){
      const eligible=eligibleMembersForEvent(e);
      let owned=0,want=0,comp=0;
      eligible.forEach(member=>{
        const prefix=`${e.id}__${member.id}__`;
        POSITIONS.forEach(position=>{
          owned+=Number(state.counts[prefix+position.id]||0);
          if(state.wants[prefix+position.id])want++;
        });
        if(complete(e,member))comp++;
      });
      summary.textContent=`所持 ${owned}枚 ／ 欲しい ${want}種 ／ コンプ ${comp}/${eligible.length}人`;
    }
  }
  function complete(e,m){
    const prefix=`${e.id}__${m.id}__`;
    return POSITIONS.every(p=>Number(state.counts[prefix+p.id]||0)>0);
  }
  function renderPositionRow(e,m,p,compact=false){const row=document.createElement("div");row.className=compact?"mini-pos":"pos-row";row.innerHTML=compact?`<div class="mini-label">${p.name}</div><div class="mini-actions"><button class="minus">−</button><b class="num">${getCount(e.id,m.id,p.id)}</b><button class="plus">＋</button><button class="wide sign ${isSigned(e.id,m.id,p.id)?"on":""}">✍️</button><button class="wide want ${isWanted(e.id,m.id,p.id)?"on":""}">♡</button></div>`:`<span>${p.name}</span><div class="pos-actions"><button class="icon-btn want ${isWanted(e.id,m.id,p.id)?"on":""}">♡</button><button class="icon-btn sign ${isSigned(e.id,m.id,p.id)?"on":""}">✍️</button><div class="counter"><button class="minus">−</button><span class="count num">${getCount(e.id,m.id,p.id)}</span><button class="plus">＋</button></div></div>`;
  const minus=row.querySelector(".minus"),plus=row.querySelector(".plus"),sign=row.querySelector(".sign"),want=row.querySelector(".want");
  const numberCell=row.querySelector(compact?".num":".count");
  const label=`${e.period||e.officialName}／${m.name}／${p.name}`;
  minus.setAttribute("aria-label",`${label} を1枚減らす`);
  plus.setAttribute("aria-label",`${label} を1枚増やす`);
  sign.setAttribute("aria-label",`${label} の直筆サインを切り替え`);
  want.setAttribute("aria-label",`${label} の欲しいを切り替え`);
  [minus,plus,sign,want].forEach(button=>{button.type="button"});
  function refresh(){
    const n=getCount(e.id,m.id,p.id);
    if(numberCell)numberCell.textContent=n;
    sign.classList.toggle("on",isSigned(e.id,m.id,p.id));
    sign.setAttribute("aria-pressed",String(isSigned(e.id,m.id,p.id)));
    want.classList.toggle("on",isWanted(e.id,m.id,p.id));
    want.setAttribute("aria-pressed",String(isWanted(e.id,m.id,p.id)));
    refreshCardBadges(e,m);
    updateSummary();
  }
  const applyCount=next=>{
    const before=getCount(e.id,m.id,p.id);
    if(next===before)return;
    setCount(e.id,m.id,p.id,next);
    refresh();
    showActionToast(`${p.name} を ${next}枚 にしました`,()=>{setCount(e.id,m.id,p.id,before);refresh()});
  };
  minus.onclick=()=>applyCount(Math.max(0,getCount(e.id,m.id,p.id)-1));
  plus.onclick=()=>applyCount(getCount(e.id,m.id,p.id)+1);
  sign.onclick=()=>{
    toggleSign(e.id,m.id,p.id);refresh();
    showActionToast(isSigned(e.id,m.id,p.id)?`${p.name} を直筆ありにしました`:`${p.name} の直筆を外しました`,()=>{toggleSign(e.id,m.id,p.id);refresh()});
  };
  want.onclick=()=>{
    toggleWant(e.id,m.id,p.id);refresh();
    showActionToast(isWanted(e.id,m.id,p.id)?`${p.name} を欲しいに追加しました`:`${p.name} の欲しいを外しました`,()=>{toggleWant(e.id,m.id,p.id);refresh()});
  };
  refresh();
  return row}
  function renderMemberCard(e,m){const card=document.createElement("article");card.className="event-card";card.dataset.eventId=e.id;card.innerHTML=`<div class="event-head"><div class="event-topline"><div><div class="period">${esc(e.period||e.officialName)}</div><div class="work">${esc(e.work)}</div></div><div class="badges"><span class="badge">${esc(e.category)}</span>${isNewEvent(e)?'<span class="badge new-badge">NEW</span>':''}${complete(e,m)?'<span class="badge complete">COMPLETE</span>':''}</div></div></div><div class="member-line">${m.emoji} ${m.name}</div><div class="positions"></div><div class="event-footer"></div>`;
  POSITIONS.forEach(p=>card.querySelector(".positions").appendChild(renderPositionRow(e,m,p)));const f=card.querySelector(".event-footer");f.innerHTML=`<button class="card-bulk-button">⋯ 一括操作</button>${safeOfficialUrl(e.officialUrl)?`<a href="${esc(safeOfficialUrl(e.officialUrl))}" target="_blank" rel="noopener noreferrer">公式サイト ↗</a>`:""}`;const bulk=f.querySelector(".card-bulk-button");bulk.type="button";bulk.setAttribute("aria-label",`${e.period||e.officialName} ${m.name} の一括操作`);bulk.onclick=()=>openBulkSheet(e.id,m.id);return card}
  function renderAllCard(e){const card=document.createElement("article");card.className="event-card";card.dataset.eventId=e.id;const eligible=eligibleMembersForEvent(e),owned=eligible.reduce((t,m)=>t+POSITIONS.reduce((s,p)=>s+getCount(e.id,m.id,p.id),0),0),want=eligible.reduce((t,m)=>t+POSITIONS.filter(p=>isWanted(e.id,m.id,p.id)).length,0),comp=eligible.filter(m=>complete(e,m)).length;card.innerHTML=`<div class="event-head"><div class="event-topline"><div><div class="period">${esc(e.period||e.officialName)}</div><div class="work">${esc(e.work)}</div><div class="all-summary">所持 ${owned}枚 ／ 欲しい ${want}種 ／ コンプ ${comp}/${eligible.length}人</div></div><div class="badges">${isNewEvent(e)?'<span class="badge new-badge">NEW</span>':''}<span class="badge">${esc(e.category)}</span></div></div></div><div class="event-footer"><button class="expand-btn">${state.expanded[e.id]?"閉じる":`${eligible.length}人分を開く`}</button><button class="card-bulk-button">⋯ 一括操作</button>${safeOfficialUrl(e.officialUrl)?`<a href="${esc(safeOfficialUrl(e.officialUrl))}" target="_blank" rel="noopener noreferrer">公式サイト ↗</a>`:""}</div>`;const expandButton=card.querySelector(".expand-btn");
expandButton.type="button";
expandButton.setAttribute("aria-expanded",String(!!state.expanded[e.id]));
expandButton.onclick=()=>{
  state.expanded[e.id]=!state.expanded[e.id];
  const open=!!state.expanded[e.id];
  expandButton.setAttribute("aria-expanded",String(open));
  expandButton.textContent=open?"閉じる":`${eligible.length}人分を開く`;
  const existing=card.querySelector(".all-members");
  if(existing)existing.remove();
  if(open)card.insertBefore(buildAllMembersBox(e,eligible),card.querySelector(".event-footer"));
};const bulkAll=card.querySelector(".card-bulk-button");bulkAll.type="button";bulkAll.setAttribute("aria-label",`${e.period||e.officialName} の一括操作`);bulkAll.onclick=()=>openBulkSheet(e.id,"");if(state.expanded[e.id])card.insertBefore(buildAllMembersBox(e,eligible),card.querySelector(".event-footer"));return card}
  function buildAllMembersBox(e,eligible){
    const box=document.createElement("div");
    box.className="all-members";
    eligible.forEach(m=>{
      const r=document.createElement("div");
      r.className="all-row";
      r.innerHTML=`<div class="all-name">${m.emoji} ${esc(m.name)}${isGraduated(m)?'<span class="mini-graduated">卒業</span>':''}</div><div class="all-pos-grid"></div>`;
      const grid=r.querySelector(".all-pos-grid");
      POSITIONS.forEach(p=>grid.appendChild(renderPositionRow(e,m,p,true)));
      box.appendChild(r);
    });
    return box;
  }

  const BONUS_DB_NAME="equal-love-photo-manager-bonus-items";
  const BONUS_DB_VERSION=1;
  const BONUS_STORE="bonusItems";
  const BONUS_TYPES=["生写真","カード","クリアしおり","ステッカー","その他"];
  const bonusItems=new Map();
  const bonusUrls=new Map();
  let bonusDbPromise=null;
  let bonusReady=false;
  let bonusLoadError="";
  let bonusDraft=null;
  let bonusDraftUrl="";
  const bonusFilter={memberId:"",source:"",type:""};

  function openBonusDb(){
    if(bonusDbPromise)return bonusDbPromise;
    bonusDbPromise=new Promise((resolve,reject)=>{
      if(!("indexedDB" in window)){reject(new Error("このブラウザは端末内保存に対応していません"));return}
      const request=indexedDB.open(BONUS_DB_NAME,BONUS_DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(BONUS_STORE)){
          db.createObjectStore(BONUS_STORE,{keyPath:"id",autoIncrement:true});
        }
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error("保存領域を開けませんでした"));
      request.onblocked=()=>reject(new Error("保存領域の更新がブロックされています"));
    });
    return bonusDbPromise;
  }
  function bonusDbRequest(mode,operation){
    return openBonusDb().then(db=>new Promise((resolve,reject)=>{
      const transaction=db.transaction(BONUS_STORE,mode);
      const store=transaction.objectStore(BONUS_STORE);
      let request,settled=false,result;
      const fail=error=>{if(settled)return;settled=true;reject(error||new Error("保存領域の操作に失敗しました"))};
      try{request=operation(store)}catch(error){fail(error);return}
      if(request){
        request.onsuccess=()=>{result=request.result};
        request.onerror=()=>fail(request.error);
      }
      transaction.oncomplete=()=>{if(!settled){settled=true;resolve(result)}};
      transaction.onerror=()=>fail(transaction.error);
      transaction.onabort=()=>fail(transaction.error);
    }));
  }
  function normalizeBonusItem(item){
    const memberId=String(item?.memberId||"");
    const type=BONUS_TYPES.includes(item?.type)?item.type:BONUS_TYPES[0];
    return {
      ...(item?.id!==undefined?{id:item.id}:{}),
      memberId,
      source:cleanShortText(item?.source,""),
      type,
      label:cleanShortText(item?.label,""),
      note:cleanShortText(item?.note,""),
      quantity:Math.min(99,Math.max(1,Math.round(Number(item?.quantity)||1))),
      orientation:item?.orientation==="landscape"?"landscape":"portrait",
      positionX:imageNumber(item?.positionX,50,0,100),
      positionY:imageNumber(item?.positionY,50,0,100),
      zoom:imageNumber(item?.zoom,1,1,2.4),
      blob:item?.blob instanceof Blob?item.blob:null,
      thumbBlob:item?.thumbBlob instanceof Blob?item.thumbBlob:null,
      updatedAt:String(item?.updatedAt||new Date().toISOString())
    };
  }
  function bonusDisplayUrl(item,thumb=true){
    const key=`${item.id}:${thumb?"t":"f"}`;
    if(bonusUrls.has(key))return bonusUrls.get(key);
    const blob=thumb?(item.thumbBlob||item.blob):(item.blob||item.thumbBlob);
    if(!(blob instanceof Blob))return "";
    try{
      const url=URL.createObjectURL(blob);
      bonusUrls.set(key,url);
      return url;
    }catch(error){
      console.warn("封入特典の表示URLを作成できませんでした",error);
      return "";
    }
  }
  function releaseBonusUrls(id){
    [...bonusUrls.keys()].forEach(key=>{
      if(id===undefined||key.startsWith(`${id}:`)){
        const url=bonusUrls.get(key);
        if(url?.startsWith("blob:"))URL.revokeObjectURL(url);
        bonusUrls.delete(key);
      }
    });
  }
  async function loadBonusItems(){
    try{
      const rows=await bonusDbRequest("readonly",store=>store.getAll());
      releaseBonusUrls();
      bonusItems.clear();
      (Array.isArray(rows)?rows:[]).forEach(row=>{
        const item=normalizeBonusItem(row);
        if(item.id!==undefined)bonusItems.set(item.id,item);
      });
      bonusReady=true;
      bonusLoadError="";
    }catch(error){
      bonusReady=false;
      bonusLoadError=error.message||"読み込みに失敗しました";
      console.warn("封入特典を読み込めませんでした",error);
    }
  }
  function bonusSources(){
    return [...new Set([...bonusItems.values()].map(item=>item.source).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,"ja"));
  }
  function bonusFilteredItems(){
    return [...bonusItems.values()]
      .filter(item=>!bonusFilter.memberId||item.memberId===bonusFilter.memberId)
      .filter(item=>!bonusFilter.source||item.source===bonusFilter.source)
      .filter(item=>!bonusFilter.type||item.type===bonusFilter.type)
      .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }
  async function makeBonusThumbnail(blob){
    const image=await loadImageElement(blob);
    const naturalWidth=image.naturalWidth||image.width;
    const naturalHeight=image.naturalHeight||image.height;
    const maxSide=320;
    const scale=Math.min(1,maxSide/Math.max(naturalWidth,naturalHeight));
    const width=Math.max(1,Math.round(naturalWidth*scale));
    const height=Math.max(1,Math.round(naturalHeight*scale));
    const canvas=document.createElement("canvas");
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext("2d",{alpha:false});
    if(!context)return null;
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality="high";
    context.fillStyle="#ffffff";
    context.fillRect(0,0,width,height);
    context.drawImage(image,0,0,width,height);
    let thumb=await canvasToBlob(canvas,"image/webp",0.8);
    if(!thumb)thumb=await canvasToBlob(canvas,"image/jpeg",0.82);
    canvas.width=1;canvas.height=1;
    return {thumb,landscape:naturalWidth>naturalHeight};
  }
  function chooseBonusPhoto(){
    const input=document.createElement("input");
    input.type="file";
    input.accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
    input.onchange=async()=>{
      const file=input.files?.[0];
      if(!file)return;
      showActionToast("写真を処理しています…");
      try{
        const blob=await compressMemberImage(file);
        const made=await makeBonusThumbnail(blob);
        if(bonusDraftUrl)URL.revokeObjectURL(bonusDraftUrl);
        bonusDraft={
          ...(bonusDraft||{}),
          blob,
          thumbBlob:made?.thumb||null,
          orientation:made?.landscape?"landscape":"portrait"
        };
        bonusDraftUrl=URL.createObjectURL(blob);
        renderBonusCurrent();
      }catch(error){
        alert(`写真を設定できませんでした：${error.message}`);
      }
    };
    input.click();
  }
  function readBonusForm(){
    const get=id=>$(id)?.value??"";
    return {
      memberId:get("bonusMemberSelect"),
      source:get("bonusSourceInput").trim(),
      type:get("bonusTypeSelect"),
      label:get("bonusLabelInput").trim(),
      quantity:Number(get("bonusQuantityInput")||1),
      note:get("bonusNoteInput").trim()
    };
  }
  async function saveBonusDraft(){
    const form=readBonusForm();
    const message=$("bonusFormMessage");
    const fail=text=>{if(message){message.textContent=text;message.className="backup-message error"}};
    if(!bonusDraft?.blob){fail("写真を選んでください");return}
    if(!form.memberId){fail("メンバーを選んでください");return}
    if(!form.source){fail("封入元を入力してください");return}
    const record=normalizeBonusItem({
      ...(bonusDraft.id!==undefined?{id:bonusDraft.id}:{}),
      ...form,
      orientation:bonusDraft.orientation,
      positionX:bonusDraft.positionX,
      positionY:bonusDraft.positionY,
      zoom:bonusDraft.zoom,
      blob:bonusDraft.blob,
      thumbBlob:bonusDraft.thumbBlob,
      updatedAt:new Date().toISOString()
    });
    try{
      const wasEditing=bonusDraft.id!==undefined;
      await bonusDbRequest("readwrite",store=>store.put(record));
      await loadBonusItems();
      clearBonusDraft();
      showPage("bonus");
      showActionToast(wasEditing?"封入特典を更新しました":"封入特典を登録しました");
    }catch(error){
      fail(`保存できませんでした：${error.message}`);
    }
  }
  function clearBonusDraft(){
    if(bonusDraftUrl)URL.revokeObjectURL(bonusDraftUrl);
    bonusDraftUrl="";
    bonusDraft=null;
  }
  function renderBonusCurrent(){
    if(state.page==="bonusAdd")renderBonusAdd();else renderBonus();
  }
  function editBonusItem(id){
    const item=bonusItems.get(Number(id));
    if(!item)return;
    clearBonusDraft();
    bonusDraft={...item};
    if(item.blob instanceof Blob)bonusDraftUrl=URL.createObjectURL(item.blob);
    renderBonus();
    $("bonusFormPanel")?.scrollIntoView({block:"start"});
  }
  async function deleteBonusItem(id){
    const item=bonusItems.get(Number(id));
    if(!item)return;
    if(!confirm(`${item.source||"この封入特典"}の登録を削除しますか？`))return;
    try{
      await bonusDbRequest("readwrite",store=>store.delete(item.id));
      releaseBonusUrls(item.id);
      await loadBonusItems();
      renderBonus();
      showActionToast("封入特典を削除しました");
    }catch(error){
      alert(`削除できませんでした：${error.message}`);
    }
  }
  function bonusCardMarkup(item){
    const member=MEMBERS.find(m=>m.id===item.memberId);
    const url=bonusDisplayUrl(item);
    const frame=item.orientation==="landscape"?"bonus-thumb landscape":"bonus-thumb";
    const style=`object-position:${item.positionX}% ${item.positionY}%;transform:scale(${item.zoom})`;
    const photo=url
      ?`<img src="${esc(url)}" alt="${esc(item.source||"封入特典")}" loading="lazy" decoding="async" style="${style}">`
      :`<span class="bonus-thumb-empty">画像なし</span>`;
    return `<article class="bonus-card">
      <div class="${frame}">${photo}</div>
      <div class="bonus-card-body">
        <p class="bonus-source">${esc(item.source||"封入元なし")}</p>
        <p class="bonus-meta">${esc(item.type)} ・ ${item.quantity}枚</p>
        <p class="bonus-member">${member?`${member.emoji} ${esc(member.name)}`:"メンバー未設定"}</p>
        ${item.label?`<p class="bonus-label">${esc(item.label)}</p>`:""}
        ${item.note?`<p class="bonus-note">${esc(item.note)}</p>`:""}
        <div class="bonus-card-actions">
          <button type="button" class="bonus-edit" data-bonus-edit="${item.id}">編集</button>
          <button type="button" class="bonus-delete" data-bonus-delete="${item.id}">削除</button>
        </div>
      </div>
    </article>`;
  }
  function bonusFormMarkup(){
    const sources=bonusSources();
    const draftUrl=bonusDraftUrl;
    const draftFrame=bonusDraft?.orientation==="landscape"?"bonus-thumb landscape":"bonus-thumb";
    const editing=bonusDraft?.id!==undefined;
    return `<div class="panel" id="bonusFormPanel">
        <h3>${editing?"登録内容を編集":"新しく登録"}</h3>
        <button type="button" id="bonusPhotoButton" class="bonus-photo-picker">
          ${draftUrl?`<span class="${draftFrame}"><img src="${esc(draftUrl)}" alt="選択中の写真"></span>`:`<span class="bonus-photo-empty">📷 写真を撮る / 選ぶ</span>`}
        </button>
        <label class="bonus-label-text" for="bonusMemberSelect">メンバー</label>
        <select id="bonusMemberSelect">
          <option value="">選択してください</option>
          ${MEMBERS.map(m=>`<option value="${esc(m.id)}" ${bonusDraft?.memberId===m.id?"selected":""}>${esc(m.name)}</option>`).join("")}
        </select>
        <label class="bonus-label-text" for="bonusSourceInput">封入元</label>
        <input id="bonusSourceInput" type="text" maxlength="80" placeholder="ラブソングに襲われる 初回限定盤A" value="${esc(bonusDraft?.source||"")}">
        ${sources.length?`<div class="bonus-source-chips">${sources.slice(0,8).map(source=>`<button type="button" class="bonus-source-chip" data-bonus-source="${esc(source)}">${esc(source)}</button>`).join("")}</div>`:""}
        <div class="bonus-form-grid">
          <div>
            <label class="bonus-label-text" for="bonusTypeSelect">種別</label>
            <select id="bonusTypeSelect">${BONUS_TYPES.map(type=>`<option value="${esc(type)}" ${bonusDraft?.type===type?"selected":""}>${esc(type)}</option>`).join("")}</select>
          </div>
          <div>
            <label class="bonus-label-text" for="bonusQuantityInput">枚数</label>
            <input id="bonusQuantityInput" type="number" min="1" max="99" value="${bonusDraft?.quantity||1}">
          </div>
        </div>
        <label class="bonus-label-text" for="bonusLabelInput">絵柄のメモ（任意）</label>
        <input id="bonusLabelInput" type="text" maxlength="60" placeholder="ピンク衣装・ウインク" value="${esc(bonusDraft?.label||"")}">
        <label class="bonus-label-text" for="bonusNoteInput">備考（任意）</label>
        <input id="bonusNoteInput" type="text" maxlength="80" placeholder="トレード用" value="${esc(bonusDraft?.note||"")}">
        <div class="bonus-orientation-row">
          <span class="bonus-label-text">向き</span>
          <button type="button" id="bonusOrientationButton" class="bonus-source-chip">${bonusDraft?.orientation==="landscape"?"よこ（L判）":"たて（L判）"}</button>
        </div>
        <div id="bonusFormMessage" class="backup-message"></div>
        <button type="button" id="bonusSaveButton" class="primary-action">${editing?"変更を保存":"この内容で登録"}</button>
        ${bonusDraft?`<button type="button" id="bonusCancelButton" class="secondary-action">入力をやめる</button>`:""}
      </div>`;
  }
  function bonusSummaryMarkup(){
    const totalSheets=[...bonusItems.values()].reduce((sum,item)=>sum+item.quantity,0);
    return `<div class="backup-summary">
        <div><b>${totalSheets}</b><span>合計枚数</span></div>
        <div><b>${bonusItems.size}</b><span>登録した絵柄</span></div>
      </div>`;
  }
  function withBonusReady(pageId,title,render){
    const page=$(pageId);
    if(!page)return null;
    if(!bonusReady&&!bonusLoadError){
      page.innerHTML=`<div class="page-head"><h2>${title}</h2><p>読み込み中です…</p></div>`;
      loadBonusItems().then(render);
      return null;
    }
    return page;
  }
  function renderBonusAdd(){
    const page=withBonusReady("bonusAddPage","📷 封入特典を登録",renderBonusAdd);
    if(!page)return;
    page.innerHTML=`
      <div class="page-head"><h2>📷 封入特典を登録</h2><p>写真を撮って、封入元とメンバーを記録します</p></div>
      ${bonusLoadError?`<div class="backup-message error">${esc(bonusLoadError)}</div>`:""}
      ${bonusFormMarkup()}
      <div class="panel">
        <h3>登録のコツ</h3>
        <p class="bonus-hint">封入元は2回目から履歴のボタンで選べます。同じ絵柄を複数枚持っている場合は、1件として登録して枚数を増やしてください。</p>
        <button type="button" id="bonusGoListButton" class="secondary-action">一覧を見る</button>
      </div>`;
    bindBonusEvents();
  }
  function renderBonus(){
    const page=withBonusReady("bonusPage","🎁 封入特典の一覧",renderBonus);
    if(!page)return;
    const items=bonusFilteredItems();
    const sources=bonusSources();
    page.innerHTML=`
      <div class="page-head"><h2>🎁 封入特典の一覧</h2><p>登録した封入特典を見る・編集する</p></div>
      ${bonusLoadError?`<div class="backup-message error">${esc(bonusLoadError)}</div>`:""}
      ${bonusSummaryMarkup()}
      <button type="button" id="bonusGoAddButton" class="primary-action">📷 新しく登録する</button>
      ${bonusDraft?.id!==undefined?bonusFormMarkup():""}
      <div class="panel">
        <h3>登録済み（${items.length}件）</h3>
        <div class="bonus-filter-grid">
          <select id="bonusMemberFilter">
            <option value="">すべてのメンバー</option>
            ${MEMBERS.map(m=>`<option value="${esc(m.id)}" ${bonusFilter.memberId===m.id?"selected":""}>${esc(m.name)}</option>`).join("")}
          </select>
          <select id="bonusTypeFilter">
            <option value="">すべての種別</option>
            ${BONUS_TYPES.map(type=>`<option value="${esc(type)}" ${bonusFilter.type===type?"selected":""}>${esc(type)}</option>`).join("")}
          </select>
        </div>
        <select id="bonusSourceFilter" class="bonus-source-filter">
          <option value="">すべての封入元</option>
          ${sources.map(source=>`<option value="${esc(source)}" ${bonusFilter.source===source?"selected":""}>${esc(source)}</option>`).join("")}
        </select>
        ${items.length?`<div class="bonus-grid">${items.map(bonusCardMarkup).join("")}</div>`:`<div class="empty-state"><span>🎁</span><h3>まだ登録がありません</h3><p>「新しく登録する」から追加できます。</p></div>`}
      </div>
      <div class="panel">
        <h3>封入特典のバックアップ</h3>
        <p class="bonus-hint">写真を含むため、生写真のバックアップとは別ファイルに保存します。合計が上限を超える場合は保存できません。</p>
        <button type="button" id="bonusExportButton" class="primary-action">封入特典を書き出す</button>
        <input id="bonusImportInput" class="file-input" type="file" accept=".json,application/json">
        <label for="bonusImportInput" class="secondary-action">書き出したファイルから復元</label>
        <div id="bonusBackupMessage" class="backup-message"></div>
      </div>`;
    bindBonusEvents();
  }

  const BONUS_BACKUP_LIMIT=40*1024*1024;
  function bonusBackupMessage(text,error){
    const box=$("bonusBackupMessage");
    if(!box)return;
    box.textContent=text;
    box.className=error?"backup-message error":"backup-message";
  }
  async function exportBonusBackup(){
    if(!bonusItems.size){bonusBackupMessage("登録がないため、書き出せません",true);return}
    bonusBackupMessage("書き出しています…",false);
    try{
      const items=[];
      let bytes=0;
      for(const item of bonusItems.values()){
        bytes+=(item.blob?.size||0)+(item.thumbBlob?.size||0);
        if(bytes>BONUS_BACKUP_LIMIT){
          bonusBackupMessage("画像の合計が大きすぎます。不要な登録を整理してから書き出してください",true);
          return;
        }
        items.push({
          memberId:item.memberId,
          source:item.source,
          type:item.type,
          label:item.label,
          note:item.note,
          quantity:item.quantity,
          orientation:item.orientation,
          positionX:item.positionX,
          positionY:item.positionY,
          zoom:item.zoom,
          updatedAt:item.updatedAt,
          photo:await blobToDataUrl(item.blob),
          thumb:item.thumbBlob?await blobToDataUrl(item.thumbBlob):""
        });
      }
      const payload={
        app:"equal-love-photo-manager",
        backupType:"bonus-items",
        backupVersion:1,
        exportedAt:new Date().toISOString(),
        sourceVersion:APP_CONFIG.version,
        items
      };
      const blob=new Blob([JSON.stringify(payload)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      const d=new Date(),pad=n=>String(n).padStart(2,"0");
      link.href=url;
      link.download=`equal-love-bonus-backup-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      bonusBackupMessage(`${items.length}件を書き出しました`,false);
    }catch(error){
      console.warn("封入特典の書き出しに失敗しました",error);
      bonusBackupMessage(`書き出せませんでした：${error.message}`,true);
    }
  }
  function sanitizeBonusBackupItem(raw){
    if(!validObject(raw))return null;
    const memberId=String(raw.memberId||"");
    if(!MEMBERS.some(member=>member.id===memberId))return null;
    const photo=String(raw.photo||"");
    if(!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo))return null;
    const thumb=String(raw.thumb||"");
    return {
      memberId,
      source:cleanShortText(raw.source,""),
      type:BONUS_TYPES.includes(raw.type)?raw.type:BONUS_TYPES[0],
      label:cleanShortText(raw.label,""),
      note:cleanShortText(raw.note,""),
      quantity:Math.min(99,Math.max(1,Math.round(Number(raw.quantity)||1))),
      orientation:raw.orientation==="landscape"?"landscape":"portrait",
      positionX:imageNumber(raw.positionX,50,0,100),
      positionY:imageNumber(raw.positionY,50,0,100),
      zoom:imageNumber(raw.zoom,1,1,2.4),
      updatedAt:validDateString(raw.updatedAt)?raw.updatedAt:new Date().toISOString(),
      photo,
      thumb:/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(thumb)?thumb:""
    };
  }
  async function importBonusBackup(file){
    if(!file)return;
    if(file.size<=0||file.size>BONUS_BACKUP_LIMIT){bonusBackupMessage("ファイルのサイズが不正です",true);return}
    bonusBackupMessage("ファイルを確認しています…",false);
    try{
      const text=await file.text();
      const payload=JSON.parse(text);
      if(!validObject(payload)||payload.app!=="equal-love-photo-manager")throw new Error("別のアプリのファイルです");
      if(payload.backupType!=="bonus-items")throw new Error("封入特典のバックアップではありません");
      const rows=(Array.isArray(payload.items)?payload.items:[]).map(sanitizeBonusBackupItem).filter(Boolean);
      if(!rows.length)throw new Error("復元できる登録がありません");
      const mode=bonusItems.size
        ?confirm(`${rows.length}件を復元します。\n\nOK：今の登録を消して置き換える\nキャンセル：今の登録に追加する`)?"replace":"append"
        :"replace";
      if(mode==="replace"&&bonusItems.size&&!confirm(`今の登録 ${bonusItems.size}件をすべて削除して置き換えます。よろしいですか？`))return;
      if(mode==="replace"){
        await bonusDbRequest("readwrite",store=>store.clear());
        releaseBonusUrls();
      }
      for(const row of rows){
        const record=normalizeBonusItem({
          ...row,
          blob:await dataUrlToBlob(row.photo),
          thumbBlob:row.thumb?await dataUrlToBlob(row.thumb):null
        });
        await bonusDbRequest("readwrite",store=>store.put(record));
      }
      await loadBonusItems();
      renderBonus();
      bonusBackupMessage(`${rows.length}件を復元しました`,false);
      showActionToast("封入特典を復元しました");
    }catch(error){
      console.warn("封入特典の復元に失敗しました",error);
      bonusBackupMessage(`復元できませんでした：${error.message}`,true);
    }
  }

  function bindBonusEvents(){
    $("bonusPhotoButton")?.addEventListener("click",chooseBonusPhoto);
    $("bonusSaveButton")?.addEventListener("click",saveBonusDraft);
    $("bonusCancelButton")?.addEventListener("click",()=>{clearBonusDraft();showPage("bonus")});
    $("bonusOrientationButton")?.addEventListener("click",()=>{
      bonusDraft=bonusDraft||{};
      bonusDraft.orientation=bonusDraft.orientation==="landscape"?"portrait":"landscape";
      const form=readBonusForm();
      Object.assign(bonusDraft,form);
      renderBonusCurrent();
    });
    document.querySelectorAll("[data-bonus-source]").forEach(button=>{
      button.addEventListener("click",()=>{
        const input=$("bonusSourceInput");
        if(input)input.value=button.dataset.bonusSource;
      });
    });
    document.querySelectorAll("[data-bonus-edit]").forEach(button=>{
      button.addEventListener("click",()=>editBonusItem(button.dataset.bonusEdit));
    });
    document.querySelectorAll("[data-bonus-delete]").forEach(button=>{
      button.addEventListener("click",()=>deleteBonusItem(button.dataset.bonusDelete));
    });
    $("bonusGoAddButton")?.addEventListener("click",()=>{clearBonusDraft();showPage("bonusAdd")});
    $("bonusGoListButton")?.addEventListener("click",()=>showPage("bonus"));
    $("bonusExportButton")?.addEventListener("click",exportBonusBackup);
    $("bonusImportInput")?.addEventListener("change",e=>importBonusBackup(e.target.files?.[0]));
    $("bonusMemberFilter")?.addEventListener("change",e=>{bonusFilter.memberId=e.target.value;renderBonus()});
    $("bonusTypeFilter")?.addEventListener("change",e=>{bonusFilter.type=e.target.value;renderBonus()});
    $("bonusSourceFilter")?.addEventListener("change",e=>{bonusFilter.source=e.target.value;renderBonus()});
  }

  function renderCollection(){
    renderCollectionFilterUi();
    const list=filtered();
    updateSummary();
    $("eventList").innerHTML="";
    if(!list.length){
      $("eventList").innerHTML=`<div class="empty-state"><span>🔍</span><h3>該当するデータがありません</h3><p>検索条件やフィルターを変更してください。</p><button id="resetFiltersButton">条件をリセット</button></div>`;
      document.getElementById("resetFiltersButton").onclick=()=>resetCollectionView({render:true,scrollTop:true});
      return;
    }
    const member=state.mode==="all"?null:MEMBERS.find(x=>x.id===state.memberId);
    const build=e=>state.mode==="all"?renderAllCard(e):renderMemberCard(e,member);
    // 復元先が指定されている時は分割せず一度に描く（目的のカードが未描画だと戻れないため）
    const targetIndex=pendingScrollTarget?list.findIndex(e=>e.id===pendingScrollTarget):-1;
    const savedTop=Number(getScrollMemory()[scrollContextKey()]||0);
    const firstChunk=targetIndex>=0?list.length:Math.max(30,savedTop>0?60:30);
    renderListInChunks($("eventList"),list,build,firstChunk);
  }
  let listRenderToken=0;
  function renderListInChunks(container,list,build,firstChunk=30,chunkSize=30){
    const token=++listRenderToken;
    const first=document.createDocumentFragment();
    list.slice(0,firstChunk).forEach(e=>first.appendChild(build(e)));
    container.appendChild(first);
    if(list.length<=firstChunk)return;
    let index=firstChunk;
    const step=()=>{
      if(token!==listRenderToken||!container.isConnected)return;
      const frag=document.createDocumentFragment();
      const end=Math.min(index+chunkSize,list.length);
      for(;index<end;index++)frag.appendChild(build(list[index]));
      container.appendChild(frag);
      if(index<list.length)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function renderStats(){
    const ms=scopeMembers(),all=statsFor(ms);
    const singleMember=ms.length===1?ms[0]:null;
    const statsVars=memberCssVars(singleMember);
    let years=[...new Set(EVENTS.filter(e=>ms.some(m=>eventAvailableForMember(e,m))).map(yearOf))].sort();
    const eventsByYear=new Map();
    EVENTS.forEach(e=>{const y=yearOf(e);if(!eventsByYear.has(y))eventsByYear.set(y,[]);eventsByYear.get(y).push(e)});
    let yearHtml=years.map(y=>{const ev=eventsByYear.get(y)||[],s=statsFor(ms,ev);return `<div class="year-row"><div class="year-line"><span>${y}年</span><span>${s.types}/${s.possible}種・${s.rate}%</span></div><div class="bar"><span style="width:${s.rate}%"></span></div></div>`}).join("");
    const title=singleMember
      ?`${memberAvatarMarkup(singleMember,"stats-member-avatar")}<div><small>メンバー別統計</small><h2>${esc(singleMember.name)}</h2></div>`
      :`<span class="stats-all-icon">🌈</span><div><small>全体統計</small><h2>全メンバー</h2><p>メンバーごとの収集状況を確認できます</p></div>`;
    $("statsPage").innerHTML=`<div class="page-head stats-themed-head" style="${statsVars}"><div class="stats-title-row">${title}</div></div><div class="page-filter dual-filter"><select id="pageMemberFilter">${pageMemberOptions()}</select><button id="statsOshiToggle" class="oshi-toggle ${state.oshiOnly?"on":""}">👑 推しだけ</button></div><div class="stat-grid stats-color-grid" style="${statsVars}"><div class="big-stat"><b>${all.total}</b><span>総所持枚数</span></div><div class="big-stat"><b>${all.types}</b><span>所持種類数</span></div><div class="big-stat"><b>${all.signed}</b><span>直筆あり</span></div><div class="big-stat"><b>${all.rate}%</b><span>全体コンプ率</span></div></div><div class="panel stats-year-panel" style="${statsVars}"><h3>年代別コンプ率</h3>${yearHtml}</div>`;
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
    const graduated=MEMBERS.filter(isGraduated).map(m=>`<option value="${m.id}" ${state.missingMemberId===m.id?"selected":""}>${m.emoji} ${m.name}</option>`).join("");
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
  function missingResultsHtml(memberGroups){
    return memberGroups.length?memberGroups.map(group=>`
      <section class="missing-member-section">
        <div class="missing-member-head" style="${memberCssVars(group.m)}">
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
      </section>`).join(""):'<div class="empty">条件に該当する未所持データはありません。</div>';
  }
  function updateMissingResults(){
    const memberGroups=groupedMissingItems();
    const eventCount=memberGroups.reduce((sum,g)=>sum+g.items.length,0);
    const typeCount=memberGroups.reduce((sum,g)=>sum+g.items.reduce((s,x)=>s+x.positions.length,0),0);
    const summary=$("missingSummary");
    const list=$("missingMemberList");
    if(summary)summary.textContent=`${memberGroups.length}人・${eventCount}イベント・${typeCount}種類が未所持です`;
    if(list)list.innerHTML=missingResultsHtml(memberGroups);
  }
  function renderMissing(){
    $("missingPage").innerHTML=`
      <div class="page-head"><h2>🔎 未所持一覧</h2><p id="missingSummary"></p></div>
      <div class="searchbox missing-search"><span>🔍</span><input id="missingSearchInput" type="search" value="${esc(state.missingSearch)}" placeholder="年月・楽曲名・ツアー名など"></div>
      ${listToolbarHtml("missing")}
      <div id="missingMemberList" class="missing-member-list"></div>`;
    bindListToolbar("missing");
    updateMissingResults();
    $("missingSearchInput").oninput=e=>{
      state.missingSearch=e.target.value;
      savePreferences();
      updateMissingResults();
    };
  }


  function bulkManageMembers(){
    const members=state.bulkMemberId?MEMBERS.filter(m=>m.id===state.bulkMemberId):MEMBERS;
    return rankedMembers(members);
  }
  function bulkManageSummary(){
    let missing=0,alreadyWanted=0;
    bulkManageMembers().forEach(member=>eligibleEventsForMember(member).forEach(event=>POSITIONS.forEach(position=>{
      if(getCount(event.id,member.id,position.id)!==0)return;
      missing++;
      if(isWanted(event.id,member.id,position.id))alreadyWanted++;
    })));
    return {missing,alreadyWanted,addable:Math.max(0,missing-alreadyWanted)};
  }
  function bulkManageMemberOptions(){
    const active=MEMBERS.filter(m=>!isGraduated(m)).map(m=>`<option value="${m.id}" ${state.bulkMemberId===m.id?"selected":""}>${m.emoji} ${m.name}</option>`).join("");
    const graduated=MEMBERS.filter(isGraduated).map(m=>`<option value="${m.id}" ${state.bulkMemberId===m.id?"selected":""}>${m.emoji} ${m.name}</option>`).join("");
    return `<option value="">全メンバー横断</option><optgroup label="現役メンバー">${active}</optgroup><optgroup label="卒業メンバー">${graduated}</optgroup>`;
  }
  function openBulkMissingList(){
    state.missingMemberId=state.bulkMemberId;
    state.missingPositionId="";
    state.missingYear="";
    state.missingSearch="";
    state.missingEventOrder="desc";
    state.oshiOnly=false;
    savePreferences();
    showPage("missing");
  }
  function addBulkMissingToWishlist(){
    const summary=bulkManageSummary();
    const member=MEMBERS.find(m=>m.id===state.bulkMemberId);
    const scopeLabel=member?`${member.emoji} ${member.name}`:"全メンバー";
    if(summary.addable===0){showActionToast(summary.missing?"未所持はすべて欲しい登録済みです":"未所持データはありません");return}
    if(!confirm(`${scopeLabel}の未所持 ${summary.missing}種類のうち、未登録の${summary.addable}種類を欲しいリストへ追加しますか？`))return;
    saveAutoBackup(`未所持の欲しい一括追加直前：${scopeLabel}`);
    let changed=0;
    bulkManageMembers().forEach(memberItem=>eligibleEventsForMember(memberItem).forEach(event=>POSITIONS.forEach(position=>{
      const key=k(event.id,memberItem.id,position.id);
      if(getCount(event.id,memberItem.id,position.id)===0&&!state.wants[key]){state.wants[key]=true;changed++}
    })));
    safeStorageWrite(WANT_KEY,(state.wants));
    showActionToast(`${changed}種類を欲しいリストへ追加しました`);
    renderBulkManage();
  }
  function renderBulkManage(){
    const summary=bulkManageSummary();
    const member=MEMBERS.find(m=>m.id===state.bulkMemberId);
    const scopeLabel=member?`${member.emoji} ${member.name}`:"全メンバー横断";
    $("bulkManagePage").innerHTML=`
      <div class="page-head"><h2>♡ 未所持・欲しい一括操作</h2><p>対象を選んで、未所持の確認や欲しい登録をまとめて行えます</p></div>
      <div class="panel backup-panel">
        <div class="backup-icon">👥</div>
        <h3>対象メンバー</h3>
        <p>全メンバー横断、または1人を選択してください。卒業メンバーは在籍期間の登録対象だけを集計します。</p>
        <select id="bulkManageMemberSelect" class="mode-event-select">${bulkManageMemberOptions()}</select>
      </div>
      <div class="backup-summary">
        <div><b>${summary.missing}</b><span>未所持</span></div>
        <div><b>${summary.alreadyWanted}</b><span>欲しい登録済み</span></div>
        <div><b>${summary.addable}</b><span>一括追加対象</span></div>
      </div>
      <div class="panel backup-panel">
        <div class="backup-icon">🔎</div>
        <h3>未所持を一括表示</h3>
        <p>${esc(scopeLabel)}の未所持を、イベント・ポジション別の一覧で表示します。</p>
        <button id="openBulkMissingListButton" class="secondary-action">未所持一覧を表示</button>
      </div>
      <div class="panel backup-panel">
        <div class="backup-icon">♡</div>
        <h3>未所持を欲しいへ一括追加</h3>
        <p>所持数が0の種類だけを追加します。すでに欲しい登録済みの項目は重複しません。実行前に自動バックアップを保存します。</p>
        <button id="addBulkMissingToWishlistButton" class="primary-action" ${summary.addable?"":"disabled"}>${summary.addable?`${summary.addable}種類を欲しいへ追加`:"追加対象はありません"}</button>
      </div>
      <div class="settings-page-bottom-space" aria-hidden="true"></div>`;
    $("bulkManageMemberSelect").onchange=e=>{state.bulkMemberId=e.target.value;savePreferences();renderBulkManage()};
    $("openBulkMissingListButton").onclick=openBulkMissingList;
    $("addBulkMissingToWishlistButton").onclick=addBulkMissingToWishlist;
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
      return `<div class="oshi-setting-card ${rank?`selected rank-${rank}`:""}" style="${memberCssVars(m)}">
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
        <div class="member-rate-bar"><i style="width:${s.rate}%"></i></div>
      </div>`;
    }).join("");
    const focus=selected.map(m=>{
      const s=memberOshiStats(m),rank=OSHI_RANKS[oshiRank(m.id)];
      return `<article class="oshi-focus-card ${s.rate===100?"complete-oshi":""}" style="${memberCssVars(m)}">
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
        <section class="panel guide-card"><span>4</span><div><h3>未所持・提供可能を確認する</h3><p>未所持一覧はメンバーの五十音順、各メンバー内はイベント順です。設定の「未所持・欲しい一括操作」から、未所持の一括表示や欲しいへの一括追加もできます。2枚目以降は提供可能として表示されます。</p></div></section>
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
          <p>所持枚数、直筆、欲しい、推し設定などは利用者のブラウザ内に保存され、アクセス解析へ送信されません。本公開版にはログインや広告はありません。サイトの利用状況を把握するためGoogle Analyticsを利用し、閲覧ページ、端末・ブラウザ情報などのアクセス情報がGoogleへ送信される場合があります。</p>
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
        <h3>公開版Ver1.02.01</h3>
        <p>未所持一覧の検索欄を、入力中に作り直さない方式へ変更しました。複数文字や日本語を連続して入力できます。</p>
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
      wants:Object.keys(state.wants).length,
      images:memberImageRecords.size
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
  async function dataUrlToBlob(dataUrl){
    const text=String(dataUrl||"");
    const match=text.match(/^data:(image\/(?:jpeg|png|webp));base64,/);
    if(!match)throw new Error("対応していない画像形式です");
    const binary=atob(text.slice(match[0].length));
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:match[1]});
  }
  const MAX_IMAGE_BACKUP_BYTES=12*1024*1024;
  async function collectImageBackup(){
    const images=[];
    let bytes=0;
    for(const record of memberImageRecords.values()){
      if(!record?.blob)continue;
      bytes+=record.blob.size;
      if(bytes>MAX_IMAGE_BACKUP_BYTES)return {images:[],skipped:true};
      images.push({
        memberId:record.memberId,
        positionX:record.positionX,
        positionY:record.positionY,
        zoom:record.zoom,
        updatedAt:record.updatedAt,
        dataUrl:await blobToDataUrl(record.blob)
      });
    }
    return {images,skipped:false};
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
  async function exportBackup(){
    const payload=buildBackupPayload("manual");
    try{
      const result=await collectImageBackup();
      if(result.skipped)showActionToast("画像が大きいため、画像を除いて書き出します");
      else if(result.images.length)payload.data.images=result.images;
    }catch(error){
      console.warn("画像の書き出しに失敗しました",error);
      showActionToast("画像を書き出せませんでした。他のデータのみ保存します");
    }
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
    safeStorageWrite(HISTORY_KEY,(history.slice(0,max)));
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
    safeStorageWrite(COUNT_KEY,(counts.data));
    safeStorageWrite(SIGN_KEY,(signs.data));
    safeStorageWrite(WANT_KEY,(wants.data));
    safeStorageWrite(OSHI_KEY,(backup.oshis||{}));
    safeStorageWrite(PREF_KEY,(backup.preferences||{}));
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
      alert(`復元しました。${migrated?`旧event_idを${migrated}件移行しました。`:""}メンバー画像はこの履歴には含まれません。画面を再読み込みします。`);
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
      images:sanitizeBackupImages(payload.data.images),
      sourceVersion:cleanShortText(payload.sourceVersion),
      schemaVersion,
      dataVersion:cleanShortText(payload.dataVersion)
    };
  }
  function sanitizeBackupImages(value){
    if(!Array.isArray(value))return [];
    const seen=new Set();
    const list=[];
    for(const item of value.slice(0,MEMBERS.length)){
      if(!validObject(item))continue;
      const memberId=String(item.memberId||"");
      if(!MEMBERS.some(member=>member.id===memberId)||seen.has(memberId))continue;
      const dataUrl=String(item.dataUrl||"");
      if(!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl))continue;
      if(dataUrl.length>MAX_IMAGE_BACKUP_BYTES)continue;
      seen.add(memberId);
      list.push({
        memberId,
        positionX:imageNumber(item.positionX,50,0,100),
        positionY:imageNumber(item.positionY,50,0,100),
        zoom:imageNumber(item.zoom,1,1,2.4),
        updatedAt:validDateString(item.updatedAt)?item.updatedAt:new Date().toISOString(),
        dataUrl
      });
    }
    return list;
  }
  async function applyBackupImages(images){
    if(!Array.isArray(images)||!images.length)return 0;
    let restored=0;
    for(const item of images){
      try{
        const blob=await dataUrlToBlob(item.dataUrl);
        const record=normalizeMemberImageRecord({
          memberId:item.memberId,
          blob,
          dataUrl:item.dataUrl,
          positionX:item.positionX,
          positionY:item.positionY,
          zoom:item.zoom,
          updatedAt:item.updatedAt
        });
        await imageDbRequest("readwrite",store=>store.put(record));
        restored++;
      }catch(error){
        console.warn("画像を復元できませんでした",item.memberId,error);
      }
    }
    return restored;
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
    const imageCount=(pendingBackup.images||[]).length;
    const detail=imageCount?`${summary}\nメンバー画像 ${imageCount}件`:summary;
    if(!confirm(`現在のデータを上書きします。\n\n${detail}\n\n復元しますか？`))return;
    saveAutoBackup("ファイル復元の直前");
    const migrated=applyBackupData(pendingBackup);
    const finish=restoredImages=>{
      const notes=[];
      if(migrated)notes.push(`旧event_idを${migrated}件移行しました。`);
      if(restoredImages)notes.push(`メンバー画像を${restoredImages}件復元しました。`);
      alert(`復元が完了しました。${notes.join("")}画面を再読み込みします。`);
      location.reload();
    };
    if(!imageCount){finish(0);return}
    applyBackupImages(pendingBackup.images).then(finish).catch(error=>{
      console.warn("画像の復元に失敗しました",error);
      finish(0);
    });
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
        <div><b>${s.images}</b><span>メンバー画像</span></div>
      </div>
      <div class="panel backup-panel">
        <div class="backup-icon">📤</div>
        <h3>バックアップを保存</h3>
        <p>所持枚数・直筆・欲しい・推し・フィルター設定に加え、端末内のメンバー画像も1つのJSONファイルに保存します。画像の合計が12MBを超える場合は、画像を除いて保存します。</p>
        <button id="exportBackupButton" class="primary-action">バックアップファイルを保存</button>
      </div>
      <div class="panel backup-panel">
        <div class="backup-icon">📥</div>
        <h3>バックアップから復元</h3>
        <p>選択したファイルを自動検査し、作成日時と件数を表示してから復元します。画像を含むファイルなら、メンバー画像も一緒に戻します。</p>
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
    b.className=`member-card pattern-a${isGraduated(m)?" graduated":""}${rank?` oshi-card rank-${rank}`:""}${hasImage?" has-custom-image":""}${m.soft3?" triple-member-color":m.soft2?" dual-member-color":" single-member-color"}`;
    b.style.background=memberBackground(m);
    b.style.setProperty("--card-accent",m.accent);
    b.style.setProperty("--card-accent-2",memberAccent2(m));
    b.style.setProperty("--card-accent-3",memberAccent3(m));
    b.style.setProperty("--card-soft",m.soft);
    b.style.setProperty("--card-soft-2",memberSoft2(m));
    b.style.setProperty("--card-soft-3",memberSoft3(m));
    applyMemberVars(b,m);
    b.style.borderColor=`color-mix(in srgb,${m.accent} 48%,white)`;
    const memberStats=statsFor([m]);
    b.innerHTML=`${memberCardPhotoMarkup(m)}<div class="member-card-info-panel"><span class="name"><span class="name-emoji" aria-hidden="true">${m.emoji}</span><span>${esc(m.name)}</span></span><span class="member-card-meta"><span>所持 ${memberTotal(m.id)}枚</span><i></i><span>コンプ率 ${memberStats.rate}%</span></span></div>`;
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
  let searchRenderTimer=0;
  $("searchInput").oninput=e=>{
    state.search=e.target.value;
    savePreferences();
    clearTimeout(searchRenderTimer);
    searchRenderTimer=setTimeout(renderCollection,120);
  };
  $("openCollectionFilterButton").onclick=()=>openFilterSheet("collection");
  $("openCollectionSortButton").onclick=()=>openSortSheet("collection");
  $("resetCollectionViewButton").onclick=()=>resetCollectionView({render:true,scrollTop:true,smooth:true});
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

  const keepFocusedControlVisible=event=>{
    const target=event.target;
    if(!(target instanceof HTMLElement)||!target.matches("input,select,textarea,[contenteditable='true']"))return;
    window.setTimeout(()=>{
      if(!document.contains(target))return;
      const viewportHeight=window.visualViewport?.height||window.innerHeight;
      const rect=target.getBoundingClientRect();
      const topLimit=96;
      const bottomLimit=viewportHeight-92;
      if(rect.top<topLimit||rect.bottom>bottomLimit){
        target.scrollIntoView({block:"center",inline:"nearest",behavior:"smooth"});
      }
    },260);
  };
  document.addEventListener("focusin",keepFocusedControlVisible);
  window.visualViewport?.addEventListener("resize",()=>{
    const target=document.activeElement;
    if(target instanceof HTMLElement&&target.matches("input,select,textarea,[contenteditable='true']")){
      window.setTimeout(()=>target.scrollIntoView({block:"center",inline:"nearest",behavior:"smooth"}),100);
    }
  });

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
