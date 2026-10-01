/* ═══════════════════════════════════════
   auth.js — Basit giriş kontrolü (GEÇİCİ)
   GitHub Pages alt klasöründe relative path kullanır.
   ═══════════════════════════════════════ */
(function () {
  var auth = null;
  try { auth = JSON.parse(localStorage.getItem("bk_auth")); } catch (e) {}
  if (!auth || !auth.email) {
    try {
      window.location.replace(new URL("index.html", window.location.href).href);
    } catch (e2) {
      window.location.replace("index.html");
    }
  }
})();
