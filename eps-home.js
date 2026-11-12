// Bouton « Accueil » partagé par les applications EPS : ramène à la page d'accueil commune (/).
// Petit, en bas à gauche, et déplaçable par appui long si jamais il gêne.
(function () {
  if (window.__epsHome || location.pathname === "/" || location.pathname === "/index.html") return;
  window.__epsHome = true;
  function add() {
    var b = document.createElement("a");
    b.href = "/";
    b.setAttribute("aria-label", "Accueil : toutes les applications EPS");
    b.title = "Toutes les applications EPS";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>';
    var s = b.style;
    s.position = "fixed"; s.zIndex = "2147483000";
    s.left = "calc(10px + env(safe-area-inset-left, 0px))"; s.bottom = "calc(10px + env(safe-area-inset-bottom, 0px))";
    s.width = "46px"; s.height = "46px"; s.borderRadius = "50%";
    s.display = "grid"; s.placeItems = "center";
    s.background = "rgba(27,30,36,.78)"; s.color = "#fff";
    s.boxShadow = "0 2px 8px rgba(0,0,0,.25)"; s.textDecoration = "none";
    s.webkitTapHighlightColor = "transparent"; s.touchAction = "none";
    // position mémorisée (déplacement par appui long)
    try { var p = JSON.parse(localStorage.getItem("eps.homeBtn") || "null"); if (p) { s.left = p.x + "px"; s.top = p.y + "px"; s.bottom = "auto"; } } catch (e) {}
    var t = null, drag = false, ox = 0, oy = 0;
    b.addEventListener("pointerdown", function (e) {
      drag = false; ox = e.clientX - b.offsetLeft; oy = e.clientY - b.offsetTop;
      t = setTimeout(function () { drag = true; s.background = "rgba(217,72,31,.9)"; try { b.setPointerCapture(e.pointerId); } catch (x) {} }, 500);
    });
    b.addEventListener("pointermove", function (e) {
      if (!drag) return; e.preventDefault();
      var x = Math.max(4, Math.min(innerWidth - 50, e.clientX - ox)), y = Math.max(4, Math.min(innerHeight - 50, e.clientY - oy));
      s.left = x + "px"; s.top = y + "px"; s.bottom = "auto";
    });
    function end() {
      clearTimeout(t);
      if (drag) { s.background = "rgba(27,30,36,.78)"; try { localStorage.setItem("eps.homeBtn", JSON.stringify({ x: b.offsetLeft, y: b.offsetTop })); } catch (e) {} }
    }
    b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end);
    b.addEventListener("click", function (e) { if (drag) { e.preventDefault(); drag = false; } });
    document.body.appendChild(b);
  }
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
})();
