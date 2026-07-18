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

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js?v=1.00.8", {scope: "./"});
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
