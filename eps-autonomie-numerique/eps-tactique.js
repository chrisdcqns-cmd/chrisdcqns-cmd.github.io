/* EPS · Planche tactique (commun) : dessin des terrains, des joueurs et des flèches.
   EPSTAC.svg(planche)            → image SVG (texte) d'une planche, pour l'afficher sur les tablettes des élèves
   EPSTAC.editor(élément, planche, {onChange, onSelect}) → éditeur tactile
   Planche : {sport, items:[{t:'p', e:0|1, n:'1', x, y} joueur · {t:'b', x, y} ballon · {t:'c', x, y} plot ·
              {t:'a', k:'m'|'p', p:[x1,y1,x2,y2]} flèche (m = déplacement, p = passe / trajectoire) ·
              {t:'f', p:[x,y,…]} tracé libre · {t:'x', x, y, s} texte]}
   Unités : celles du terrain (voir T), marge M autour pour placer un serveur ou un remplaçant. */
(function () {
  "use strict";
  if (window.EPSTAC) return;
  var M = 14, INK = "#14171C", CA = "#1F4FA3", CB = "#D9481F", BAL = "#F0A030";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function L(x1, y1, x2, y2, x) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (x || "") + "/>"; }
  function R(x, y, w, h, x2) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (x2 || "") + "/>"; }
  var DASH = ' stroke-dasharray="3 2.4"';
  /* raquette, arc et panier d'un côté du terrain de basket (s = 0 à gauche, 1 à droite) */
  function BK(s) { var a = s ? 280 : 0, b = s ? 222 : 58, f = s ? 0 : 1, p = s ? 264 : 16;
    return R(Math.min(a, b), 50.5, 58, 49) + '<path d="M' + b + ",57 A18,18 0 0 " + f + " " + b + ',93"/>' + '<path d="M' + a + ",9 L" + (s ? 250 : 30) + ",9 A67.5,67.5 0 0 " + f + " " + (s ? 250 : 30) + ",141 L" + a + ',141"/>' + '<circle cx="' + p + '" cy="75" r="2.6"/>' + L(s ? 268 : 12, 66, s ? 268 : 12, 84, ' stroke-width="1.2"'); }
  /* Terrains : w × h (hors marge), fond, lignes (origine au coin du terrain) */
  var T = {
    volley: { nom: "Volley-ball", w: 180, h: 90, bg: "#F6E3C9", d: function () { return R(0, 0, 180, 90) + L(60, 0, 60, 90) + L(120, 0, 120, 90) + L(90, -6, 90, 96, ' stroke-width="1.4"'); } },
    badminton: { nom: "Badminton", w: 134, h: 61, bg: "#DDEFE6", d: function () { return R(0, 0, 134, 61) + L(0, 4.6, 134, 4.6) + L(0, 56.4, 134, 56.4) + L(7.6, 0, 7.6, 61) + L(126.4, 0, 126.4, 61) + L(47.2, 0, 47.2, 61) + L(86.8, 0, 86.8, 61) + L(0, 30.5, 47.2, 30.5) + L(86.8, 30.5, 134, 30.5) + L(67, -4, 67, 65, ' stroke-width="1.2"'); } },
    handball: { nom: "Handball", w: 200, h: 100, bg: "#DCE8F5", d: function () { var z = function (s, r, x) { var a = s ? 200 : 0, f = s ? 0 : 1, b = s ? 200 - r : r; return '<path d="M' + a + "," + (42.5 - r) + " A" + r + "," + r + " 0 0 " + f + " " + b + ",42.5 L" + b + ",57.5 A" + r + "," + r + " 0 0 " + f + " " + a + "," + (57.5 + r) + '"' + (x || "") + "/>"; };
      return R(0, 0, 200, 100) + L(100, 0, 100, 100) + z(0, 30) + z(1, 30) + z(0, 45, DASH) + z(1, 45, DASH) + L(-3, 42.5, -3, 57.5, ' stroke-width="1.4"') + L(203, 42.5, 203, 57.5, ' stroke-width="1.4"'); } },
    basket: { nom: "Basket-ball", w: 280, h: 150, bg: "#F3DDC2", d: function () { return R(0, 0, 280, 150) + L(140, 0, 140, 150) + '<circle cx="140" cy="75" r="18"/>' + BK(0) + BK(1); } },
    /* demi-terrain de basket (3 contre 3) : le panier est à gauche, mêmes mesures que la moitié gauche du terrain entier */
    basket3: { nom: "Basket 3 contre 3 (demi-terrain)", w: 140, h: 150, bg: "#F3DDC2", d: function () { return R(0, 0, 140, 150) + '<path d="M140,57 A18,18 0 0 0 140,93"/>' + BK(0); } },
    foot: { nom: "Football", w: 210, h: 136, bg: "#DCEBD3", d: function () { return R(0, 0, 210, 136) + L(105, 0, 105, 136) + '<circle cx="105" cy="68" r="18.3"/>' + R(0, 27.7, 33, 80.6) + R(177, 27.7, 33, 80.6) + R(0, 49.7, 11, 36.6) + R(199, 49.7, 11, 36.6) + L(-3, 60.7, -3, 75.3, ' stroke-width="1.4"') + L(213, 60.7, 213, 75.3, ' stroke-width="1.4"'); } },
    rugby: { nom: "Rugby", w: 200, h: 140, bg: "#DCEBD3", d: function () { return R(0, 0, 200, 140) + L(100, 0, 100, 140) + L(44, 0, 44, 140) + L(156, 0, 156, 140) + L(80, 0, 80, 140, DASH) + L(120, 0, 120, 140, DASH) + L(10, 0, 10, 140, DASH) + L(190, 0, 190, 140, DASH); } },
    ultimate: { nom: "Ultimate", w: 200, h: 74, bg: "#DCEBD3", d: function () { return R(0, 0, 200, 74) + L(36, 0, 36, 74) + L(164, 0, 164, 74); } },
    demi: { nom: "Demi-terrain", w: 120, h: 100, bg: "#EFEBE0", d: function () { return R(0, 0, 120, 100); } },
    vierge: { nom: "Page blanche", w: 160, h: 100, bg: "#FFFFFF", d: function () { return ""; } }
  };
  var ORDRE = ["volley", "badminton", "handball", "basket", "basket3", "foot", "rugby", "ultimate", "demi", "vierge"];
  var uid = 0;
  function terr(s) { return T[s] || T.vierge; }
  function rad(t) { return Math.max(t.w, t.h) / 30; }
  function clean(d) { d = (d && typeof d === "object") ? d : {}; return { sport: T[d.sport] ? d.sport : "vierge", forme: typeof d.forme === "string" ? d.forme.slice(0, 40) : "", items: Array.isArray(d.items) ? d.items.filter(function (i) { return i && typeof i === "object" && typeof i.t === "string"; }) : [] }; }
  function num(v) { return (typeof v === "number" && isFinite(v)) ? Math.round(v * 10) / 10 : 0; }
  function item(i, r, id, sel) {
    var h = "", hl = sel ? ' filter="url(#h' + id + ')"' : "";
    if (i.t === "p") { var s = String(i.n == null ? "" : i.n).slice(0, 3);
      h = '<g' + hl + '><circle cx="' + num(i.x) + '" cy="' + num(i.y) + '" r="' + r + '" fill="' + (i.e ? CB : CA) + '" stroke="#fff" stroke-width="' + (r * .16) + '"/><text x="' + num(i.x) + '" y="' + num(i.y) + '" text-anchor="middle" dominant-baseline="central" font-size="' + (r * (s.length > 2 ? .85 : 1.1)) + '" font-weight="800" fill="#fff" stroke="none">' + esc(s) + "</text></g>"; }
    else if (i.t === "b") h = '<circle' + hl + ' cx="' + num(i.x) + '" cy="' + num(i.y) + '" r="' + (r * .55) + '" fill="' + BAL + '" stroke="' + INK + '" stroke-width="' + (r * .14) + '"/>';
    else if (i.t === "c") { var x = num(i.x), y = num(i.y), a = r * .7; h = '<path' + hl + ' d="M' + x + "," + (y - a) + " L" + (x + a) + "," + (y + a * .8) + " L" + (x - a) + "," + (y + a * .8) + ' Z" fill="#E8701A" stroke="' + INK + '" stroke-width="' + (r * .12) + '"/>'; }
    else if (i.t === "a" && Array.isArray(i.p) && i.p.length >= 4) h = '<line' + hl + ' x1="' + num(i.p[0]) + '" y1="' + num(i.p[1]) + '" x2="' + num(i.p[2]) + '" y2="' + num(i.p[3]) + '" stroke="' + (i.k === "p" ? "#B45309" : INK) + '" stroke-width="' + (r * .3) + '" stroke-linecap="round"' + (i.k === "p" ? ' stroke-dasharray="' + (r * .7) + " " + (r * .6) + '"' : "") + ' marker-end="url(#' + (i.k === "p" ? "q" : "m") + id + ')"/>';
    else if (i.t === "f" && Array.isArray(i.p) && i.p.length >= 4) { var pts = []; for (var k = 0; k + 1 < i.p.length; k += 2) pts.push(num(i.p[k]) + "," + num(i.p[k + 1])); h = '<polyline' + hl + ' points="' + pts.join(" ") + '" fill="none" stroke="' + INK + '" stroke-width="' + (r * .3) + '" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#m' + id + ')"/>'; }
    else if (i.t === "x") h = '<text' + hl + ' x="' + num(i.x) + '" y="' + num(i.y) + '" text-anchor="middle" dominant-baseline="central" font-size="' + (r * .8) + '" font-weight="800" fill="' + INK + '" stroke="#fff" stroke-width="' + (r * .16) + '" paint-order="stroke">' + esc(String(i.s || "").slice(0, 60)) + "</text>";
    return h;
  }
  function svg(d, o) {
    d = clean(d); o = o || {}; var t = terr(d.sport), r = rad(t), id = ++uid, W = t.w + 2 * M, H = t.h + 2 * M;
    var mk = function (n, c) { return '<marker id="' + n + id + '" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + c + '"/></marker>'; };
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (-M) + " " + (-M) + " " + W + " " + H + '" style="display:block;width:100%;height:auto;max-height:' + (o.maxh || "100%") + ';font-family:system-ui,sans-serif" role="img" aria-label="Planche tactique ' + esc(t.nom) + '">' +
      "<defs>" + mk("m", INK) + mk("q", "#B45309") + '<filter id="h' + id + '" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="' + (r * .35) + '" flood-color="#F0A030" flood-opacity="1"/><feDropShadow dx="0" dy="0" stdDeviation="' + (r * .2) + '" flood-color="#F0A030" flood-opacity="1"/></filter></defs>' +
      R(-M, -M, W, H, ' fill="#fff"') + (d.sport === "vierge" ? "" : R(0, 0, t.w, t.h, ' fill="' + t.bg + '"')) +
      '<g fill="none" stroke="' + INK + '" stroke-width=".6">' + t.d() + "</g>" +
      d.items.map(function (i, k) { return item(i, r, id, o.sel === k); }).join("") + (o.extra || "") + "</svg>";
  }
  function segDist(px, py, a, b, c, e) { var dx = c - a, dy = e - b, l = dx * dx + dy * dy, u = l ? Math.max(0, Math.min(1, ((px - a) * dx + (py - b) * dy) / l)) : 0; return Math.hypot(px - a - u * dx, py - b - u * dy); }
  function editor(el, d0, opt) {
    opt = opt || {}; var d = clean(JSON.parse(JSON.stringify(d0 || {}))), tool = "sel", sel = -1, undo = [], drag = null, tmp = null;
    el.style.touchAction = "none"; el.style.userSelect = "none"; el.style.webkitUserSelect = "none";
    function t() { return terr(d.sport); }
    function draw() { var r = rad(t()), ex = "";
      if (tmp && tmp.t === "a") ex = item(tmp, r, uid + 1, false); else if (tmp && tmp.t === "f" && tmp.p.length >= 4) ex = item(tmp, r, uid + 1, false);
      el.innerHTML = svg(d, { sel: sel, extra: ex, maxh: opt.maxh }); }
    function snap() { undo.push(JSON.stringify(d)); if (undo.length > 60) undo.shift(); }
    function changed() { draw(); if (opt.onChange) try { opt.onChange(d); } catch (e) {} }
    function selSet(k) { sel = k; if (opt.onSelect) try { opt.onSelect(k >= 0 ? d.items[k] : null); } catch (e) {} }
    function pos(ev) { var s = el.querySelector("svg"), x, y, m = s.getScreenCTM && s.getScreenCTM();
      if (m && s.createSVGPoint) { var q = s.createSVGPoint(); q.x = ev.clientX; q.y = ev.clientY; q = q.matrixTransform(m.inverse()); x = q.x; y = q.y; }
      else { var b = s.getBoundingClientRect(), W = t().w + 2 * M, H = t().h + 2 * M; x = (ev.clientX - b.left) / b.width * W - M; y = (ev.clientY - b.top) / b.height * H - M; }
      return { x: Math.max(-M + 2, Math.min(t().w + M - 2, x)), y: Math.max(-M + 2, Math.min(t().h + M - 2, y)) }; }
    function hit(p) { var r = rad(t()); for (var k = d.items.length - 1; k >= 0; k--) { var i = d.items[k], q;
        if (i.t === "p" || i.t === "b" || i.t === "c" || i.t === "x") { if (Math.hypot(p.x - i.x, p.y - i.y) < r * (i.t === "x" ? 2.2 : 1.5)) return k; }
        else if (Array.isArray(i.p)) for (q = 0; q + 3 < i.p.length; q += 2) if (segDist(p.x, p.y, i.p[q], i.p[q + 1], i.p[q + 2], i.p[q + 3]) < r * .9) return k; }
      return -1; }
    function nextNum(e) { var m = 0; d.items.forEach(function (i) { if (i.t === "p" && (i.e ? 1 : 0) === e && /^\d+$/.test(String(i.n))) m = Math.max(m, +i.n); }); return String(m + 1); }
    function down(ev) { if (ev.button) return; ev.preventDefault(); try { el.setPointerCapture(ev.pointerId); } catch (e) {} var p = pos(ev);
      if (tool === "sel") { var k = hit(p); selSet(k); drag = k >= 0 ? { p: p, moved: false, s: JSON.stringify(d) } : null; draw(); }
      else if (tool === "pa" || tool === "pb" || tool === "b" || tool === "c") { snap(); var it = tool === "b" ? { t: "b" } : tool === "c" ? { t: "c" } : { t: "p", e: tool === "pb" ? 1 : 0, n: nextNum(tool === "pb" ? 1 : 0) }; it.x = p.x; it.y = p.y; d.items.push(it); selSet(d.items.length - 1); drag = { p: p, moved: true, s: null }; changed(); }
      else if (tool === "am" || tool === "ap") { tmp = { t: "a", k: tool === "ap" ? "p" : "m", p: [p.x, p.y, p.x, p.y] }; selSet(-1); draw(); }
      else if (tool === "f") { tmp = { t: "f", p: [p.x, p.y] }; selSet(-1); draw(); }
      else if (tool === "x") { selSet(-1); if (opt.askText) opt.askText(function (s) { s = String(s || "").trim(); if (!s) return; snap(); d.items.push({ t: "x", x: p.x, y: p.y, s: s.slice(0, 60) }); selSet(d.items.length - 1); changed(); }); }
    }
    function move(ev) { if (!drag && !tmp) return; ev.preventDefault(); var p = pos(ev);
      if (tmp && tmp.t === "a") { tmp.p[2] = p.x; tmp.p[3] = p.y; draw(); }
      else if (tmp && tmp.t === "f") { var n = tmp.p.length; if (Math.hypot(p.x - tmp.p[n - 2], p.y - tmp.p[n - 1]) > rad(t()) * .35 && n < 600) { tmp.p.push(p.x, p.y); draw(); } }
      else if (drag && sel >= 0 && d.items[sel]) { var i = d.items[sel], dx = p.x - drag.p.x, dy = p.y - drag.p.y; if (!drag.moved && Math.hypot(dx, dy) < .8) return;
        if (!drag.moved) { drag.moved = true; if (drag.s) { undo.push(drag.s); drag.s = null; } }
        if (Array.isArray(i.p)) for (var q = 0; q + 1 < i.p.length; q += 2) { i.p[q] += dx; i.p[q + 1] += dy; } else { i.x += dx; i.y += dy; }
        drag.p = p; draw(); } }
    function up() { if (tmp) { var r = rad(t()), ok = tmp.t === "a" ? Math.hypot(tmp.p[2] - tmp.p[0], tmp.p[3] - tmp.p[1]) > r : tmp.p.length >= 6; if (ok) { snap(); d.items.push(tmp); } tmp = null; changed(); }
      else if (drag && drag.moved) changed(); drag = null; }
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", function () { tmp = null; drag = null; draw(); });
    draw();
    return {
      get: function () { return JSON.parse(JSON.stringify(d)); },
      set: function (x) { d = clean(JSON.parse(JSON.stringify(x || {}))); undo = []; selSet(-1); draw(); },
      tool: function (x) { tool = x; if (x !== "sel") selSet(-1); draw(); },
      sport: function (s) { if (!T[s] || s === d.sport) return; snap(); var a = t(), b = T[s]; d.items.forEach(function (i) { var fx = b.w / a.w, fy = b.h / a.h; if (Array.isArray(i.p)) for (var q = 0; q + 1 < i.p.length; q += 2) { i.p[q] *= fx; i.p[q + 1] *= fy; } else { i.x *= fx; i.y *= fy; } }); d.sport = s; d.forme = ""; changed(); },
      undo: function () { if (!undo.length) return; d = clean(JSON.parse(undo.pop())); selSet(-1); changed(); },
      clear: function () { if (!d.items.length) return; snap(); d.items = []; selSet(-1); changed(); },
      del: function () { if (sel < 0) return; snap(); d.items.splice(sel, 1); selSet(-1); changed(); },
      label: function (s) { var i = d.items[sel]; if (!i) return; snap(); if (i.t === "p") i.n = String(s).slice(0, 3); else if (i.t === "x") i.s = String(s).slice(0, 60); changed(); },
      selected: function () { return sel >= 0 ? d.items[sel] : null; },
      count: function () { return d.items.length; }
    };
  }
  /* 🎯 Caractéristiques de chaque activité (demande de l'enseignant, 28/11/2026 : « quand on change d'activité, on retrouve les caractéristiques de l'activité ») :
     formes de jeu pratiquées au lycée (jamais de 6 contre 6 en volley : 4 contre 4, 3 contre 3, 2 contre 2 ; badminton : simple ou double ; basket : 4 contre 4
     ou 3 contre 3), mots de l'activité à poser sur la planche (frappes du badminton, « course, passe, tir, centre » du football…), nom de l'objet (ballon, volant,
     disque) et du trait pointillé (passe, frappe). Tout est réglable : paramètres tac_formes_<sport> et tac_mots_<sport> (section « Planche tactique »),
     une ligne par forme (« 4 contre 4 » : le premier nombre = joueurs par équipe ; « Simple », « Double ») ou par mot. La première forme est celle proposée. */
  var CAR = {
    volley: { f: ["4 contre 4", "3 contre 3", "2 contre 2"], m: ["Service", "Réception", "Passe", "Attaque", "Smash", "Contre", "Défense", "Manchette", "Soutien"], obj: "Ballon", tr: "Passe" },
    badminton: { f: ["Simple", "Double"], m: ["Service court", "Service long", "Dégagé", "Amorti", "Contre-amorti", "Smash", "Lob", "Drive", "Kill", "Replacement"], obj: "Volant", tr: "Frappe" },
    handball: { f: ["5 contre 5", "4 contre 4", "7 contre 7"], m: ["Passe", "Tir", "Dribble", "Débordement", "Appui", "Repli", "Montée de balle", "Gardien"], obj: "Ballon", tr: "Passe" },
    basket: { f: ["4 contre 4", "3 contre 3"], m: ["Dribble", "Passe", "Tir", "Écran", "Rebond", "Démarquage", "Passe et va", "Contre-attaque", "Repli"], obj: "Ballon", tr: "Passe" },
    basket3: { f: ["3 contre 3"], m: ["Dribble", "Passe", "Tir", "Écran", "Rebond", "Démarquage", "Passe et va", "Sortie de zone"], obj: "Ballon", tr: "Passe" },
    foot: { f: ["5 contre 5", "4 contre 4", "7 contre 7"], m: ["Course", "Passe", "Tir", "Centre", "Dribble", "Appel", "Contrôle", "Pressing", "Gardien"], obj: "Ballon", tr: "Passe" },
    rugby: { f: ["5 contre 5", "7 contre 7"], m: ["Course", "Passe", "Soutien", "Plaquage", "Essai", "Regroupement", "Ligne d'avantage", "Coup de pied"], obj: "Ballon", tr: "Passe" },
    ultimate: { f: ["5 contre 5", "4 contre 4"], m: ["Passe", "Appel", "Démarquage", "Pivot", "Marque", "Interception", "Zone d'en-but"], obj: "Disque", tr: "Passe" },
    demi: { f: ["3 contre 3", "2 contre 2", "4 contre 4"], m: ["Course", "Passe", "Tir", "Appel"], obj: "Ballon", tr: "Passe" },
    vierge: { f: [], m: [], obj: "Ballon", tr: "Passe" } };
  function car(s) { var c = CAR[s] || CAR.vierge, f = c.f.slice(), m = c.m.slice();
    try { if (window.EPSP && EPSP.p && T[s] && s !== "vierge") {
      var nom = T[s].nom, pf = EPSP.p({ id: "tac_formes_" + s, sec: "Planche tactique", label: nom + " : formes de jeu (la première est proposée)", type: "list", def: c.f, aide: "Une par ligne : « 4 contre 4 » (le premier nombre = joueurs par équipe), « Simple », « Double »." }),
        pm = EPSP.p({ id: "tac_mots_" + s, sec: "Planche tactique", label: nom + " : mots à poser sur la planche", type: "list", def: c.m });
      if (Array.isArray(pf) && pf.length) f = pf.map(String); if (Array.isArray(pm)) m = pm.map(String); } } catch (e) {}
    return { formes: f, mots: m, objet: c.obj, trait: c.tr }; }
  function nbDe(forme) { var t = String(forme || ""), m = /(\d+)/.exec(t); if (m) return Math.max(1, Math.min(11, +m[1])); if (/double/i.test(t)) return 2; if (/simple/i.test(t)) return 1; return 0; }
  /* places de l'équipe de gauche (en part du terrain) pour n joueurs ; l'équipe de droite est en miroir */
  function places(s, n) {
    if (s === "volley") return ({ 1: [[.25, .5]], 2: [[.26, .3], [.26, .7]], 3: [[.38, .5], [.16, .25], [.16, .75]], 4: [[.4, .3], [.4, .7], [.16, .3], [.16, .7]], 6: [[.42, .2], [.42, .5], [.42, .8], [.14, .8], [.14, .5], [.14, .2]] })[n] || null;
    if (s === "badminton") return ({ 1: [[.25, .5]], 2: [[.32, .3], [.2, .7]] })[n] || null;
    return null; }
  /* Mise en place de départ proposée (modifiable) : celle de la forme de jeu demandée, sinon la première forme de l'activité */
  function depart(s, forme) { var t = terr(s), I = [], P = function (e, n, x, y) { I.push({ t: "p", e: e, n: String(n), x: x * t.w, y: y * t.h }); }, k;
    if (!T[s] || s === "vierge") return { sport: T[s] ? s : "vierge", items: I };
    var C = car(s), n = nbDe(forme || C.formes[0]) || 3, PL = places(s, n);
    if (s === "basket3") { /* attaque face au panier (à gauche), un défenseur sur chaque attaquant */
      var A3 = n === 3 ? [[.72, .5], [.36, .14], [.36, .86]] : null, D3 = n === 3 ? [[.6, .5], [.3, .26], [.3, .74]] : null;
      if (A3) { A3.forEach(function (p, i) { P(0, i + 1, p[0], p[1]); }); D3.forEach(function (p, i) { P(1, i + 1, p[0], p[1]); }); I.push({ t: "b", x: t.w * .77, y: t.h * .46 }); return { sport: s, forme: C.formes[0], items: I }; } }
    if (PL) PL.forEach(function (p, i) { P(0, i + 1, p[0], p[1]); P(1, i + 1, 1 - p[0], p[1]); });
    else for (k = 0; k < n; k++) { P(0, k + 1, n > 5 && k % 2 ? .2 : .3, (k + 1) / (n + 1)); P(1, k + 1, n > 5 && k % 2 ? .8 : .7, (k + 1) / (n + 1)); }
    I.push({ t: "b", x: t.w * (s === "volley" ? .28 : s === "badminton" ? .36 : .5), y: t.h * (s === "volley" ? .35 : .5) });
    return { sport: s, forme: forme || C.formes[0] || "", items: I }; }
  window.EPSTAC = { svg: svg, editor: editor, sports: function () { return ORDRE.map(function (k) { return { id: k, nom: T[k].nom }; }); }, depart: depart, clean: clean, car: car, nb: nbDe };
})();
