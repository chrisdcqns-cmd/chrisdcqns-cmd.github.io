/* Step : chorégraphie à revoir et à exporter (PDF ou vidéo), bloc par bloc ou en entier.
   Utilisé par step/index.html (tablette de l'élève, enseignant) et par mon-bilan/ (espace élève sur téléphone).
   EPSSTEP.open({titre, noms, classe, etab, prof, blocs:[{nom, bpm, sym, items:[{p, m}]}], pas:{id:{nom, n, c:[{L, R, t, j}]}}, dec, etats, base})
   EPSSTEP.pdf(données, sélection) → Promise<Blob> · EPSSTEP.video(données, sélection, onProgress) → Promise<{blob, ext}>
   sélection : -1 = toute la chorégraphie, sinon numéro du bloc. Rien n'est envoyé : les fichiers sont fabriqués sur l'appareil.
   Même schéma que l'appli : vu de dessus (100 × 80), pied gauche rouge (G), pied droit vert (D). Voir step/CLAUDE.md. */
(function () {
  "use strict";
  if (window.EPSSTEP) return;
  var SRC = (document.currentScript && document.currentScript.src) || "", BASE = SRC.replace(/step\/export\.js.*$/, "");
  var COL = "#A21CAF", G = "#D92D20", D = "#16A34A", INK = "#14171C";
  var DEP = { L: { x: 44, y: 60, a: 0, s: 0 }, R: { x: 56, y: 60, a: 0, s: 0 } };
  var SEM = "M0,-10 C4.6,-10 5.6,-4 4.6,1 C4.1,5 4.6,8 3,10 C1.5,11 -1.5,11 -3,10 C-4.6,8 -4.1,5 -4.6,1 C-5.6,-4 -4.6,-10 0,-10Z";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function bn(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function okF(f) { if (!f || typeof f !== "object" || !isFinite(+f.x) || !isFinite(+f.y)) return null; return { x: bn(+f.x, 3, 97), y: bn(+f.y, 4, 76), a: isFinite(+f.a) ? ((Math.round(+f.a) % 360) + 360) % 360 : 0, s: [0, 1, 2, 3, 4].indexOf(+f.s) >= 0 ? +f.s : 0 }; }
  /* données relues : toujours vérifier la forme */
  function norm(d) {
    d = d && typeof d === "object" ? d : {}; var P = {}, src = d.pas && typeof d.pas === "object" ? d.pas : {};
    Object.keys(src).forEach(function (id) { var p = src[id]; if (!p || typeof p !== "object") return; var n = bn(Math.round(+p.n) || 8, 1, 32), c = Array.isArray(p.c) ? p.c : [], C = [];
      for (var i = 0; i < n; i++) { var t = c[i] && typeof c[i] === "object" ? c[i] : {}, o = {}, L = okF(t.L), R = okF(t.R); if (L) o.L = L; if (R) o.R = R; if (t.t) o.t = String(t.t).slice(0, 24); if (t.j) o.j = 1; C.push(o); }
      P[id] = { id: id, nom: String(p.nom || "Pas").slice(0, 40), n: n, c: C }; });
    var B = (Array.isArray(d.blocs) ? d.blocs : []).map(function (b) { b = b && typeof b === "object" ? b : {}; return { nom: String(b.nom || "Bloc").slice(0, 30), bpm: bn(Math.round(+b.bpm) || 120, 30, 300), sym: b.sym ? 1 : 0, items: (Array.isArray(b.items) ? b.items : []).filter(function (x) { return x && P[x.p]; }).map(function (x) { return { p: String(x.p), m: x.m ? 1 : 0 }; }) }; }).filter(function (b) { return b.items.length; });
    var E = ["Posé", "Pointe", "Levé", "Talon", "Demi-appui"].map(function (x, i) { return String((Array.isArray(d.etats) && d.etats[i]) || x); });
    return { titre: String(d.titre || "Ma chorégraphie").slice(0, 60), noms: (Array.isArray(d.noms) ? d.noms : []).map(String).slice(0, 12), classe: String(d.classe || ""), etab: String(d.etab || ""), prof: String(d.prof || ""), pas: P, blocs: B, dec: bn(Math.round(d.dec == null ? 4 : +d.dec) || 0, 0, 16), etats: E, base: String(d.base || BASE) };
  }
  /* position des deux pieds au temps k (0 = départ) ; m = 1 : de l'autre côté */
  function etat(p, k, m) { var E = { L: Object.assign({}, DEP.L), R: Object.assign({}, DEP.R) }, B = { L: 0, R: 0 }, mot = "", saut = 0;
    for (var i = 0; i < k && i < p.c.length; i++) { var t = p.c[i]; ["L", "R"].forEach(function (s) { if (t[s]) { E[s] = Object.assign({}, t[s]); if (i === k - 1) B[s] = 1; } }); if (i === k - 1) { mot = t.t || ""; saut = t.j ? 1 : 0; } }
    if (!m) return { L: E.L, R: E.R, B: B, mot: mot, saut: saut };
    var mi = function (f) { return { x: 100 - f.x, y: f.y, a: (360 - f.a) % 360, s: f.s }; };
    return { L: mi(E.R), R: mi(E.L), B: { L: B.R, R: B.L }, mot: mot, saut: saut }; }
  /* suite des pas d'une sélection, puis suite des temps avec leur durée (chaque bloc à son tempo) */
  function suite(d, sel) { var I = []; d.blocs.forEach(function (b, bi) { if (sel >= 0 && sel !== bi) return; var A = b.items.map(function (x) { return { p: d.pas[x.p], m: x.m, b: b.nom, bpm: b.bpm }; }); I = I.concat(A); if (b.sym) I = I.concat(A.map(function (x) { return { p: x.p, m: x.m ? 0 : 1, b: b.nom + " · autre côté", bpm: x.bpm }; })); }); return I; }
  function temps(I, dec) { var T = [], t = 0, i, k; if (!I.length) return T; for (i = 0; i < dec; i++) { T.push({ t: t, dec: 8 - dec + i + 1 > 0 ? 8 - dec + i + 1 : i + 1, i: 0, k: 0 }); t += 60 / I[0].bpm; }
    I.forEach(function (x, ii) { for (k = 1; k <= x.p.n; k++) { T.push({ t: t, i: ii, k: k }); t += 60 / x.bpm; } }); T.fin = t; return T; }

  /* ---------- dessin sur canevas (sert au lecteur, aux images du PDF et à la vidéo) ---------- */
  var P2 = null;
  function pied(c, f, cote, bouge) { var col = cote === "L" ? G : D; P2 = P2 || new Path2D(SEM);
    c.save(); c.globalAlpha = bouge ? 1 : 0.38; c.translate(f.x, f.y); c.save(); c.rotate(f.a * Math.PI / 180); c.lineJoin = "round";
    if (f.s === 2) { c.fillStyle = "rgba(255,255,255,.55)"; c.fill(P2); c.setLineDash([2.4, 1.8]); c.strokeStyle = col; c.lineWidth = 1.4; c.stroke(P2); c.setLineDash([]); }
    else if (f.s === 0) { c.fillStyle = col; c.fill(P2); c.strokeStyle = INK; c.lineWidth = bouge ? 0.9 : 0.4; c.stroke(P2); }
    else { c.save(); c.globalAlpha *= f.s === 4 ? 0.3 : 0.28; c.fillStyle = col; c.fill(P2); c.restore(); c.strokeStyle = col; c.lineWidth = 1.25; c.stroke(P2); c.fillStyle = col;
      if (f.s === 1) { c.beginPath(); c.arc(0, -6, 3.2, 0, 7); c.fill(); } else if (f.s === 3) { c.beginPath(); c.arc(0, 6.6, 3, 0, 7); c.fill(); }
      else { c.lineWidth = 1.5; c.beginPath(); c.moveTo(-4.4, -3); c.lineTo(4.4, -7); c.moveTo(-4.4, 2); c.lineTo(4.6, -2); c.moveTo(-4, 7); c.lineTo(4.4, 3); c.stroke(); } }
    c.restore(); c.font = "800 7px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; c.textAlign = "center"; c.textBaseline = "alphabetic";
    if (f.s !== 0) { c.lineWidth = 1; c.strokeStyle = "#fff"; c.strokeText(cote === "L" ? "G" : "D", 0, 2.6); } c.fillStyle = f.s === 0 ? "#fff" : INK; c.fillText(cote === "L" ? "G" : "D", 0, 2.6); c.restore(); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  /* schéma dans le rectangle (x, y, largeur w), hauteur = 0,8 × w ; e = {L, R, B, saut} */
  function schema(c, x, y, w, e, tout) { var s = w / 100; c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = "#EEF0F3"; rr(c, 0, 0, 100, 80, 3); c.fill();
    c.fillStyle = "#C9CED6"; c.strokeStyle = "#8A919C"; c.lineWidth = 0.8; rr(c, 24, 12, 52, 30, 3); c.fill(); c.stroke();
    c.fillStyle = "#6A6F78"; c.font = "700 5px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; c.textAlign = "center"; c.fillText("STEP", 50, 9);
    pied(c, e.L, "L", tout || e.B.L); pied(c, e.R, "R", tout || e.B.R);
    if (e.saut) { c.fillStyle = INK; rr(c, 2, 2, 21, 8, 4); c.fill(); c.fillStyle = "#fff"; c.font = "800 5px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; c.fillText("SAUT", 12.5, 7.9); }
    c.restore(); }
  function mix(a, b, u) { var da = ((((b.a - a.a) % 360) + 540) % 360) - 180; return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, a: a.a + da * u, s: b.s }; }
  /* image complète de la chorégraphie à l'instant t (secondes depuis le début) : lecteur à l'écran et vidéo */
  function image(c, W, H, d, I, T, t) { var n = T.length, j = 0; while (j + 1 < n && T[j + 1].t <= t) j++; var b = T[j], x = I[b.i], fini = t >= T.fin;
    var e = b.dec ? etat(x.p, 0, x.m) : etat(x.p, b.k, x.m), av, u = 1;
    if (!b.dec) { var pj = T[j - 1]; av = !pj || pj.dec ? etat(x.p, 0, x.m) : etat(I[pj.i].p, pj.k, I[pj.i].m); var dt = Math.min(0.24, (j + 1 < n ? T[j + 1].t - b.t : 0.5) * 0.5); u = bn((t - b.t) / dt, 0, 1); u = 1 - (1 - u) * (1 - u); e = { L: mix(av.L, e.L, u), R: mix(av.R, e.R, u), B: e.B, saut: e.saut, mot: e.mot }; }
    c.fillStyle = INK; c.fillRect(0, 0, W, H);
    var pad = W * 0.04, hTop = H * 0.15, big = Math.round(W * 0.085);
    c.fillStyle = COL; c.fillRect(0, 0, W * (fini ? 1 : b.dec ? 0 : (j - (T[0].dec ? countDec(T) : 0) + 1) / (n - (T[0].dec ? countDec(T) : 0))), Math.max(4, H * 0.008));
    c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillStyle = "#A9AEB8"; c.font = "700 " + Math.round(W * 0.03) + "px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    c.textAlign = "center"; /* titre et nom du pas centrés, comme dans le lecteur de l'appli */
    c.fillText(b.dec ? "Prêt ?" : (x.b ? x.b + " · " : "") + "Pas " + (b.i + 1) + " sur " + I.length + (x.m ? " · de l'autre côté" : ""), W / 2, hTop * 0.38, W - 2 * pad);
    c.fillStyle = "#fff"; c.font = "900 " + big + "px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; c.fillText(fini ? "Terminé" : x.p.nom, W / 2, hTop * 0.92, W - 2 * pad);
    c.fillStyle = COL; c.fillRect(0, hTop + H * 0.012, W, Math.max(3, H * 0.006));
    var bas = H * 0.2, zh = H - hTop - bas - H * 0.05, col = Math.min(W * 0.22, 170), sw = Math.min(W - 2 * pad - col, zh * 1.25), sx = pad + (W - 2 * pad - col - sw) / 2, sy = hTop + H * 0.035 + (zh - sw * 0.8) / 2;
    schema(c, sx, sy, sw, e, !!b.dec);
    c.fillStyle = !b.dec && b.k === 1 ? "#F0ABFC" : "#fff"; c.textAlign = "center"; c.font = "900 " + Math.round(col * 0.95) + "px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; c.fillText(fini ? "✓" : String(b.dec || b.k), W - pad - col / 2, sy + sw * 0.4 + col * 0.33);
    if (!b.dec && (e.mot || e.saut)) { c.fillStyle = "#A9AEB8"; c.font = "700 " + Math.round(W * 0.03) + "px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; c.fillText((e.mot || "") + (e.saut ? (e.mot ? " · " : "") + "sauté" : ""), W - pad - col / 2, sy + sw * 0.4 + col * 0.33 + W * 0.05, col); }
    var y0 = H - bas + H * 0.01, nn = b.dec ? 0 : x.p.n, gw = (W - 2 * pad) / Math.max(1, nn), i;
    for (i = 0; i < nn; i++) { c.fillStyle = i + 1 === b.k ? COL : "#2A2F37"; rr(c, pad + i * gw + 3, y0, gw - 6, H * 0.05, 8); c.fill(); c.fillStyle = i + 1 === b.k ? "#fff" : "#A9AEB8"; c.font = "800 " + Math.round(H * 0.028) + "px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; c.fillText(String(i + 1), pad + i * gw + gw / 2, y0 + H * 0.036); }
    var sv = I[b.i + 1]; c.textAlign = "left"; c.fillStyle = "#D5D8DE"; c.font = "700 " + Math.round(W * 0.036) + "px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    var mw = H * 0.1 * 1.25; if (b.dec) c.fillText("Départ : " + x.p.nom, pad, H - bas * 0.3, W - 2 * pad);
    else if (sv) { schema(c, pad, H - bas + H * 0.075, mw, etat(sv.p, 1, sv.m), false); c.fillText("Ensuite : " + sv.p.nom + (sv.m ? " (autre côté)" : ""), pad + mw + W * 0.03, H - bas * 0.3, W - 2 * pad - mw - W * 0.2); }
    else c.fillText("Dernier pas", pad, H - bas * 0.3);
    c.textAlign = "right"; c.fillStyle = "#A9AEB8"; c.font = "700 " + Math.round(W * 0.032) + "px system-ui,-apple-system,Segoe UI,Roboto,sans-serif"; c.fillText(x.bpm + " bpm", W - pad, H - bas * 0.3);
  }
  function countDec(T) { var n = 0; while (n < T.length && T[n].dec) n++; return n; }

  /* ---------- son : un clic par temps, plus aigu sur le 1 ---------- */
  function clic(ac, out, quand, fort) { try { var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = fort === 2 ? 1568 : fort === 1 ? 1175 : 880; o.connect(g); g.connect(out); g.gain.setValueAtTime(fort ? 0.5 : 0.3, quand); g.gain.exponentialRampToValueAtTime(0.001, quand + 0.07); o.start(quand); o.stop(quand + 0.08); } catch (e) {} }
  function sons(ac, out, T, t0, depuis) { T.forEach(function (b) { if (b.t < (depuis || 0)) return; clic(ac, out, t0 + b.t, b.dec ? 0 : b.k === 1 ? 2 : b.k % 4 === 1 ? 1 : 0); }); }

  /* ---------- vidéo : la chorégraphie jouée en temps réel dans un canevas, enregistrée avec le son du métronome ---------- */
  function typeVideo() { /* MP4 (H.264) quand l'appareil sait l'encoder : il se lit partout. Sinon WebM, plutôt qu'un MP4 au contenu peu lisible ailleurs. */
    var L = ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4;codecs="avc1.42E01E"', "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]; if (!window.MediaRecorder) return ""; for (var i = 0; i < L.length; i++) { try { if (MediaRecorder.isTypeSupported(L[i])) return L[i]; } catch (e) {} } return ""; }
  function video(data, sel, prog, ctl) { var d = norm(data), I = suite(d, sel == null ? -1 : sel), T = temps(I, d.dec);
    return new Promise(function (ok, ko) {
      if (!I.length) return ko(new Error("Rien à exporter : la chorégraphie est vide."));
      var mime = typeVideo(), cv = document.createElement("canvas"); if (!mime || !cv.captureStream) return ko(new Error("Cet appareil ne sait pas enregistrer une vidéo. Utilise le PDF, ou un autre appareil."));
      cv.width = 720; cv.height = 960; var c = cv.getContext("2d"), ac, dest, rec, parts = [], raf = 0, fin = false;
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); dest = ac.createMediaStreamDestination(); } catch (e) { ac = null; }
      var st = cv.captureStream(30); if (dest) dest.stream.getAudioTracks().forEach(function (t) { st.addTrack(t); });
      try { rec = new MediaRecorder(st, { mimeType: mime, videoBitsPerSecond: 1800000 }); } catch (e) { return ko(new Error("Enregistrement vidéo impossible sur cet appareil.")); }
      rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) parts.push(ev.data); };
      rec.onerror = function () { stop(new Error("L'enregistrement s'est interrompu.")); };
      rec.onstop = function () { try { st.getTracks().forEach(function (t) { t.stop(); }); if (ac) ac.close(); } catch (e) {} if (fin instanceof Error) return ko(fin); var b = new Blob(parts, { type: mime.split(";")[0] }); if (!b.size) return ko(new Error("La vidéo est vide : réessaie en gardant l'écran allumé.")); ok({ blob: b, ext: /mp4/.test(mime) ? "mp4" : "webm" }); };
      function stop(err) { if (fin) return; fin = err || true; cancelAnimationFrame(raf); clearInterval(iv); try { if (rec.state !== "inactive") rec.stop(); } catch (e) { ko(err || e); } }
      if (ctl) ctl.annuler = function () { stop(new Error("Export annulé.")); };
      var t0, hor = function () { return ac && ac.state === "running" ? ac.currentTime : performance.now() / 1000; };
      image(c, cv.width, cv.height, d, I, T, 0); rec.start(500);
      var go = function () { t0 = hor() + 0.35; if (ac) sons(ac, dest, T, t0); raf = requestAnimationFrame(pas); };
      function pas() { if (fin) return; var t = hor() - t0; image(c, cv.width, cv.height, d, I, T, Math.max(0, t)); if (prog) prog(bn(t / (T.fin + 0.6), 0, 1), cv); if (t >= T.fin + 0.6) return stop(); raf = requestAnimationFrame(pas); }
      /* onglet en arrière-plan : le dessin continue quand même (une image par seconde au moins) */
      var iv = setInterval(function () { if (!fin && document.hidden && t0 != null) { var t = hor() - t0; image(c, cv.width, cv.height, d, I, T, Math.max(0, t)); if (t >= T.fin + 0.6) stop(); } }, 250);
      if (ac && ac.state === "suspended") ac.resume().then(go, go); else go();
    }); }

  /* ---------- PDF : en-tête, puis chaque bloc avec un schéma par temps ---------- */
  var libP = null;
  function lib(base) { if (window.PDFLib) return Promise.resolve(window.PDFLib); if (libP) return libP; libP = new Promise(function (ok, ko) { var s = document.createElement("script"); s.src = base + "vendor/pdf-lib.min.js"; s.onload = function () { window.PDFLib ? ok(window.PDFLib) : ko(new Error("Bibliothèque PDF absente.")); }; s.onerror = function () { libP = null; ko(new Error("La fabrication du PDF demande une première ouverture avec du réseau.")); }; document.head.appendChild(s); }); return libP; }
  function ansi(s) { return String(s == null ? "" : s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E -ÿ]/g, "").trim(); }
  function png(cv) { return new Promise(function (ok) { cv.toBlob(function (b) { b.arrayBuffer().then(function (a) { ok(new Uint8Array(a)); }); }, "image/png"); }); }
  async function pdf(data, sel) { var d = norm(data); sel = sel == null ? -1 : sel; var B = d.blocs.filter(function (b, i) { return sel < 0 || sel === i; }); if (!B.length) throw new Error("Rien à exporter : la chorégraphie est vide.");
    var L = await lib(d.base), doc = await L.PDFDocument.create(), F = await doc.embedFont(L.StandardFonts.Helvetica), FB = await doc.embedFont(L.StandardFonts.HelveticaBold), rgb = L.rgb;
    var hex = function (h) { return rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255); };
    var W = 595.28, H = 841.89, M = 36, pg = null, y = 0, np = 0, cache = {}, cv = document.createElement("canvas"); cv.width = 300; cv.height = 240; var c = cv.getContext("2d");
    var tx = function (t, x, yy, o) { o = o || {}; var f = o.b ? FB : F, s = o.s || 10; t = ansi(t); if (o.max) { while (t.length > 3 && f.widthOfTextAtSize(t, s) > o.max) t = t.slice(0, -2); } var w = f.widthOfTextAtSize(t, s); pg.drawText(t, { x: o.r ? x - w : o.c ? x - w / 2 : x, y: yy, size: s, font: f, color: hex(o.col || INK) }); };
    var page = function () { pg = doc.addPage([W, H]); np++; y = H - M; if (np === 1) { pg.drawRectangle({ x: M, y: H - M - 58, width: W - 2 * M, height: 58, color: hex(INK) }); pg.drawRectangle({ x: M, y: H - M - 58, width: 6, height: 58, color: hex(COL) });
        tx("Step · " + d.titre, M + 18, H - M - 25, { b: 1, s: 14.5, col: "#FFFFFF", max: 300 }); tx(d.noms.join(", "), M + 18, H - M - 44, { s: 9, col: "#A9AEB8", max: 300 });
        tx(d.classe, W - M - 14, H - M - 25, { b: 1, s: 14.5, col: "#FFFFFF", r: 1, max: 190 }); tx([d.etab, d.prof, new Date().toLocaleDateString("fr-FR")].filter(Boolean).join(" · "), W - M - 14, H - M - 44, { s: 9, col: "#A9AEB8", r: 1, max: 200 }); y = H - M - 58 - 22; }
      else { tx("Step · " + d.titre + " · " + d.noms.join(", "), M, H - M - 4, { s: 8, col: "#6A6F78", max: W - 2 * M - 40 }); tx(String(np), W - M, H - M - 4, { s: 8, col: "#6A6F78", r: 1 }); y = H - M - 22; } };
    var img = async function (p, k, m) { var key = p.id + "|" + k + "|" + m; if (cache[key]) return cache[key]; c.clearRect(0, 0, 300, 240); schema(c, 0, 0, 300, etat(p, k, m), false); cache[key] = await doc.embedPng(await png(cv)); return cache[key]; };
    var PAR = 8, gap = 5, cw = (W - 2 * M - (PAR - 1) * gap) / PAR, ch = cw * 0.8, hl = 16 + ch + 14;
    page();
    for (var bi = 0; bi < B.length; bi++) { var b = B[bi], cotes = b.sym ? [0, 1] : [0];
      for (var ci = 0; ci < cotes.length; ci++) { var tot = b.items.reduce(function (n, x) { return n + d.pas[x.p].n; }, 0);
        if (y < M + 30 + hl) page();
        pg.drawRectangle({ x: M, y: y - 16, width: W - 2 * M, height: 22, color: hex("#FAE8FF") }); tx(b.nom + (ci ? " · de l'autre côté" : ""), M + 8, y - 10, { b: 1, s: 12, col: COL, max: 300 }); tx(tot + " temps · " + b.bpm + " battements par minute", W - M - 8, y - 10, { s: 9.5, col: "#3A3F47", r: 1 }); y -= 30;
        /* un pas de 4 temps ou moins prend une demi-largeur : deux pas courts côte à côte */
        var colo = 0, demi = 4 * (cw + gap);
        for (var ii = 0; ii < b.items.length; ii++) { var x = b.items[ii], p = d.pas[x.p], m = ci ? (x.m ? 0 : 1) : x.m, court = p.n <= 4, rangs = Math.ceil(p.n / PAR);
          if (!court && colo) { y -= hl + 4; colo = 0; }
          if (!colo && y < M + hl) page();
          var X0 = M + (court ? colo * demi : 0), XR = court ? X0 + demi - gap : W - M;
          tx((ii + 1) + ". " + p.nom, X0, y - 9, { b: 1, s: 11.5, max: court ? 150 : 330 }); tx(p.n + " temps" + (m ? " · autre côté" : ""), XR, y - 9, { s: 8.5, col: "#6A6F78", r: 1 });
          var yy = y - 16;
          for (var r = 0; r < rangs; r++) { if (!court && yy < M + ch + 14) { page(); yy = y; }
            for (var q = 0; q < PAR && r * PAR + q < p.n; q++) { var k = r * PAR + q + 1, e = etat(p, k, m), X = X0 + q * (cw + gap); pg.drawImage(await img(p, k, m), { x: X, y: yy - ch, width: cw, height: ch });
              pg.drawRectangle({ x: X + 2, y: yy - 11, width: 10, height: 9, color: hex(INK) }); tx(String(k), X + 7, yy - 9, { b: 1, s: 6.5, col: "#FFFFFF", c: 1 });
              if (e.mot || e.saut) tx((e.mot || "") + (e.saut ? (e.mot ? " · " : "") + "sauté" : ""), X + cw / 2, yy - ch - 8, { s: 6.5, col: "#6A6F78", c: 1, max: cw }); }
            yy -= ch + 14; }
          if (court) { if (colo) { y -= hl + 4; colo = 0; } else colo = 1; } else { y = yy - 4; } }
        if (colo) { y -= hl + 4; colo = 0; }
        y -= 8; } }
    if (y < M + 26) page();
    tx("G rouge : pied gauche · D vert : pied droit · pointillés : " + d.etats[2].toLowerCase() + " · point devant : " + d.etats[1].toLowerCase() + " · point derrière : " + d.etats[3].toLowerCase() + " · hachures : " + d.etats[4].toLowerCase(), M, Math.max(M, y - 8), { s: 7.5, col: "#6A6F78", max: W - 2 * M });
    return new Blob([await doc.save()], { type: "application/pdf" }); }

  /* ---------- fenêtre : revoir, puis exporter ---------- */
  function fichier(d, sel, ext) { var n = (sel < 0 ? "Choregraphie" : d.blocs[sel].nom) + "_" + (d.noms.map(function (x) { return x.split(/\s+/)[0]; }).join("-") || "step"); return "Step_" + n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9-]+/g, "_").slice(0, 60) + "." + ext; }
  function open(data) { var d = norm(data), old = document.getElementById("epsstep"); if (old) old.remove();
    var o = document.createElement("div"); o.id = "epsstep"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Ma chorégraphie de step");
    o.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#14171C;color:#fff;overflow:auto;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
    var S = { sel: -1, joue: false, t0: 0, raf: 0, ac: null, out: null, res: null, ctl: {}, occ: false };
    var css = "<style>#epsstep *{box-sizing:border-box}#epsstep .in{max-width:760px;margin:0 auto;padding:12px 14px 30px}#epsstep h2{margin:0;font-size:22px;flex:1}#epsstep button{font:inherit;font-weight:700;border-radius:12px;min-height:46px;padding:8px 14px;border:1.5px solid #3A3F47;background:#2A2F37;color:#fff;cursor:pointer}#epsstep button.p{background:" + COL + ";border-color:" + COL + "}#epsstep button.on{background:" + COL + ";border-color:" + COL + "}#epsstep button:disabled{opacity:.45}#epsstep .r{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}#epsstep canvas{display:block;width:100%;max-width:min(100%,calc((100vh - 250px)*.75));margin:0 auto;border-radius:14px;background:#14171C}#epsstep .m{color:#A9AEB8;font-size:14px;margin:6px 0}#epsstep .box{background:#1E2228;border-radius:14px;padding:12px;margin-top:12px}#epsstep a.dl{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:8px 14px;border-radius:12px;background:" + COL + ";color:#fff;font-weight:700;text-decoration:none}#epsstep progress{width:100%;height:14px}</style>";
    function dessine() { var I = suite(d, S.sel), T = temps(I, d.dec), cv = o.querySelector("#es-cv"); if (!cv || !I.length) return null; var c = cv.getContext("2d"); return { I: I, T: T, c: c, cv: cv }; }
    function arret() { S.joue = false; cancelAnimationFrame(S.raf); if (S.ac) { try { S.ac.close(); } catch (e) {} S.ac = null; } var b = o.querySelector("#es-play"); if (b) b.textContent = "▶ Lire avec le métronome"; }
    function lire() { if (S.joue) { arret(); fixe(); return; } var x = dessine(); if (!x) return; S.joue = true; o.querySelector("#es-play").textContent = "■ Arrêter";
      try { S.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { S.ac = null; }
      var hor = function () { return S.ac && S.ac.state === "running" ? S.ac.currentTime : performance.now() / 1000; };
      var go = function () { S.t0 = hor() + 0.25; if (S.ac) sons(S.ac, S.ac.destination, x.T, S.t0); var pas = function () { if (!S.joue) return; var t = hor() - S.t0; image(x.c, x.cv.width, x.cv.height, d, x.I, x.T, Math.max(0, t)); if (t >= x.T.fin + 0.8) { arret(); return; } S.raf = requestAnimationFrame(pas); }; S.raf = requestAnimationFrame(pas); };
      if (S.ac && S.ac.state === "suspended") S.ac.resume().then(go, go); else go(); }
    function fixe() { var x = dessine(); if (x) image(x.c, x.cv.width, x.cv.height, d, x.I, x.T, x.T.length > d.dec ? x.T[d.dec].t + 0.3 : 0); }
    function resultat(blob, ext) { var nom = fichier(d, S.sel, ext), url = URL.createObjectURL(blob), box = o.querySelector("#es-res"), f = null; try { f = new File([blob], nom, { type: blob.type }); } catch (e) {}
      var part = f && navigator.canShare && navigator.canShare({ files: [f] });
      box.innerHTML = '<b>' + (ext === "pdf" ? "📄 PDF prêt" : "🎬 Vidéo prête") + " · " + (blob.size > 1048576 ? (blob.size / 1048576).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(blob.size / 1024)) + " Ko") + '</b><div class="r"><a class="dl" href="' + url + '" download="' + esc(nom) + '">⬇ Télécharger</a>' + (part ? '<button type="button" id="es-sh">📤 Envoyer / partager</button>' : "") + (ext === "pdf" ? '<button type="button" id="es-voir">👁 Ouvrir</button>' : "") + "</div>" + (ext !== "pdf" ? '<video controls playsinline style="width:100%;max-height:50vh;border-radius:12px;background:#000" src="' + url + '"></video>' : "") +
        '<p class="m">Pour l\'envoyer par PRONOTE : télécharge le fichier, puis joins-le dans une discussion ou dans un travail à rendre' + (ext === "webm" ? ". Cette vidéo est au format WebM : si elle ne se lit pas chez toi, ouvre-la avec Chrome ou VLC." : ".") + "</p>";
      var sh = box.querySelector("#es-sh"); if (sh) sh.onclick = function () { navigator.share({ files: [f], title: d.titre }).catch(function () {}); };
      var v = box.querySelector("#es-voir"); if (v) v.onclick = function () { window.open(url, "_blank"); };
      S.res = { blob: blob, ext: ext, nom: nom }; o.dispatchEvent(new CustomEvent("epsstep-pret", { detail: S.res })); }
    function occupe(on, txt) { S.occ = on; o.querySelectorAll("[data-x]").forEach(function (b) { b.disabled = on; }); var box = o.querySelector("#es-res"); if (on) box.innerHTML = '<b>' + esc(txt) + '</b><progress id="es-pr" max="1" value="0"></progress>' + (/vidéo/.test(txt) ? '<p class="m">La chorégraphie est jouée une fois en entier pendant l\'enregistrement : garde cet écran ouvert.</p><button type="button" id="es-ann">Annuler</button>' : ""); }
    function exPdf() { if (S.occ) return; arret(); occupe(true, "Fabrication du PDF…"); pdf(d, S.sel).then(function (b) { occupe(false); resultat(b, "pdf"); }, function (e) { occupe(false); o.querySelector("#es-res").innerHTML = '<b>⚠ ' + esc(e.message || "PDF impossible.") + "</b>"; }); }
    function exVid() { if (S.occ) return; arret(); var I = suite(d, S.sel), T = temps(I, d.dec), sec = Math.round(T.fin || 0); occupe(true, "Enregistrement de la vidéo… (" + (sec >= 60 ? Math.floor(sec / 60) + " min " : "") + (sec % 60) + " s)"); var ann = o.querySelector("#es-ann"); S.ctl = {}; if (ann) ann.onclick = function () { if (S.ctl.annuler) S.ctl.annuler(); };
      var wl = null; try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wl = w; }, function () {}); } catch (e) {}
      var x = dessine(), fin = function () { try { if (wl) wl.release(); } catch (e) {} };
      video(d, S.sel, function (p, cv) { var pr = o.querySelector("#es-pr"); if (pr) pr.value = p; if (x) x.c.drawImage(cv, 0, 0, x.cv.width, x.cv.height); }, S.ctl).then(function (r) { fin(); occupe(false); resultat(r.blob, r.ext); fixe(); }, function (e) { fin(); occupe(false); o.querySelector("#es-res").innerHTML = '<b>⚠ ' + esc(e.message || "Vidéo impossible.") + "</b>"; fixe(); }); }
    function rendre() { var vide = !d.blocs.length;
      o.innerHTML = css + '<div class="in"><div class="r" style="margin-top:0"><h2>' + esc(d.titre) + '</h2><button type="button" id="es-x" aria-label="Fermer">✕ Fermer</button></div><p class="m">' + esc(d.noms.join(", ")) + (d.classe ? " · " + esc(d.classe) : "") + "</p>" +
        (vide ? '<div class="box">Aucun bloc pour l\'instant : compose d\'abord ta chorégraphie.</div>' :
          (d.blocs.length > 1 ? '<div class="r" role="group" aria-label="Ce que je veux voir ou exporter"><button type="button" data-x data-sel="-1" class="' + (S.sel < 0 ? "on" : "") + '">Toute la chorégraphie</button>' + d.blocs.map(function (b, i) { return '<button type="button" data-x data-sel="' + i + '" class="' + (S.sel === i ? "on" : "") + '">' + esc(b.nom) + "</button>"; }).join("") + "</div>" : "") +
          '<canvas id="es-cv" width="720" height="960" aria-label="Chorégraphie animée"></canvas><div class="r"><button type="button" class="p" id="es-play" style="flex:1">▶ Lire avec le métronome</button></div>' +
          '<div class="box"><b>Exporter ' + (S.sel < 0 ? (d.blocs.length > 1 ? "toute la chorégraphie" : "ma chorégraphie") : "« " + esc(d.blocs[S.sel].nom) + " »") + '</b><div class="r"><button type="button" data-x id="es-pdf">📄 En PDF</button><button type="button" data-x id="es-vid">🎬 En vidéo</button></div><div id="es-res" class="m" aria-live="polite">Le PDF montre un schéma par temps. La vidéo montre les pieds qui bougent, avec le son du métronome.</div></div>') + "</div>";
      o.querySelector("#es-x").onclick = fermer; if (vide) return;
      o.querySelectorAll("[data-sel]").forEach(function (b) { b.onclick = function () { if (S.occ) return; arret(); S.sel = +b.dataset.sel; rendre(); }; });
      o.querySelector("#es-play").onclick = lire; o.querySelector("#es-pdf").onclick = exPdf; o.querySelector("#es-vid").onclick = exVid; fixe(); }
    function fermer() { if (S.occ && S.ctl.annuler) S.ctl.annuler(); arret(); o.remove(); try { document.documentElement.style.overflow = ""; } catch (e) {} if (typeof data.onClose === "function") { try { data.onClose(); } catch (e) {} } }
    document.body.appendChild(o); try { document.documentElement.style.overflow = "hidden"; } catch (e) {} rendre(); return o; }

  window.EPSSTEP = { open: open, pdf: pdf, video: video, etat: etat, norm: norm };
})();
