// ===== OrienRun EPS — fonctions communes =====
const APP_VERSION = "1.0";
const API_DEFAULT = "https://script.google.com/macros/s/AKfycbyRGDLL7S2-5FNmWz9C0cGt1jxDm42dvtSFMOBtczNtDcbqf98EKtc36pBUlnk-eIt6/exec"; // URL /exec du script Google, si on veut la fixer pour tout le monde
const APP_URL_DEFAULT = ""; // adresse publique de l'appli (sinon : adresse de la page ouverte)
const VIOLET = "#c21fbf";
const CODE_ALPHA = "ACDEFHJKLMNPRTUVWXY3479";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = (n = 8) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
const randCode = (n = 3) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => CODE_ALPHA[b % CODE_ALPHA.length]).join("");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));

function fmtDur(ms, withH) {
  if (ms == null || isNaN(ms)) return "–";
  const neg = ms < 0; ms = Math.abs(ms);
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
  const t = (h || withH ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(ss).padStart(2, "0");
  return (neg ? "-" : "") + t;
}
const fmtHeure = t => t ? new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "–";
const fmtDist = m => m == null || isNaN(m) ? "–" : m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(2).replace(".", ",") + " km";
const fmtNum = (v, d = 1) => v == null || isNaN(v) || !isFinite(v) ? "–" : v.toFixed(d).replace(".", ",");
const fmtAllure = (m, ms) => (!m || m < 30 || !ms) ? "–" : fmtDur(ms / (m / 1000)) + "/km";

function toast(msg, kind = "") {
  let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.className = "show " + kind; t.innerHTML = msg; clearTimeout(t._h); t._h = setTimeout(() => t.className = "", 3200);
}

// Numéros de balise qui se confondent une fois retournés (66/99, 68/89, 86/98…) : à éviter
function numAmbigu(n) { const m = { 0: "0", 1: "1", 6: "9", 8: "8", 9: "6" }, d = String(n); if (![...d].every(c => m[c] != null)) return false; const r = [...d].reverse().map(c => m[c]).join(""); return r !== d; }
// ---------- empreinte courte (codes de balise) ----------
function hash32(str) { let h = 0x811c9dc5; for (const c of new TextEncoder().encode(str)) { h ^= c; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
const codeHash = (salt, n, code) => hash32(salt + ":" + n + ":" + String(code || "").trim().toUpperCase()).toString(36).slice(-4);
async function sha256(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, "0")).join(""); }

// ---------- base64url (UTF-8) ----------
function b64e(obj) { const s = JSON.stringify(obj); const bin = Array.from(new TextEncoder().encode(s), b => String.fromCharCode(b)).join(""); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64d(str) { const b = atob(str.replace(/-/g, "+").replace(/_/g, "/")); return JSON.parse(new TextDecoder().decode(Uint8Array.from(b, c => c.charCodeAt(0)))); }

// ---------- stockage : IndexedDB (grosses données) + localStorage ----------
const DB = (() => {
  let p;
  const open = () => p || (p = new Promise((res, rej) => { const r = indexedDB.open("orienrun", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  return {
    async get(k) { try { const db = await open(); return await new Promise((res, rej) => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch (e) { try { return JSON.parse(localStorage.getItem("or." + k)); } catch (_) { return null; } } },
    async set(k, v) { try { const db = await open(); await new Promise((res, rej) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch (e) { localStorage.setItem("or." + k, JSON.stringify(v)); } },
    async del(k) { try { const db = await open(); await new Promise(res => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").delete(k); t.oncomplete = res; }); } catch (e) { localStorage.removeItem("or." + k); } }
  };
})();
const LS = { get(k, d) { try { const v = localStorage.getItem("or." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("or." + k, JSON.stringify(v)); } catch (e) {} } };

// ---------- géographie ----------
function haversine(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371000, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const gmapsUrl = (lat, lon) => `https://www.google.com/maps/search/?api=1&query=${(+lat).toFixed(6)},${(+lon).toFixed(6)}`;
function parseLatLon(s) {
  s = String(s || "");
  let m = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || s.match(/[?&](?:q|query|ll)=(-?\d+\.\d+)[, ]+(-?\d+\.\d+)/) || s.match(/(-?\d{1,2}[.,]\d{3,})\s*[,; ]\s*(-?\d{1,3}[.,]\d{3,})/);
  if (!m) return null;
  const lat = parseFloat(m[1].replace(",", ".")), lon = parseFloat(m[2].replace(",", "."));
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}

// Mesure GPS moyennée (plus précise qu'une seule lecture)
function measureGPS(seconds = 10, onProgress) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("GPS indisponible sur cet appareil"));
    const pts = []; const t0 = Date.now(); let done = false;
    const finish = () => {
      if (done) return; done = true; navigator.geolocation.clearWatch(id); clearInterval(tick);
      if (!pts.length) return reject(new Error("Aucune position reçue. Vérifie que la localisation est autorisée et que tu es dehors."));
      if (pts.some(p => !p.seed)) pts.splice(0, pts.length, ...pts.filter(p => !p.seed));
      const best = Math.min(...pts.map(p => p.acc));
      const keep = pts.filter(p => p.acc <= Math.max(best * 2, 8));
      let sw = 0, la = 0, lo = 0; keep.forEach(p => { const w = 1 / (p.acc * p.acc); sw += w; la += p.lat * w; lo += p.lon * w; });
      resolve({ lat: la / sw, lon: lo / sw, acc: Math.round(Math.max(best / Math.sqrt(keep.length), Math.min(best, 3)) * 10) / 10, n: pts.length, t: Date.now() });
    };
    const id = navigator.geolocation.watchPosition(p => {
      pts.push({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy || 50 });
      onProgress && onProgress({ n: pts.length, acc: p.coords.accuracy, left: Math.max(0, seconds - (Date.now() - t0) / 1000) });
    }, err => { if (!pts.length) { done = true; clearInterval(tick); navigator.geolocation.clearWatch(id); reject(new Error(err.code === 1 ? "Localisation refusée : autorise-la dans les réglages du navigateur." : "Position introuvable (" + err.message + ")")); } }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
    // position récente déjà connue par le téléphone (utile si un autre suivi GPS est actif)
    navigator.geolocation.getCurrentPosition(p => { if (!done && !pts.length) pts.push({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy || 50, seed: 1 }); }, () => {}, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
    const tick = setInterval(() => { onProgress && onProgress({ n: pts.length, left: Math.max(0, seconds - (Date.now() - t0) / 1000) }); if (Date.now() - t0 >= seconds * 1000 && pts.length) finish(); if (Date.now() - t0 > (seconds + 25) * 1000) finish(); }, 500);
  });
}

// ---------- calage de la carte (carte pas à l'échelle → « caoutchouc ») ----------
// Points de calage : {x,y} sur l'image + {lat,lon} sur le terrain. 2 points : similitude ; 3 et + : affine + correction locale (IDW).
function makeGeoref(points, noErr) {
  const P = (points || []).filter(p => p && p.x != null && p.lat != null);
  if (P.length < 2) return null;
  const lat0 = P.reduce((s, p) => s + p.lat, 0) / P.length, lon0 = P.reduce((s, p) => s + p.lon, 0) / P.length;
  const kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110540;
  const toM = (lat, lon) => [(lon - lon0) * kx, (lat - lat0) * ky];
  const fromM = (X, Y) => ({ lat: lat0 + Y / ky, lon: lon0 + X / kx });
  const src = P.map(p => toM(p.lat, p.lon)), dst = P.map(p => [p.x, p.y]);
  function fit(A, B) { // A -> B
    if (A.length === 2 || A.length > 2 && collinear(A)) { // similitude
      const [a1, a2] = A, [b1, b2] = B;
      const za = [a2[0] - a1[0], a2[1] - a1[1]], zb = [b2[0] - b1[0], b2[1] - b1[1]], d = za[0] ** 2 + za[1] ** 2 || 1;
      // reflet : l'axe Y image est vers le bas, l'axe Y mètres vers le haut → on conjugue
      const zac = [za[0], -za[1]];
      const c = [(zb[0] * zac[0] + zb[1] * zac[1]) / d, (zb[1] * zac[0] - zb[0] * zac[1]) / d];
      const f = (x, y) => { const dx = x - a1[0], dy = -(y - a1[1]); return [b1[0] + c[0] * dx - c[1] * dy, b1[1] + c[1] * dx + c[0] * dy]; };
      return f;
    }
    const n = A.length; let S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
    A.forEach((a, i) => { const v = [a[0], a[1], 1]; for (let r = 0; r < 3; r++) { for (let c = 0; c < 3; c++) S[r][c] += v[r] * v[c]; bx[r] += v[r] * B[i][0]; by[r] += v[r] * B[i][1]; } });
    const cx = solve3(S, bx), cy = solve3(S, by);
    const aff = (x, y) => [cx[0] * x + cx[1] * y + cx[2], cy[0] * x + cy[1] * y + cy[2]];
    const res = A.map((a, i) => { const q = aff(a[0], a[1]); return [B[i][0] - q[0], B[i][1] - q[1]]; });
    return (x, y) => { const q = aff(x, y); let sw = 0, rx = 0, ry = 0;
      for (let i = 0; i < n; i++) { const d2 = (x - A[i][0]) ** 2 + (y - A[i][1]) ** 2; if (d2 < 1e-9) return [B[i][0], B[i][1]]; const w = 1 / d2; sw += w; rx += res[i][0] * w; ry += res[i][1] * w; }
      return [q[0] + rx / sw, q[1] + ry / sw]; };
  }
  const geo2px = fit(src, dst), px2m = fit(dst, src);
  let err = null;
  if (P.length >= 4 && !noErr) { // erreur par validation croisée
    let s = 0; P.forEach((p, i) => { const g = makeGeoref(P.filter((_, j) => j !== i), true); if (g) { const q = g.toGeo(p.x, p.y); s += haversine(q, p) ** 2; } }); err = Math.sqrt(s / P.length);
  }
  const mPerPx = (() => { const a = dst[0], b = dst[1]; const da = Math.hypot(a[0] - b[0], a[1] - b[1]), dm = Math.hypot(src[0][0] - src[1][0], src[0][1] - src[1][1]); return da ? dm / da : null; })();
  return { n: P.length, err, mPerPx, toPx: (lat, lon) => { const m = toM(lat, lon); const q = geo2px(m[0], m[1]); return { x: q[0], y: q[1] }; }, toGeo: (x, y) => { const m = px2m(x, y); return fromM(m[0], m[1]); } };
}
function collinear(A) { if (A.length < 3) return true; const [a, b] = A; let maxArea = 0; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; for (const c of A.slice(2)) maxArea = Math.max(maxArea, Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / L); return maxArea < L * 0.05; }
function solve3(S, b) {
  const m = S.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r; [m[c], m[p]] = [m[p], m[c]]; const d = m[c][c] || 1e-12; for (let r = 0; r < 3; r++) if (r !== c) { const f = m[r][c] / d; for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k]; } }
  return [m[0][3] / (m[0][0] || 1e-12), m[1][3] / (m[1][1] || 1e-12), m[2][3] / (m[2][2] || 1e-12)];
}

// ---------- symboles de course d'orientation (ISOM 2017-2 / ISSprOM 2019, simplifiés) ----------
const BRUN = "#c0702c", BLEU = "#00a0e2", NOIR = "#111";
const SYM = [
  // lignes
  { id: "route", k: "line", code: "502", nom: "Route / chemin large", grp: "Chemins", draw: { w: 1.1, c: NOIR, inner: { w: .65, c: "#f4d9b6" } } },
  { id: "chemin", k: "line", code: "505", nom: "Chemin", grp: "Chemins", draw: { w: .35, c: NOIR, dash: [2, .3] } },
  { id: "sentier", k: "line", code: "506", nom: "Petit sentier", grp: "Chemins", draw: { w: .25, c: NOIR, dash: [1, .3] } },
  { id: "limveg", k: "line", code: "416", nom: "Limite de végétation", grp: "Végétation", draw: { w: .3, c: NOIR, dash: [.01, .55], cap: "round" } },
  { id: "courbe", k: "line", code: "101", nom: "Courbe de niveau", grp: "Relief", draw: { w: .14, c: BRUN } },
  { id: "courbe_m", k: "line", code: "102", nom: "Courbe maîtresse", grp: "Relief", draw: { w: .25, c: BRUN } },
  { id: "talus", k: "line", code: "104", nom: "Talus", grp: "Relief", draw: { w: .14, c: BRUN, ticks: { len: .6, gap: .8, w: .14 } } },
  { id: "ruisseau", k: "line", code: "305", nom: "Ruisseau / fossé", grp: "Eau", draw: { w: .25, c: BLEU } },
  { id: "mur", k: "line", code: "513", nom: "Mur", grp: "Constructions", draw: { w: .25, c: NOIR } },
  { id: "mur_inf", k: "line", code: "515", nom: "Mur infranchissable", grp: "Constructions", draw: { w: .55, c: NOIR } },
  { id: "cloture", k: "line", code: "516", nom: "Clôture", grp: "Constructions", draw: { w: .18, c: NOIR, ticks: { len: .5, gap: 1.5, w: .18 } } },
  { id: "cloture_inf", k: "line", code: "518", nom: "Clôture infranchissable", grp: "Constructions", draw: { w: .4, c: NOIR, ticks: { len: .8, gap: 1.2, w: .25, both: true } } },
  { id: "trace_course", k: "line", code: "705", nom: "Tracé balisé (violet)", grp: "Surimpression", draw: { w: .35, c: VIOLET, dash: [2, .5] } },
  // surfaces
  { id: "decouvert", k: "area", code: "401", nom: "Terrain découvert", grp: "Végétation", draw: { f: "#ffba35" } },
  { id: "semi", k: "area", code: "403", nom: "Terrain semi-découvert", grp: "Végétation", draw: { f: "#ffdd9a" } },
  { id: "vert1", k: "area", code: "406", nom: "Forêt : course lente", grp: "Végétation", draw: { f: "#c9eab8" } },
  { id: "vert2", k: "area", code: "408", nom: "Forêt : course difficile", grp: "Végétation", draw: { f: "#8ccf7e" } },
  { id: "vert3", k: "area", code: "410", nom: "Végétation impénétrable", grp: "Végétation", draw: { f: "#3fae4a" } },
  { id: "eau", k: "area", code: "301", nom: "Étendue d'eau", grp: "Eau", draw: { f: "#7fd0f5", s: NOIR, sw: .18 } },
  { id: "marais", k: "area", code: "308", nom: "Marais", grp: "Eau", draw: { pat: "marais" } },
  { id: "bati", k: "area", code: "521", nom: "Bâtiment", grp: "Constructions", draw: { f: "#808080", s: NOIR, sw: .18 } },
  { id: "preau", k: "area", code: "522", nom: "Préau / passage couvert", grp: "Constructions", draw: { f: "#c8c8c8", s: NOIR, sw: .14 } },
  { id: "revetu", k: "area", code: "501", nom: "Zone revêtue (cour, parking)", grp: "Constructions", draw: { f: "#e9cfae", s: NOIR, sw: .1 } },
  { id: "interdit", k: "area", code: "520", nom: "Zone interdite (olive)", grp: "Constructions", draw: { f: "#a6a83b" } },
  { id: "interdit_v", k: "area", code: "709", nom: "Zone interdite (violet)", grp: "Surimpression", draw: { pat: "hachV", s: VIOLET, sw: .25 } },
  // ponctuels
  { id: "rocher", k: "point", code: "204", nom: "Rocher", grp: "Rochers" },
  { id: "gros_rocher", k: "point", code: "206", nom: "Gros rocher", grp: "Rochers" },
  { id: "butte", k: "point", code: "112", nom: "Petite butte", grp: "Relief" },
  { id: "depression", k: "point", code: "115", nom: "Petite dépression", grp: "Relief" },
  { id: "trou", k: "point", code: "116", nom: "Trou", grp: "Relief" },
  { id: "arbre", k: "point", code: "417", nom: "Arbre remarquable", grp: "Végétation" },
  { id: "buisson", k: "point", code: "418", nom: "Buisson remarquable", grp: "Végétation" },
  { id: "source", k: "point", code: "312", nom: "Point d'eau / fontaine", grp: "Eau" },
  { id: "objet_x", k: "point", code: "531", nom: "Objet particulier (×)", grp: "Constructions" },
  { id: "objet_o", k: "point", code: "530", nom: "Objet particulier (○)", grp: "Constructions" },
  { id: "poteau", k: "point", code: "524", nom: "Poteau / pylône", grp: "Constructions" },
  { id: "interdit_x", k: "point", code: "711", nom: "Passage interdit (× violet)", grp: "Surimpression" },
  { id: "secours", k: "point", code: "712", nom: "Poste de secours", grp: "Surimpression" },
  { id: "nord", k: "point", code: "", nom: "Flèche du nord", grp: "Divers" },
  { id: "texte", k: "text", code: "", nom: "Texte", grp: "Divers" }
];
const SYMI = Object.fromEntries(SYM.map(s => [s.id, s]));

// Descriptions de postes (définitions simplifiées pour l'école)
const DESCRIPTIONS = ["Angle de bâtiment", "Angle de mur", "Angle de clôture", "Bout de mur", "Arbre", "Buisson", "Rocher", "Banc", "Lampadaire / poteau", "Panneau", "Escalier", "Entrée", "Portail", "Croisement de chemins", "Bout de chemin", "Virage", "Fontaine", "Butte", "Dépression", "Talus", "Limite de végétation", "Lisière (coin)", "Objet particulier"];

function polyD(pts, close) { if (!pts || !pts.length) return ""; return "M" + pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + (close ? "Z" : ""); }
function ticksD(pts, mm, t) {
  let d = "", acc = t.gap * mm / 2;
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1], [x2, y2] = pts[i], L = Math.hypot(x2 - x1, y2 - y1); if (!L) continue;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux;
    for (; acc < L; acc += t.gap * mm) { const x = x1 + ux * acc, y = y1 + uy * acc; const l = t.len * mm; d += `M${x.toFixed(1)},${y.toFixed(1)}l${(nx * l).toFixed(1)},${(ny * l).toFixed(1)}`; if (t.both) d += `M${x.toFixed(1)},${y.toFixed(1)}l${(-nx * l).toFixed(1)},${(-ny * l).toFixed(1)}`; }
    acc -= L;
  }
  return d;
}
function pointSymbol(id, x, y, mm, rot = 0) {
  const g = (inner) => `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot}) scale(${mm})">${inner}</g>`;
  switch (id) {
    case "rocher": return g(`<path d="M0,-.55L.5,.35H-.5Z" fill="${NOIR}"/>`);
    case "gros_rocher": return g(`<path d="M0,-.9L.85,.6H-.85Z" fill="${NOIR}"/>`);
    case "butte": return g(`<circle r=".4" fill="${BRUN}"/>`);
    case "depression": return g(`<path d="M-.55,-.3A.55,.55 0 0 0 .55,-.3" fill="none" stroke="${BRUN}" stroke-width=".18"/>`);
    case "trou": return g(`<path d="M-.5,-.45L0,.4L.5,-.45" fill="none" stroke="${BRUN}" stroke-width=".18"/>`);
    case "arbre": return g(`<circle r=".7" fill="none" stroke="#2f9e3a" stroke-width=".22"/>`);
    case "buisson": return g(`<circle r=".55" fill="#2f9e3a"/>`);
    case "source": return g(`<circle r=".5" fill="none" stroke="${BLEU}" stroke-width=".2"/><path d="M.35,.35L.9,.9" stroke="${BLEU}" stroke-width=".2"/>`);
    case "objet_x": return g(`<path d="M-.5,-.5L.5,.5M.5,-.5L-.5,.5" stroke="${NOIR}" stroke-width=".22"/>`);
    case "objet_o": return g(`<circle r=".5" fill="none" stroke="${NOIR}" stroke-width=".2"/>`);
    case "poteau": return g(`<circle r=".35" fill="${NOIR}"/><path d="M-1,0H1" stroke="${NOIR}" stroke-width=".14"/>`);
    case "interdit_x": return g(`<path d="M-1.1,-1.1L1.1,1.1M1.1,-1.1L-1.1,1.1" stroke="${VIOLET}" stroke-width=".35"/>`);
    case "secours": return g(`<path d="M-.3,-1H.3V-.3H1V.3H.3V1H-.3V.3H-1V-.3H-.3Z" fill="${VIOLET}"/>`);
    case "nord": return g(`<path d="M0,-6L1.2,-3.2H.25V5H-.25V-3.2H-1.2Z" fill="${NOIR}"/><text y="-6.6" font-size="2.4" text-anchor="middle" font-family="Arial" font-weight="700">N</text>`);
  }
  return "";
}
function featureSVG(f, mm) {
  const s = SYMI[f.sym]; if (!s) return "";
  const dt = `data-f="${f.id}"`;
  if (s.k === "line") {
    const d = polyD(f.pts), D = s.draw; let out = `<path ${dt} d="${d}" fill="none" stroke="${D.c}" stroke-width="${(D.w * mm).toFixed(2)}" stroke-linejoin="round" stroke-linecap="${D.cap || "butt"}"${D.dash ? ` stroke-dasharray="${D.dash.map(v => (v * mm).toFixed(2)).join(" ")}"` : ""}/>`;
    if (D.inner) out += `<path d="${d}" fill="none" stroke="${D.inner.c}" stroke-width="${(D.inner.w * mm).toFixed(2)}" stroke-linejoin="round" pointer-events="none"/>`;
    if (D.ticks) out += `<path d="${ticksD(f.pts, mm, D.ticks)}" stroke="${D.c}" stroke-width="${(D.ticks.w * mm).toFixed(2)}" pointer-events="none"/>`;
    return out;
  }
  if (s.k === "area") { const D = s.draw; return `<path ${dt} d="${polyD(f.pts, true)}" fill="${D.pat ? `url(#pat-${D.pat})` : D.f}" ${D.s ? `stroke="${D.s}" stroke-width="${(D.sw * mm).toFixed(2)}"` : 'stroke="none"'} fill-rule="evenodd"/>`; }
  if (s.k === "point") return `<g ${dt}>${pointSymbol(s.id, f.x, f.y, mm * (f.size || 1), f.rot || 0)}<circle cx="${f.x}" cy="${f.y}" r="${mm * 1.2}" fill="transparent"/></g>`;
  if (s.k === "text") return `<text ${dt} x="${f.x}" y="${f.y}" font-size="${(3 * mm * (f.size || 1)).toFixed(1)}" font-family="Arial, sans-serif" font-weight="600" fill="${NOIR}" text-anchor="middle" dominant-baseline="middle" paint-order="stroke" stroke="#fff" stroke-width="${(.5 * mm).toFixed(1)}">${esc(f.txt)}</text>`;
  return "";
}
const patDefs = mm => `<defs>
<pattern id="pat-hachV" patternUnits="userSpaceOnUse" width="${(1.2 * mm).toFixed(2)}" height="${(1.2 * mm).toFixed(2)}" patternTransform="rotate(45)"><rect width="${(.35 * mm).toFixed(2)}" height="${(1.2 * mm).toFixed(2)}" fill="${VIOLET}"/></pattern>
<pattern id="pat-marais" patternUnits="userSpaceOnUse" width="${(2 * mm).toFixed(2)}" height="${(1 * mm).toFixed(2)}"><rect width="${(1.6 * mm).toFixed(2)}" height="${(.15 * mm).toFixed(2)}" fill="${BLEU}"/></pattern></defs>`;

// mm : taille d'un « millimètre carte » en pixels image
const mapMM = proj => (Math.max(proj.map?.w || 2000, proj.map?.h || 1400) / 297) * (proj.map?.sym || 1);

// Surimpression d'un parcours (ou de toutes les balises)
function overprintSVG(proj, opts = {}) {
  const mm = mapMM(proj), sw = (.35 * mm).toFixed(2), R = 2.5 * mm * (proj.map?.circ || 1);
  const ctrl = id => proj.controls.find(c => c.id === id);
  let out = "", items = [];
  const course = opts.course;
  if (course) {
    if (course.depart) { const c = ctrl(course.depart); if (c && c.x != null) items.push({ c, t: "S" }); }
    const bo = course.bonus || []; let ord = 0;
    course.ctrl.forEach(id => { const c = ctrl(id); const isB = bo.includes(id); if (!isB) ord++; if (c && c.x != null) items.push({ c, t: "C", bonus: isB, lab: isB ? "★" + c.n : course.mode === "ordre" ? String(ord) : String(c.n) }); });
    if (course.arrivee) { const c = ctrl(course.arrivee); if (c && c.x != null) items.push({ c, t: "F" }); }
    if (course.mode === "ordre") { // lignes de liaison (sans les bonus)
      const seq = items.filter(x => !x.bonus);
      for (let i = 1; i < seq.length; i++) {
        const k = proj.map?.circ || 1, a = seq[i - 1], b = seq[i], ra = a.t === "S" || a.t === "F" ? 3.5 * mm * k : R, rb = b.t === "F" ? 3.5 * mm * k : R;
        const dx = b.c.x - a.c.x, dy = b.c.y - a.c.y, L = Math.hypot(dx, dy); if (L < ra + rb + mm) continue;
        out += `<line x1="${(a.c.x + dx / L * (ra + .4 * mm)).toFixed(1)}" y1="${(a.c.y + dy / L * (ra + .4 * mm)).toFixed(1)}" x2="${(b.c.x - dx / L * (rb + .4 * mm)).toFixed(1)}" y2="${(b.c.y - dy / L * (rb + .4 * mm)).toFixed(1)}" stroke="${VIOLET}" stroke-width="${sw}"/>`;
      }
    }
  } else proj.controls.filter(c => c.x != null).forEach(c => items.push({ c, t: c.type, lab: String(c.n) }));
  const first = items.find(i => i.t === "C");
  items.forEach(({ c, t, lab }) => {
    const dt = `data-c="${c.id}"`, hl = opts.highlight === c.id ? ` filter="url(#glow)"` : "";
    if (t === "S") { // triangle orienté vers le 1er poste
      let ang = -90; if (first && course) ang = Math.atan2(first.c.y - c.y, first.c.x - c.x) * 180 / Math.PI;
      const r = 3.46 * mm * (proj.map?.circ || 1); out += `<g ${dt}${hl} transform="translate(${c.x},${c.y}) rotate(${ang + 90})"><path d="M0,${-r}L${r * .866},${r / 2}L${-r * .866},${r / 2}Z" fill="none" stroke="${VIOLET}" stroke-width="${sw}"/><circle r="${r}" fill="transparent"/></g>`;
    } else if (t === "F") out += `<g ${dt}${hl}><circle cx="${c.x}" cy="${c.y}" r="${R}" fill="none" stroke="${VIOLET}" stroke-width="${sw}"/><circle cx="${c.x}" cy="${c.y}" r="${R * 1.4}" fill="transparent" stroke="${VIOLET}" stroke-width="${sw}"/></g>`;
    else {
      out += `<g ${dt}${hl}><circle cx="${c.x}" cy="${c.y}" r="${R}" fill="transparent" stroke="${VIOLET}" stroke-width="${sw}"/>`;
      const a = (c.lab ?? 45) * Math.PI / 180, lx = c.x + Math.cos(a) * (R + 2.6 * mm), ly = c.y - Math.sin(a) * (R + 2.6 * mm);
      out += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="${(4 * mm * (proj.map?.txt || 1)).toFixed(1)}" fill="${VIOLET}" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="central" paint-order="stroke" stroke="#fff" stroke-width="${(.6 * mm).toFixed(1)}">${esc(lab)}</text></g>`;
    }
  });
  return out;
}
function mapSVG(proj, opts = {}) {
  const w = proj.map?.w || 2000, h = proj.map?.h || 1414, mm = mapMM(proj);
  const img = proj.map?.img ? `<image href="${proj.map.img}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none"${proj.map.fade ? ` opacity="${1 - proj.map.fade}"` : ""}/>` : `<rect width="${w}" height="${h}" fill="#fff"/>`;
  const feats = (proj.features || []).map(f => featureSVG(f, mm));
  // ordre de dessin : surfaces, lignes, points, textes, surimpression
  const order = { area: 0, line: 1, point: 2, text: 3 };
  const sorted = (proj.features || []).map((f, i) => ({ f, i, o: order[SYMI[f.sym]?.k] ?? 4, ov: SYMI[f.sym]?.grp === "Surimpression" })).filter(x => !x.ov || opts.showOverprintFeatures !== false).sort((a, b) => a.o - b.o || a.i - b.i);
  return `${patDefs(mm)}<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="${mm}" flood-color="#ffb703" flood-opacity="1"/></filter></defs>${img}<g class="feats">${sorted.filter(x => !x.ov).map(x => feats[x.i]).join("")}</g><g class="ovfeats">${sorted.filter(x => x.ov).map(x => feats[x.i]).join("")}</g><g class="over">${opts.noOverprint ? "" : overprintSVG(proj, opts)}</g>`;
}

// ---------- serveur Google Apps Script ----------
async function apiCall(url, action, payload = {}, timeout = 15000) {
  if (!url) throw new Error("Pas de serveur configuré");
  const ctl = new AbortController(); const h = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { method: "POST", body: JSON.stringify({ action, ...payload }), signal: ctl.signal, redirect: "follow" });
    const j = await r.json(); if (!j.ok) throw new Error(j.error || "Erreur du serveur"); return j;
  } catch (e) { if (e.name === "AbortError") throw new Error("Le serveur ne répond pas"); throw e; }
  finally { clearTimeout(h); }
}
const shortApi = url => { const m = String(url || "").match(/script\.google\.com\/macros\/s\/([\w-]+)\/exec/); return m ? "g:" + m[1] : url || ""; };
const longApi = s => s && s.startsWith("g:") ? `https://script.google.com/macros/s/${s.slice(2)}/exec` : s || "";

// ---------- SMS : format compact lisible par la tablette ----------
function smsResultat(run) {
  const t0 = run.start ? Math.round(run.start / 1000) : 0;
  const P = run.punches.map(p => `${p.n}${p.ok ? "" : "!"}+${Math.round((p.t - run.start) / 1000)}`).join(",");
  const parts = ["OR1", "S=" + run.s, "C=" + run.c.k, "R=" + run.r, "N=" + run.nom.replace(/[;=]/g, " "), run.cl ? "K=" + run.cl.replace(/[;=]/g, " ") : "", "D=" + t0, "P=" + P];
  if (run.finish) parts.push("F=" + Math.round((run.finish - run.start) / 1000));
  if (run.last) parts.push("G=" + run.last.lat.toFixed(5) + "," + run.last.lon.toFixed(5));
  return parts.filter(Boolean).join(";");
}
function parseSMS(text) {
  const out = [];
  String(text || "").split(/\n|(?=OR1;)/).forEach(line => {
    const i = line.indexOf("OR1;"); if (i < 0) return;
    const kv = {}; line.slice(i + 4).split(";").forEach(p => { const j = p.indexOf("="); if (j > 0) kv[p.slice(0, j).trim()] = p.slice(j + 1).trim(); });
    if (!kv.R) return;
    const t0 = (+kv.D || 0) * 1000, ev = [], r = kv.R;
    if (t0) ev.push({ id: r + "-sms-start", k: "start", t: t0, via: "sms" });
    (kv.P || "").split(",").filter(Boolean).forEach(p => { const m = p.match(/^(\d+)(!?)\+(\d+)/); if (m) ev.push({ id: `${r}-sms-${m[1]}-${m[3]}`, k: "punch", n: +m[1], ok: !m[2], t: t0 + m[3] * 1000, via: "sms" }); });
    if (kv.F) ev.push({ id: r + "-sms-fin", k: "finish", t: t0 + kv.F * 1000, via: "sms" });
    if (kv.A) { const g = parseLatLon(kv.A); ev.push({ id: r + "-sms-alerte-" + (kv.T || Date.now()), k: "alert", t: kv.T ? +kv.T * 1000 : Date.now(), la: g?.lat, lo: g?.lon, via: "sms" }); }
    if (kv.G) { const g = parseLatLon(kv.G); if (g) ev.push({ id: r + "-sms-g", k: "pos", t: kv.F ? t0 + kv.F * 1000 : Date.now(), la: g.lat, lo: g.lon, via: "sms" }); }
    out.push({ s: kv.S, r, nom: kv.N || "?", cl: kv.K || "", c: kv.C || "", ev });
  });
  return out;
}
function smsHref(tel, body) { const ios = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document; return `sms:${(tel || "").replace(/[^\d+]/g, "")}${ios ? "&" : "?"}body=${encodeURIComponent(body)}`; }

// ---------- analyse d'une course (temps intermédiaires, distances, vitesses…) ----------
// Échéance de retour : durée max depuis le départ et/ou heure limite de la leçon
function deadlineOf(course, start) { let d = null; if (course?.tm && start != null) d = start + course.tm * 60000; if (course?.hr) d = d == null ? course.hr : Math.min(d, course.hr); return d; }
const SCAN_MAX_DEFAULT = 60; // m : au-delà, le scan est jugé « suspect » (photo du QR ?)
function analyseRun(runner, course, proj, dec = {}, ack = {}, opts = {}) {
  const ev = Object.values(runner.ev || {}).sort((a, b) => a.t - b.t);
  const start = ev.find(e => e.k === "start")?.t ?? null;
  const finEv = ev.filter(e => e.k === "finish").pop(), finish = finEv?.t ?? null, abandon = ev.some(e => e.k === "abandon");
  const pos = ev.filter(e => e.k === "pos" || (e.la != null && e.k !== "alert")).filter(e => e.la != null && (e.ac == null || e.ac < 60));
  const alerts = ev.filter(e => e.k === "alert");
  const byN = {}; (course?.b || []).forEach(b => byN[b.n] = b);
  const isBonus = n => !!byN[n]?.x;
  const hasPts = (course?.b || []).some(b => b.p != null) || course?.m === "score";
  const ctrlByN = n => proj?.controls?.find(c => String(c.n) === String(n) && c.type === "C");
  const scanMax = opts.scanMax || SCAN_MAX_DEFAULT;
  const punches = ev.filter(e => e.k === "punch").map(p => {
    const inCourse = !!byN[p.n]; const d = dec[p.id];
    const status = !inCourse ? "hors" : d === false ? "refus" : d === true ? "ok" : !p.ok ? "code" : course.v === "prof" ? "attente" : "ok";
    const c = ctrlByN(p.n); let dist = null, suspect = false;
    if (c && c.lat != null && p.la != null && p.via !== "prof" && p.via !== "sms") { dist = haversine({ lat: p.la, lon: p.lo }, c); suspect = dist > scanMax + Math.min(p.ac || 0, 40); }
    return { ...p, inCourse, status, dist, suspect, bonus: isBonus(p.n) };
  });
  // premier poinçon valable par balise
  const seen = new Set(), legs = [];
  const valid = punches.filter(p => (p.status === "ok" || p.status === "attente") && !seen.has(p.n) && seen.add(p.n)).sort((a, b) => (a.via === "prof") - (b.via === "prof") || a.t - b.t);
  const seqAll = course ? course.b.filter(b => !b.x) : [];
  const targets = course ? (runner.sel && runner.sel.length && course.m !== "ordre" ? runner.sel.filter(n => !isBonus(n)) : seqAll.map(b => b.n)) : [];
  // ordre imposé sanctionné : la suite des balises du circuit doit se retrouver, dans l'ordre, parmi les poinçons
  let ordreManq = [];
  if (course?.m === "ordre" && course.so) {
    // plus longue sous-suite commune (circuit ↔ poinçons dans l'ordre chronologique) : les balises hors de cette suite sont des PM
    const A = seqAll.map(b => b.n), B = punches.filter(p => (p.status === "ok" || p.status === "attente") && !p.bonus).sort((a, b) => a.t - b.t).map(p => p.n);
    const L = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
    for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const kept = new Set(); for (let i = 0, j = 0; i < A.length && j < B.length;) { if (A[i] === B[j]) { kept.add(A[i]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    ordreManq = A.filter(n => !kept.has(n) && valid.some(v => v.n === n));
  }
  let prevT = start, prevPt = null, prevLabel = "Départ"; const doneN = new Set();
  const startCtrl = proj?.controls?.find(c => c.id === course?.depId);
  prevPt = startCtrl && startCtrl.lat != null ? { lat: startCtrl.lat, lon: startCtrl.lon } : (pos[0] ? { lat: pos[0].la, lon: pos[0].lo } : null);
  const track = (t1, t2) => { // distance GPS entre deux instants (sauts aberrants ignorés)
    if (t1 == null || t2 == null) return null;
    const P = pos.filter(p => p.t >= t1 - 1000 && p.t <= t2 + 1000); let d = 0, stop = 0;
    for (let i = 1; i < P.length; i++) { const dd = haversine({ lat: P[i - 1].la, lon: P[i - 1].lo }, { lat: P[i].la, lon: P[i].lo }), dt = (P[i].t - P[i - 1].t) / 1000; if (dt > 0 && dd / dt < 9) d += dd; if (dd < 6 && dt > 0 && dt < 120) stop += dt * 1000; }
    return P.length >= 2 ? { d, stop, n: P.length } : null;
  };
  valid.forEach(p => {
    const c = ctrlByN(p.n), pt = c && c.lat != null ? { lat: c.lat, lon: c.lon } : (p.la != null ? { lat: p.la, lon: p.lo } : null);
    let ordre = true;
    if (course?.m === "ordre" && !p.bonus) { const exp = seqAll.find(b => !doneN.has(b.n)); ordre = !exp || exp.n === p.n; doneN.add(p.n); }
    const base = { n: p.n, status: p.status, id: p.id, via: p.via, pts: byN[p.n]?.p, bonus: p.bonus, dist: p.dist, suspect: p.suspect, pm: ordreManq.includes(p.n) };
    if (p.via === "prof") { legs.push({ ...base, de: "—", t: null, split: null, cumul: null, vol: null, gps: null, stop: null, ordre: true }); return; }
    const tr = track(prevT, p.t);
    legs.push({ ...base, de: prevLabel, t: p.t, split: prevT != null ? p.t - prevT : null, cumul: start != null ? p.t - start : null, vol: haversine(prevPt, pt), gps: tr?.d ?? null, stop: tr?.stop ?? null, ordre });
    prevT = p.t; prevPt = pt || prevPt; prevLabel = String(p.n);
  });
  if (finish != null) { const fc = proj?.controls?.find(c => c.id === course?.finId); const pt = fc && fc.lat != null ? { lat: fc.lat, lon: fc.lon } : null; const tr = track(prevT, finish); legs.push({ de: prevLabel, n: "Arrivée", t: finish, split: prevT != null ? finish - prevT : null, cumul: start != null ? finish - start : null, vol: haversine(prevPt, pt), gps: tr?.d ?? null, stop: tr?.stop ?? null, status: "fin", ordre: true }); }
  const okSet = new Set(valid.filter(p => p.status === "ok").map(p => p.n));
  const found = new Set([...okSet].filter(n => !isBonus(n) && !ordreManq.includes(n)));
  const bonusFound = [...okSet].filter(isBonus).length;
  const pending = valid.filter(p => p.status === "attente" && !p.bonus).length;
  const manquants = targets.filter(n => (!okSet.has(n) && !valid.some(v => v.n === n)) || ordreManq.includes(n));
  const end = finish ?? (abandon ? ev.filter(e => e.k === "abandon").pop().t : null);
  const tot = track(start, end ?? (ev.length ? ev[ev.length - 1].t : null));
  const temps = start != null ? (end ?? Date.now()) - start : null;
  const deadline = deadlineOf(course, start);
  const retard = deadline != null && start != null ? Math.max(0, (end ?? Date.now()) - deadline) : 0;
  let points = 0, penal = 0;
  if (hasPts) { valid.filter(p => p.status === "ok" && !ordreManq.includes(p.n)).forEach(p => points += +(byN[p.n]?.p ?? (course.m === "score" ? 10 : 0))); if (retard > 0 && end != null) penal = Math.ceil(retard / 60000) * (course.pen ?? 5); }
  const last = ev.filter(e => e.la != null).pop();
  const statut = alerts.some(a => !ack[a.id]) && !finish ? "ALERTE" : abandon ? "Abandon" : start == null ? "Inscrit" : finish == null ? "En course" : manquants.length ? "PM" : pending ? "À valider" : "OK";
  return { start, finish, temps, legs, punches, found: found.size, bonusFound, bonusTotal: (course?.b || []).filter(b => b.x).length, pending, total: targets.length, manquants, ordreManq, erreurs: punches.filter(p => p.status === "hors" || p.status === "code" || p.status === "refus").length, ordreErr: legs.filter(l => !l.ordre).length, suspects: punches.filter(p => p.suspect && (p.status === "ok" || p.status === "attente")).length, dist: tot?.d ?? null, stop: tot?.stop ?? null, vitesse: tot?.d && temps ? tot.d / (temps / 1000) * 3.6 : null, alerts, last, statut, hasPts, points, penal, score: points - penal, deadline, retard, lastSeen: ev.length ? Math.max(...ev.map(e => e.rt || e.t)) : null };
}
