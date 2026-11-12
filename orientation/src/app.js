// ===== Scanner de QR code (caméra) =====
let jsQRLoading = null;
async function openScanner(onText) {
  const d = document.createElement("div"); d.id = "scanner";
  d.innerHTML = `<video playsinline muted></video><div class="frame"></div><div class="bar"><button class="btn alt" id="scClose">Fermer</button><button class="btn sun" id="scTorch" class="hidden">🔦</button></div><p style="position:absolute;top:12px;left:0;right:0;text-align:center;color:#fff;font-weight:700;text-shadow:0 1px 4px #000">Vise le QR code de la balise</p>`;
  document.body.appendChild(d);
  const video = d.querySelector("video"); let stream = null, stop = false, det = null;
  const close = () => { stop = true; stream?.getTracks().forEach(t => t.stop()); d.remove(); };
  d.querySelector("#scClose").onclick = close;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
    video.srcObject = stream; await video.play();
    const track = stream.getVideoTracks()[0]; const caps = track.getCapabilities?.() || {};
    const tb = d.querySelector("#scTorch"); if (caps.torch) { let on = false; tb.onclick = () => { on = !on; track.applyConstraints({ advanced: [{ torch: on }] }); }; } else tb.remove();
  } catch (e) { close(); toast("Caméra indisponible : " + (e.name === "NotAllowedError" ? "autorise l'accès à la caméra, ou utilise « Saisir un code »." : e.message), "ko"); return; }
  if ("BarcodeDetector" in window) { try { const f = await BarcodeDetector.getSupportedFormats(); if (f.includes("qr_code")) det = new BarcodeDetector({ formats: ["qr_code"] }); } catch (e) {} }
  if (!det && !window.jsQR) { try { jsQRLoading = jsQRLoading || loadScript("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"); await jsQRLoading; } catch (e) { toast("Lecteur QR indisponible hors connexion : utilise l'appareil photo du téléphone ou « Saisir un code ».", "ko"); } }
  const cv = document.createElement("canvas"), cx = cv.getContext("2d", { willReadFrequently: true });
  const loop = async () => {
    if (stop) return;
    try {
      let txt = null;
      if (det) { const r = await det.detect(video); if (r[0]) txt = r[0].rawValue; }
      else if (window.jsQR && video.videoWidth) { const s = Math.min(1, 800 / video.videoWidth); cv.width = video.videoWidth * s; cv.height = video.videoHeight * s; cx.drawImage(video, 0, 0, cv.width, cv.height); const im = cx.getImageData(0, 0, cv.width, cv.height); const r = jsQR(im.data, im.width, im.height, { inversionAttempts: "dontInvert" }); if (r) txt = r.data; }
      if (txt) { navigator.vibrate?.(60); if (onText(txt) !== false) return close(); await sleep(1200); }
    } catch (e) {}
    setTimeout(loop, 180);
  };
  loop();
}

// ===== Navigation =====
function showScreen(id) { ["home", "prof", "eleve"].forEach(s => $("#" + s).classList.toggle("hidden", s !== id)); window.scrollTo(0, 0); }
function showHome() {
  showScreen("home"); $("#ver").textContent = APP_VERSION;
  const r = loadRun();
  $("#homeResume").innerHTML = r && r.start && !r.finish && !r.abandon ? `<div class="panel" style="background:var(--orange);color:#fff"><b>Course en cours : ${esc(r.c.k)} · ${esc(r.nom)}</b> <button class="btn small alt" id="hRes">Reprendre</button></div>` : "";
  $("#hRes") && ($("#hRes").onclick = () => studentEntry());
}
function route() {
  const h = location.hash;
  let m = h.match(/#go=([\w-]+)/);
  if (m) { try { const g = b64d(m[1]); return studentEntry(g); } catch (e) { toast("QR code de départ illisible", "ko"); } }
  m = h.match(/#b=([\w%-]+)\.([A-Za-z0-9]+)/);
  if (m) {
    history.replaceState(null, "", location.pathname);
    const r = loadRun();
    if (r && r.start && !r.finish && !r.abandon) { showScreen("eleve"); runScreen(); setTimeout(() => handlePunch(decodeURIComponent(m[1]), m[2].toUpperCase(), "photo"), 300); return; }
    if (r && r.s && !r.start && String(decodeURIComponent(m[1])) === String(r.c.dn)) { showScreen("eleve"); readyScreen(); setTimeout(() => startFromCode(m[2].toUpperCase(), "photo"), 300); return; }
    showScreen("eleve"); welcomeScreen(); toast("Balise " + decodeURIComponent(m[1]) + " : ouvre d'abord ton parcours avec le QR de départ.", "ko"); return;
  }
  const r = loadRun();
  if (/#eleve/.test(h)) { history.replaceState(null, "", location.pathname); return studentEntry(); }
  if (r && r.start && !r.finish && !r.abandon) return studentEntry();
  showHome();
}
$("#goEleve").onclick = () => studentEntry();
$("#goProf").onclick = () => tpw() ? openProf() : profLogin();
$("#profHome").onclick = () => { stopMyPos(); showHome(); };
$$("#ptabs .tab").forEach(b => b.onclick = () => setPTab(b.dataset.t));
window.addEventListener("hashchange", route);
route();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
