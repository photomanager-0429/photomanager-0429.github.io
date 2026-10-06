(() => {
  "use strict";
  const updateBanner = document.getElementById("updateBanner");
  const updateButton = document.getElementById("applyUpdateButton");
  const offlineBanner = document.getElementById("offlineBanner");

  const updateOnlineStatus = () => {
    if (offlineBanner) offlineBanner.classList.toggle("hidden", navigator.onLine);
  };
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  window.addEventListener("securitypolicyviolation", event => {
    console.warn("CSP blocked a resource", event.violatedDirective, event.blockedURI);
  });

  if (!("serviceWorker" in navigator)) return;

  // Ver1.01.04：初めて開いた時はまだ切り替える旧版が無いので、再読み込みしない。
  // （以前は初回アクセスの直後に必ず1回、画面が勝手に読み込み直されていた）
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing || !hadController) return;
    refreshing = true;
    location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js?v=1.01.06", {scope: "./"});
      if (!registration) return;
      const showUpdate = worker => {
        if (!worker || !updateBanner || !updateButton) return;
        updateBanner.classList.remove("hidden");
        updateButton.onclick = () => worker.postMessage({type: "SKIP_WAITING"});
      };
      if (registration.waiting) showUpdate(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });
      registration.update();
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
})();
