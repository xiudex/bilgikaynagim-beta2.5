/* GitHub Pages: /repo-name without a trailing slash makes relative
   css/js resolve at the domain root and 404. Also fixes custom 404.html. */
(function () {
  var p = location.pathname || "/";
  if (p.length > 1 && !p.endsWith("/") && !/\.[a-z0-9]+$/i.test(p)) {
    location.replace(p + "/" + location.search + location.hash);
    return;
  }
  if (!/\.github\.io$/i.test(location.hostname)) return;
  var parts = p.split("/").filter(Boolean);
  if (!parts.length) return;
  var known = { "index.html": 1, "app.html": 1, "404.html": 1 };
  var extra = parts.slice(1).filter(function (s) { return !known[s]; });
  if (extra.length && !document.querySelector("base")) {
    var b = document.createElement("base");
    b.href = location.origin + "/" + parts[0] + "/";
    document.head.insertBefore(b, document.head.firstChild);
  }
})();
