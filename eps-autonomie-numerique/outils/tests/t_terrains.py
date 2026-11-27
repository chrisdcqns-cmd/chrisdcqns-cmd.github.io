# 🏟 Écrans de suivi par terrains (un seul écran de suivi par activité) : Volley 3 terrains, Badminton 5 (2 de chaque côté, 1 au centre), Basket 2.
# Appel d'élève en tête et sur son terrain, « J'y vais », pas de « Pilotage de leçon » en double, ⚡ repères rapides toujours accessibles.
# python3 t_terrains.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json, os
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8848", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8848/eps-autonomie-numerique/"; CL = "2GT1 TEST"
NOMS = ["Lina MARTIN", "Noah PETIT", "Emma DURAND", "Hugo LEROY", "Jade MOREAU", "Louis SIMON", "Tom ROUX", "Ines FAURE"]
SEED = "try{localStorage.setItem('eps.share.v1',JSON.stringify({url:'http://127.0.0.1:1/exec',key:'CLE'}));if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'" + CL + "',el:" + json.dumps(NOMS) + ",u:1}},pend:{},since:0}));localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}"
FAKE = "(function(){var V=JSON.parse(localStorage.getItem('eps.sig.v1')||'{\"items\":{},\"pend\":{}}');V.items['call|x1']={id:'call|x1',k:'call',app:'%s',cls:'" + CL + "',who:[],eq:'Les Aigles',tab:'',lieu:'Terrain 2',motif:'🆘 Je suis bloqué',at:Date.now()-90000,st:0,from:'x1',u:Date.now()};localStorage.setItem('eps.sig.v1',JSON.stringify(V));})()"
APPS = [("volley", 3, "vert"), ("badminton", 5, "bad5"), ("basket", 2, "duo")]
async def main():
    out = []; errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(SEED)
        for app, n, dispo in APPS:
            p = await c.new_page(); p.on("pageerror", lambda x, a=app: errs.append(a + " " + str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
            await p.goto(B + app + "/"); await p.wait_for_timeout(4500); await p.evaluate(FAKE % app)
            acts = await p.evaluate("EPSLC.actions().map(function(a){return a.label}).join('|')")
            out.append((app + " : pas de « Pilotage de leçon » en double, ⚡ repères rapides gardés", "Pilotage de leçon" not in acts and "Repères rapides" in acts, acts))
            await p.evaluate("EPSLC.controle({cls:'" + CL + "'})"); await p.wait_for_timeout(1000)
            if app == "badminton": await p.evaluate("(function(){var c=C();c.groupes=c.groupes||{};['A','B','C','D','E','F'].forEach(function(n,i){c.groupes['g'+i]={id:'g'+i,nom:'Groupe '+n,el:[]}});terrAuto()})()"); await p.wait_for_timeout(500)
            r = await p.evaluate("(function(){var g=document.querySelector('.epsct'),T=[].slice.call(document.querySelectorAll('.epsct-t'));return {n:T.length,cl:g?g.className:'',noms:T.map(function(t){return t.querySelector('.epsct-h').childNodes[0].textContent.trim()}),call:T.filter(function(t){return t.classList.contains('call')}).map(function(t){return t.innerText}).join('|'),pos:T.map(function(t){var q=t.getBoundingClientRect();return [Math.round(q.left),Math.round(q.top),Math.round(q.width),Math.round(q.height)]}),lc:!!(document.getElementById('lc-ctl')&&document.getElementById('lc-ctl').style.display!=='none'),ap:document.querySelectorAll('[data-eps-appels] [data-eps-call]').length}})()")
            out.append((app + " : %d terrains numérotés, disposition « %s », dans l'écran de l'appli" % (n, dispo), r["n"] == n and dispo in r["cl"] and not r["lc"] and all(("Terrain %d" % (i + 1)) in r["noms"][i] for i in range(n)), r))
            out.append((app + " : l'appel est en tête et sur le terrain 2 (motif affiché)", r["ap"] == 1 and "Terrain 2" in r["call"] and "bloqué" in r["call"], r["call"]))
            if app == "badminton":
                P = r["pos"]; out.append(("badminton : 2 terrains de chaque côté en parallèle (1-2 à gauche, 4-5 à droite), le 3 au centre et à la verticale", P[0][0] == P[1][0] and P[3][0] == P[4][0] and P[0][0] < P[2][0] < P[3][0] and P[0][1] == P[3][1] and P[2][3] > P[2][2] and P[0][2] > P[0][3], P))
                out.append(("badminton : les 5 terrains ont la même taille (le 3 est le même terrain tourné)", all(abs(P[i][2] - P[0][2]) <= 1 and abs(P[i][3] - P[0][3]) <= 1 for i in (1, 3, 4)) and abs(P[2][2] - P[0][3]) <= 1 and abs(P[2][3] - P[0][2]) <= 1, P))
                hd = await p.evaluate("document.querySelector('#t-live .livehd').getBoundingClientRect().height"); out.append(("badminton : bandeau « Leçon en direct » sur une seule ligne", hd <= 60, hd))
            if app == "volley":
                P = r["pos"]; out.append(("volley : 3 terrains à la verticale, côte à côte, de même taille", P[0][1] == P[1][1] == P[2][1] and P[0][0] < P[1][0] < P[2][0] and all(q[3] > q[2] and q[2] == P[0][2] and q[3] == P[0][3] for q in P), P))
            if app == "basket":
                P = r["pos"]; out.append(("basket : 2 terrains côte à côte", P[0][1] == P[1][1] and P[0][0] < P[1][0], P))
            if SHOTS: await p.screenshot(path=os.path.join(SHOTS, "terrains-" + app + ".png"))
            await p.click("[data-eps-call]"); await p.wait_for_timeout(500)
            st = await p.evaluate("JSON.parse(localStorage.getItem('eps.sig.v1')).items['call|x1'].st"); out.append((app + " : « J'y vais » pris en compte depuis cet écran", st == 1, st))
            # 🚫 fermer le terrain 2 depuis « 🏟 Terrains » : grisé à sa place, écarté des répartitions
            await p.click(".epsct-cfg button"); await p.wait_for_timeout(300); await p.click(".epsd-ov [data-k='2']"); await p.wait_for_timeout(400); await p.click(".epsd-ov [data-x]"); await p.wait_for_timeout(400)
            f = await p.evaluate("({off:EPSD.courtsOff('%s'),fer:[].map.call(document.querySelectorAll('.epsct-t.ferme'),function(t){return t.innerText.replace(/\\s+/g,' ')}),n:document.querySelectorAll('.epsct-t').length,btn:document.querySelector('.epsct-cfg button').innerText})" % app)
            out.append((app + " : terrain 2 fermé, grisé à sa place, les autres inchangés", f["off"] == [2] and len(f["fer"]) == 1 and "Terrain 2" in f["fer"][0] and f["n"] == n and "1 fermé" in f["btn"], f))
            if app == "badminton":
                g = await p.evaluate("(function(){terrAuto();return Object.values(C().terr.g)})()"); out.append(("badminton : la répartition automatique n'envoie plus personne sur le terrain fermé", len(g) == 6 and 2 not in g, g))
            if app == "basket":
                g = await p.evaluate("(function(){var j=jour(clsProf());return [terA(j),terN(j,0),terN(j,1)]})()"); out.append(("basket : un seul terrain utilisé, le match se joue sur le terrain 1", g[0] == [1] and g[1] == 1, g))
            if app == "volley":
                g = await p.evaluate("terOffV()"); out.append(("volley : le terrain 2 n'est plus proposé aux équipes ni dans le plan", g == [2], g))
            await p.evaluate("EPSLC.reperes({cls:'" + CL + "'})"); await p.wait_for_timeout(300); nb = await p.locator("#lc-rep [data-r]").count(); await p.locator("#lc-rep [data-r]").first.click(); await p.wait_for_timeout(300)
            out.append((app + " : ⚡ repères rapides : un élève puis la palette", nb == 8 and await p.locator("#lc-ico [data-i]").count() >= 3, nb)); await p.close()
        await b.close()
    print("\n".join(("✅ " if o[1] else "❌ ") + o[0] + ("" if o[1] else "  → " + str(o[2])) for o in out)); print("erreurs de page :", errs or "aucune")
    return all(o[1] for o in out) and not errs
try: ok = asyncio.run(main())
finally: srv.terminate()
sys.exit(0 if ok else 1)
