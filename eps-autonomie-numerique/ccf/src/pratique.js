/* ================== FORME DE PRATIQUE (tablettes des élèves ; l'enseignant ouvre la même feuille pour corriger) ==================
   PX = contexte de la feuille affichée : {act, cls, c, S, P, J, t (équipe), teach} */
let PX=null,SUB=lget('ccf.sub',{});
function setSub(s){SUB[PX.act]=s;lset('ccf.sub',SUB);render()}
const tmIdOf=()=>'tm:'+PX.act+':'+PX.cls+':'+PX.t.id;
function F0(){return get(tmIdOf())||{}}
function tmUpd(f,keep){upd(tmIdOf(),{},f);if(!keep)render()}
function subTabs(L){const cur=SUB[PX.act]||L[0][0];return `<div class="subt">${L.map(([k,l])=>`<button class="${cur===k?'on':''}" onclick="setSub('${k}')">${l}</button>`).join('')}</div>`}
function curSub(L){const s=SUB[PX.act];return L.some(x=>x[0]===s)?s:L[0][0]}
function praHtml(ctx){PX=ctx;if(!ctx.t)return '<p class="mut">Choisis d\'abord ton équipe (onglet « Mon équipe »).</p>';
 return ctx.act==='esc'?escHtml():ctx.act==='bad'?badHtml():ctx.act==='ori'?coHtml():ctHtml()}
function memNames(){return (PX.t.el||[]).map(k=>({k,n:pfirst(PX.c,k),f:pname(PX.c,k)}))}

/* ================== ESCALADE ================== */
const ESC_SUB=[['projet','1 · Projet d\'équipe'],['grimpe','2 · Passages'],['score','3 · Score']];
function escF(){const F=clone(F0());F.voies=F.voies||{A:'',B:''};F.pass=F.pass||[];const ks=PX.t.el||[];
 ks.forEach(k=>{if(!F.pass.some(p=>p.el===k))F.pass.push({el:k,voie:'A',zone:null,bonus:[{z:null,rep:'',ok:null},{z:null,rep:'',ok:null}],dg:null,asr:'',cas:'',obs:'',fus:0,done:false})});
 F.pass=F.pass.filter(p=>ks.includes(p.el));return F}
function escRegLeft(F){const J=PX.J;if(!F.t1)return null;return F.t1+J.regul*60000-Date.now()}
function escCanEdit(F,p){if(PX.teach)return true;if(p&&p.done)return false;if(!+PX.J.verrou)return true;const L=escRegLeft(F);return L==null||L>0||!!F.unlock}
function escHtml(){const J=PX.J,F=escF(),s=curSub(ESC_SUB);let h=subTabs(ESC_SUB);
 const zl=z=>['','Sol → D'+J.b1,'D'+J.b1+' → D'+J.b2,'D'+J.b2+' → D'+J.b3,'D'+J.b3+' → TOP'][z];
 const zp=z=>[0,J.z1,J.z2,J.z3,J.z4][z]+(z===4?' + '+J.top:'');
 if(s==='projet'){const L=escRegLeft(F);
  h+=`<div class="row wrapf">${tmHtml('escp','Projet d\'équipe',J.projet*60)}${tmHtml('esct','Temps de l\'équipe',J.dureeEq*60)}</div>
  ${L!=null?`<div class="card ${L>0||F.unlock?'soft':'warn'}">${L>0?`⏱ Régulation : il reste <b data-reg>${tmFmt(L/1000)}</b> pour modifier les projets de ceux qui n'ont pas grimpé.`:F.unlock?'🔓 Projets rouverts par l\'enseignant.':'🔒 Temps de régulation terminé : les projets sont verrouillés.'}</div>`:''}
  <div class="card"><b>Voies tirées au sort</b><div class="g2"><label>Voie A<input value="${esc(F.voies.A)}" placeholder="ex. corde 3, bleue" onchange="escSet(F=>F.voies.A=this.value)"></label><label>Voie B<input value="${esc(F.voies.B)}" placeholder="ex. corde 5, jaune" onchange="escSet(F=>F.voies.B=this.value)"></label></div></div>
  <p class="mut">Pour chaque grimpeur, dans l'ordre de passage : la voie, la zone à atteindre et ${J.bonusN} prises bonus (1 seule si la zone 1 est visée). Points de zone : ${esc(jeuTxt('esc','exact',J.exact))} ; ${esc(jeuTxt('esc','cumul',J.cumul))}. Prise bonus utilisée = +${J.bonusVal} × coef de sa zone, oubliée : ${esc(jeuTxt('esc','bonusNeg',J.bonusNeg))}.</p>`;
  F.pass.forEach((p,i)=>{const ed=escCanEdit(F,p),nb=escNbBonus(J,p.zone);
   h+=`<div class="card pj${p.done?' done':''}"><div class="row"><b class="num">${i+1}</b><b style="flex:1">${esc(pname(PX.c,p.el))}</b>${ed&&!p.done?`<button class="b s" onclick="escMove(${i},-1)" ${i?'':'disabled'}>↑</button><button class="b s" onclick="escMove(${i},1)" ${i<F.pass.length-1?'':'disabled'}>↓</button>`:''}${p.done?'<span class="pill ok">a grimpé</span>':''}</div>
   <div class="row wrapf"><span class="lab">Voie</span>${['A','B'].map(v=>`<button class="b s${p.voie===v?' p':''}" ${ed?'':'disabled'} onclick="escP(${i},p=>p.voie='${v}')">${v}${F.voies[v]?' · '+esc(F.voies[v]):''}</button>`).join('')}</div>
   <div class="zs">${[1,2,3,4].map(z=>`<button class="zb${+p.zone===z?' on':''}" ${ed?'':'disabled'} onclick="escP(${i},p=>p.zone=${z})"><b>Z${z}${z===4?' · TOP':''}</b><small>${zl(z)}</small><i>${zp(z)} pts</i></button>`).join('')}</div>
   ${p.zone?`<div class="bon">${[0,1].slice(0,nb).map(j=>{const b=(p.bonus||[])[j]||{};return `<div class="bo"><span class="lab">Prise bonus ${j+1}</span>${[1,2,3,4].map(z=>`<button class="b s${+b.z===z?' p':''}" ${ed?'':'disabled'} onclick="escB(${i},${j},b=>b.z=${z})">Z${z} ×${z}</button>`).join('')}<input placeholder="repère (couleur, forme…)" value="${esc(b.rep||'')}" ${ed?'':'disabled'} onchange="escB(${i},${j},b=>b.rep=this.value,1)"></div>`}).join('')}</div>`:''}
   <div class="mut sm">Points prévus : <b>${escPrevu(J,p)}</b></div>${repInline(p.el)}</div>`});
  h+=`<div class="card big">Total prévu de l'équipe : <b>${F.pass.reduce((s,p)=>s+escPrevu(J,p),0)} pts</b></div>`}
 if(s==='grimpe'){const i=PX.gi!=null?PX.gi:F.pass.findIndex(p=>!p.done),p=F.pass[i];
  h+=`<div class="chips">${F.pass.map((q,j)=>`<button class="chip${j===i?' on':''}" onclick="PX.gi=${j};render()">${j+1}. ${esc(pfirst(PX.c,q.el))} ${q.done?'✓':''}</button>`).join('')}</div>`;
  if(!p)h+=`<div class="card soft">Tous les grimpeurs sont passés. Va voir le score.</div>`;
  else{const others=memNames().filter(x=>x.k!==p.el),r=escPts(J,p),ed=PX.teach||!p.done;
   h+=`<div class="card"><h3 class="h3">${esc(pname(PX.c,p.el))} · voie ${esc(p.voie||'?')}${F.voies[p.voie]?' ('+esc(F.voies[p.voie])+')':''} · vise Z${p.zone||'?'}</h3>
   <div class="row wrapf">${tmHtml('esce'+i,'Échauffement sur la voie',J.echauf)}${tmHtml('escg'+i,'Grimpe',0,true)}</div>
   ${[['asr','Assureur'],['cas','Contre-assureur'],['obs','Observateur']].map(([k,l])=>`<div class="row wrapf"><span class="lab">${l}</span>${others.map(x=>`<button class="b s${p[k]===x.k?' p':''}" ${ed?'':'disabled'} onclick="escP(${i},p=>p.${k}=p.${k}==='${x.k}'?'':'${x.k}')">${esc(x.n)}</button>`).join('')}</div>`).join('')}
   <p class="lab" style="margin-top:12px">Hauteur atteinte : dernière dégaine dépassée par le bassin</p>
   <div class="dgs">${Array.from({length:J.nDeg+2},(_,d)=>`<button class="dgb${+p.dg===d&&p.dg!==null?' on':''}${[J.b1,J.b2,J.b3,J.nDeg+1].includes(d)?' bz':''}" ${ed?'':'disabled'} onclick="escP(${i},p=>p.dg=${d})">${d===0?'sous D1':d>J.nDeg?'TOP':'D'+d}</button>`).join('')}</div>
   ${(p.bonus||[]).slice(0,escNbBonus(J,p.zone)).map((b,j)=>b&&b.z?`<div class="row wrapf"><span class="lab">Prise bonus ${j+1} · Z${b.z} ${esc(b.rep||'')}</span><button class="b s${b.ok===true?' p':''}" ${ed?'':'disabled'} onclick="escB(${i},${j},b=>b.ok=true)">✅ utilisée (+${J.bonusVal*b.z})</button><button class="b s${b.ok===false?' p':''}" ${ed?'':'disabled'} onclick="escB(${i},${j},b=>b.ok=false)">❌ oubliée (${+J.bonusNeg?'−'+J.bonusVal*b.z:'0'})</button></div>`:'').join('')}
   <div class="row wrapf"><span class="lab">Fusibles sautés (assurage)</span><button class="b s" ${ed?'':'disabled'} onclick="escP(${i},p=>p.fus=Math.max(0,(+p.fus||0)-1))">−</button><b class="big">${+p.fus||0}</b><button class="b s" ${ed?'':'disabled'} onclick="escP(${i},p=>p.fus=(+p.fus||0)+1)">+</button></div>
   <div class="card soft big">Zone atteinte : <b>${r.zr==null?'—':r.zr?'Z'+r.zr:'aucune'}</b> · points de zone <b>${r.zone}</b> · bonus <b>${r.bonus>=0?'+':''}${r.bonus}</b> · total <b>${r.tot}</b></div>
   <div class="row end">${p.done?(PX.teach?`<button class="b" onclick="escP(${i},p=>p.done=false)">↺ Rouvrir le passage</button>`:'<span class="pill ok">Passage enregistré</span>'):`<button class="b p" onclick="escDone(${i})" ${p.dg==null||!p.asr||!p.cas?'disabled':''}>✓ Passage terminé</button>`}</div>
   ${p.dg==null||!p.asr||!p.cas?'<p class="mut sm">Pour valider : la hauteur atteinte, l\'assureur et le contre-assureur.</p>':''}</div>`}}
 if(s==='score'){const tot=F.pass.reduce((a,p)=>a+escPts(J,p).tot,0),prev=F.pass.reduce((a,p)=>a+escPrevu(J,p),0);
  h+=`<div class="tblw"><table class="tbl"><thead><tr><th>Grimpeur</th><th>Voie</th><th>Vise</th><th>Atteint</th><th>Zone</th><th>Bonus</th><th>Total</th></tr></thead><tbody>${F.pass.map(p=>{const r=escPts(J,p);return `<tr><td>${esc(pname(PX.c,p.el))}</td><td>${esc(p.voie||'')}</td><td>${p.zone?'Z'+p.zone:'—'}</td><td>${dgTxt(J,p.dg)}</td><td>${p.done||p.dg!=null?r.zone:'—'}</td><td>${p.done||p.dg!=null?(r.bonus>=0?'+':'')+r.bonus:'—'}</td><td><b>${p.done||p.dg!=null?r.tot:'—'}</b></td></tr>`}).join('')}</tbody></table></div>
  <div class="card big">Score de l'équipe : <b>${tot} pts</b> <span class="mut">(projet : ${prev} pts)</span></div>
  ${PX.teach?`<div class="row wrapf"><button class="b" onclick="tmUpd(F=>{F.unlock=!F.unlock})">${F.unlock?'🔒 Reverrouiller':'🔓 Rouvrir'} les projets</button></div>`:''}`}
 return h}
function escSave(F,keep){tmUpd(o=>{Object.keys(o).forEach(k=>delete o[k]);Object.assign(o,F)},keep)}
function escSet(f){const F=escF();f(F);escSave(F,1)}
function escP(i,f){const F=escF();f(F.pass[i]);escSave(F)}
function escB(i,j,f,keep){const F=escF(),p=F.pass[i];p.bonus=p.bonus||[];p.bonus[j]=p.bonus[j]||{z:null,rep:'',ok:null};f(p.bonus[j]);escSave(F,keep)}
function escMove(i,d){const F=escF(),j=i+d;if(j<0||j>=F.pass.length)return;const x=F.pass[i];F.pass[i]=F.pass[j];F.pass[j]=x;escSave(F)}
function escDone(i){const F=escF();F.pass[i].done=true;F.pass[i].t=Date.now();if(!F.t1)F.t1=Date.now();PX.gi=null;escSave(F);toast('Passage enregistré'+(F.pass.filter(p=>p.done).length===1?' · régulation ouverte '+PX.J.regul+' min':''))}
setInterval(()=>{const el=document.querySelector('[data-reg]');if(el&&PX&&PX.act==='esc'){const L=escRegLeft(F0());if(L!=null){if(L<=0)render();else el.textContent=tmFmt(L/1000)}}},1000);

/* ================== BADMINTON ================== */
const BAD_SUB=[['panel','1 · Mon panel'],['matchs','2 · Matchs'],['class','3 · Classement']];
function badHtml(){const J=PX.J,s=curSub(BAD_SUB);let h=subTabs(BAD_SUB);
 if(s==='panel'){const mem=memNames(),me=PX.pm&&mem.some(x=>x.k===PX.pm)?PX.pm:(mem[0]||{}).k,ix=me?ixOf(PX.act,PX.cls,me):{},L=ix.strat||[];
  h+=`<div class="row wrapf">${tmHtml('badp','Création du panel',J.tPanel*60)}</div><p class="mut">Chaque joueur crée un panel de ${J.nStrat} stratégies de zones : touche les zones visées (terrain adverse, découpé en 6 zones). Le coach piochera dedans pendant le match. Garde-les secrètes !</p>
  <div class="chips">${mem.map(x=>`<button class="chip${x.k===me?' on':''}" onclick="PX.pm='${x.k}';render()">${esc(x.n)}</button>`).join('')}</div>
  ${me?repInline(me):''}<div class="strats">${Array.from({length:J.nStrat},(_,i)=>{const st=L[i]||{z:[],n:''};return `<div class="card st"><div class="row"><b>Stratégie ${i+1}</b><input placeholder="nom (facultatif)" value="${esc(st.n||'')}" onchange="badStrat('${me}',${i},s=>s.n=this.value,1)"></div><div class="cw" data-strat="${i}" data-me="${me}">${courtSvg(J,{sel:st.z,click:1})}</div><small class="mut">${zonesTxt(st.z)}</small></div>`}).join('')}</div>`}
 if(s==='matchs'){const M=badMatches(PX.cls),mine=M.filter(m=>(m.a||{}).eq===PX.t.id||(m.b||{}).eq===PX.t.id),others=M.filter(m=>!mine.includes(m));
  h+=`<div class="row wrapf">${tmHtml('bado','Organisation des matchs',J.tOrga*60)}<button class="b p" onclick="badNew()">➕ Organiser un match</button></div><p class="mut">Choisissez qui joue contre qui dans le groupe adverse pour remporter l'ensemble des matchs.</p>
  <h3 class="h3">Nos matchs</h3>${badList(mine)}${others.length?`<h3 class="h3">Les autres matchs</h3>${badList(others)}`:''}`}
 if(s==='class')h+=badRankHtml(J,PX.S,PX.cls,PX.t.g);
 return h}
function eqNom(S,id){return ((S.eq||[]).find(x=>x.id===id)||{}).nom||'?'}
function badList(M){const J=PX.J,S=PX.S;if(!M.length)return '<p class="mut">Aucun match.</p>';
 return `<div class="mlist">${M.map(m=>{const R=badCalc(J,m);return `<button class="mrow" onclick="badOpen('${m.id}')"><b>${esc(eqNom(S,(m.a||{}).eq))}</b> <span>contre</span> <b>${esc(eqNom(S,(m.b||{}).eq))}</b><small>${m.fin?'Terminé · '+R.sets.map(x=>x.join('-')).join(' / '):m.ph&&m.ph!=='prep'?'En cours · set '+(R.set+1)+' : '+R.cur.join('-'):'Prévu'}${m.arb?' · arbitre : '+esc(pfirst(PX.c,m.arb)):''}</small></button>`}).join('')}</div>`}
function badRankHtml(J,S,cls,g){const R=badRanking(J,S,cls),G=[...new Set(R.map(x=>x.t.g||''))].sort();
 return G.map(gr=>`<h3 class="h3">${gr?'Poule '+esc(gr):'Classement'}</h3><div class="tblw"><table class="tbl"><thead><tr><th>#</th><th>Binôme</th><th>Joués</th><th>Victoires</th><th>Nuls</th><th>Points marqués</th></tr></thead><tbody>${R.filter(x=>(x.t.g||'')===gr).map((x,i)=>`<tr${PX&&PX.t&&x.t.id===PX.t.id?' class="me"':''}><td>${i+1}</td><td>${esc(x.t.nom)}</td><td>${x.j}</td><td><b>${x.v}</b></td><td>${x.n}</td><td>${x.pts}</td></tr>`).join('')}</tbody></table></div>`).join('')||'<p class="mut">Aucun binôme.</p>'}
function badStrat(k,i,f,keep){upd(ixId(PX.act,PX.cls,k),{},o=>{o.strat=o.strat||[];o.strat[i]=o.strat[i]||{z:[],n:''};f(o.strat[i])});if(!keep)render()}
document.addEventListener('click',e=>{const g=e.target.closest('.cw[data-strat] [data-z]');if(!g)return;const w=g.closest('.cw'),z=+g.dataset.z;badStrat(w.dataset.me,+w.dataset.strat,s=>{s.z=s.z||[];s.z=s.z.includes(z)?s.z.filter(x=>x!==z):s.z.concat(z)})});
function badNew(){const S=PX.S,me=PX.t,opp=(S.eq||[]).filter(t=>t.id!==me.id&&(!me.g||!t.g||t.g===me.g));
 if(!opp.length){toast('Pas d\'autre binôme dans la poule');return}
 const d=modal(`<h3>Organiser un match</h3><p class="lab">Adversaire</p><div class="chips">${opp.map(t=>`<button class="chip" data-o="${t.id}">${esc(t.nom)}</button>`).join('')}</div><p class="lab">Arbitre (un élève d'une équipe qui ne joue pas)</p><div class="chips" id="arbs"></div><div class="row end"><button class="b" data-x>Annuler</button><button class="b p" id="mok" disabled>✓ Créer le match</button></div>`,{wide:1});
 let o=null,a='';const arbs=()=>{const no=[me.id,o];d.querySelector('#arbs').innerHTML=(S.eq||[]).filter(t=>!no.includes(t.id)).flatMap(t=>t.el||[]).map(k=>`<button class="chip${a===k?' on':''}" data-a="${k}">${esc(pfirst(PX.c,k))}</button>`).join('')||'<span class="mut">—</span>'};arbs();
 d.addEventListener('click',e=>{const b=e.target.closest('[data-o],[data-a]');if(!b)return;if(b.dataset.o){o=b.dataset.o;d.querySelectorAll('[data-o]').forEach(x=>x.classList.toggle('on',x===b))}else a=b.dataset.a;arbs();d.querySelector('#mok').disabled=!o});
 d.querySelector('#mok').onclick=()=>{const id='m'+uid();put('mt:'+PX.cls+':'+id,{id,t:Date.now(),a:{eq:me.id},b:{eq:o},arb:a,ph:'prep',pts:[],strat:{a:[],b:[]},guess:{},tm:{a:[],b:[]},org:me.id});d.remove();badOpen(id)}}
function badOpen(id){MATCH=id;render()}

/* ---------- tablette de match ---------- */
let MATCH=null;
function mId(){return 'mt:'+PX.cls+':'+MATCH}
function mUpd(f){upd(mId(),{},f);render()}
function matchHtml(){const J=PX.J,S=PX.S,m=get(mId());if(!m){MATCH=null;return ''}const R=badCalc(J,m),nA=eqNom(S,m.a.eq),nB=eqNom(S,m.b.eq),side={a:nA,b:nB};
 const tA=(S.eq||[]).find(x=>x.id===m.a.eq)||{el:[]},tB=(S.eq||[]).find(x=>x.id===m.b.eq)||{el:[]},TS={a:tA,b:tB};
 let h=`<div class="match"><div class="row"><button class="b" onclick="MATCH=null;render()">← Matchs</button><h2 class="h2" style="flex:1;margin:0">${esc(nA)} <span class="mut">contre</span> ${esc(nB)}</h2>${PX.teach?`<button class="b s" onclick="badDel()">🗑 Supprimer</button>`:''}</div>`;
 const ph=m.fin?'fin':m.ph||'prep';
 if(ph==='prep'){h+=`<p class="mut">Pour chaque binôme : qui joue, qui coache ?</p>${['a','b'].map(s=>`<div class="card"><b>${esc(side[s])}</b><div class="row wrapf"><span class="lab">Joueur</span>${(TS[s].el||[]).map(k=>`<button class="b s${m[s].j===k?' p':''}" onclick="mUpd(m=>{m.${s}.j='${k}';const o=(${JSON.stringify(TS[s].el||[]).replace(/"/g,"'")}).filter(x=>x!=='${k}');if(o.length===1)m.${s}.c=o[0]})">${esc(pfirst(PX.c,k))}</button>`).join('')}</div>
  <div class="row wrapf"><span class="lab">Coach</span>${(TS[s].el||[]).map(k=>`<button class="b s${m[s].c===k?' p':''}" onclick="mUpd(m=>{m.${s}.c='${k}'})">${esc(pfirst(PX.c,k))}</button>`).join('')}</div></div>`).join('')}
  <div class="row end"><button class="b p" ${m.a.j&&m.b.j?'':'disabled'} onclick="mUpd(m=>{m.ph='choixa'})">Choix des stratégies (${J.tChoix} min) ▶</button></div>`}
 else if(ph==='choixa'||ph==='choixb'||ph==='tma'||ph==='tmb'||ph==='entrea'||ph==='entreb'){const s=ph.slice(-1),o=s==='a'?'b':'a',x=m[s],ix=ixOf(PX.act,PX.cls,x.j),L=(ix.strat||[]).filter(st=>st&&(st.z||[]).length),cur=badStratAt(m,s,(m.pts||[]).length);
  const start=ph.indexOf('choix')===0,tm=ph.indexOf('tm')===0;
  h+=`<div class="secret"><p class="big">🤫 <b>${esc(side[o])}</b> ne regarde pas l'écran.</p><h3 class="h3">Coach de ${esc(side[s])}${x.c?' ('+esc(pfirst(PX.c,x.c))+')':''} : ${start?'choisis la stratégie de':'tu peux changer la stratégie de'} ${esc(pfirst(PX.c,x.j))}</h3>
  <div class="row wrapf">${start?tmHtml('badc'+s,'Choix du coach',J.tChoix*60):tm?tmHtml('badtm','Temps mort',J.tTM):tmHtml('bade','Entre les deux sets',J.tEntre*60)}</div>
  <div class="strats">${L.map((st,i)=>`<button class="card st pick${cur&&sameSet(cur.z,st.z)?' on':''}" onclick="badPick('${s}',${JSON.stringify(st.z)})"><b>${esc(st.n||'Stratégie '+(i+1))}</b>${courtSvg(J,{sel:st.z})}<small>${zonesTxt(st.z)}</small></button>`).join('')||'<p class="warn">Pas de panel pour ce joueur : choisis les zones ci-dessous.</p>'}</div>
  <details${L.length?'':' open'}><summary>Autre choix de zones</summary><div class="cw" id="zfree">${courtSvg(J,{sel:PX.zf||[],click:1})}</div><button class="b s" onclick="badPick('${s}',PX.zf||[])">Choisir ces zones</button></details>
  ${!start&&cur?`<p>Stratégie actuelle gardée si tu ne changes rien. <button class="b s" onclick="badNext('${s}')">Garder et continuer ▶</button></p>`:''}</div>`}
 else if(ph==='jeu'){const set=R.set+1,sc=R.cur;
  h+=`<div class="sb"><div class="sd"><b>${esc(nA)}</b><small>${esc(pfirst(PX.c,m.a.j))}</small><span>${sc[0]}</span></div><div class="sm2">Set ${set}/${J.sets}<br><small>${R.sets.filter((x,i)=>i<R.set).map(x=>x.join('-')).join(' · ')}</small></div><div class="sd"><b>${esc(nB)}</b><small>${esc(pfirst(PX.c,m.b.j))}</small><span>${sc[1]}</span></div></div>
  <div class="row pts"><button class="pt a" onclick="badPoint('a')">Point ${esc(nA)}</button><button class="pt b" onclick="badPoint('b')">Point ${esc(nB)}</button></div>
  <div class="row wrapf"><button class="b" onclick="badUndo()" ${(m.pts||[]).length?'':'disabled'}>↶ Annuler le dernier point</button>${['a','b'].map(s=>`<button class="b" ${(m.tm[s]||[]).filter(x=>x===R.set).length>=(+J.tmN||1)?'disabled':''} onclick="mUpd(m=>{m.tm.${s}=(m.tm.${s}||[]).concat(${R.set});m.ph='tm${s}'})">⏸ Temps mort ${esc(side[s])}</button>`).join('')}</div>
  <p class="mut sm">Point : touche le binôme qui marque, puis indique comment (faute / touche de l'adversaire, ou point direct et la zone). Les stratégies restent secrètes jusqu'à la fin.</p>`}
 else if(ph==='deva'||ph==='devb'){const s=ph.slice(-1),o=s==='a'?'b':'a';
  h+=`<div class="secret"><h3 class="h3">Coach de ${esc(side[s])} : devine la stratégie de ${esc(side[o])}</h3><p class="mut">Touche les zones que l'adversaire visait. Stratégie découverte = +${J.pDevine} points.</p><div class="cw" id="zfree">${courtSvg(J,{sel:PX.zf||[],click:1})}</div>
  <div class="row end"><button class="b" onclick="badGuess('${s}',null)">Je ne sais pas</button><button class="b p" onclick="badGuess('${s}',PX.zf||[])">✓ Valider</button></div></div>`}
 else{/* fin : tout est révélé */
  h+=`<div class="sb fin"><div class="sd"><b>${esc(nA)}</b><span>${R.a}</span><small>${R.setsA} set(s)</small></div><div class="sm2">${R.win==='a'?'🏆 '+esc(nA):R.win==='b'?'🏆 '+esc(nB):'Match nul'}<br><small>${R.sets.map(x=>x.join('-')).join(' · ')}</small></div><div class="sd"><b>${esc(nB)}</b><span>${R.b}</span><small>${R.setsB} set(s)</small></div></div>
  <div class="g2">${['a','b'].map(s=>{const L=(m.strat[s]||[]),dir=(m.pts||[]).filter((p,i)=>p.w===s&&p.k==='d'&&((badStratAt(m,s,i)||{}).z||[]).includes(+p.z)).length,oth=(m.pts||[]).filter(p=>p.w===s).length-dir;
   return `<div class="card"><b>${esc(side[s])}</b><p>Stratégie${L.length>1?'s':''} : ${L.map(x=>zonesTxt(x.z)).join(' → ')||'—'}</p><p>${dir} point(s) direct(s) dans la stratégie × ${J.pDirect} · ${oth} autre(s) point(s) × ${J.pFaute}${R.dev[s]?` · stratégie adverse devinée +${J.pDevine}`:''}</p><p>Deviné : ${m.guess&&m.guess[s]?zonesTxt(m.guess[s]):'—'}</p></div>`}).join('')}</div>
  ${m.fin?'':`<div class="row end"><button class="b p" onclick="mUpd(m=>{m.fin=true})">✓ Enregistrer le résultat</button></div>`}`}
 return h+'</div>'}
document.addEventListener('click',e=>{const g=e.target.closest('#zfree [data-z]');if(!g)return;const z=+g.dataset.z;PX.zf=(PX.zf||[]).includes(z)?PX.zf.filter(x=>x!==z):(PX.zf||[]).concat(z);g.closest('#zfree').innerHTML=courtSvg(PX.J,{sel:PX.zf,click:1})});
function badPick(s,z){if(!z||!z.length){toast('Choisis au moins une zone');return}PX.zf=[];mUpd(m=>{const L=m.strat[s]=m.strat[s]||[],i=(m.pts||[]).length,last=L[L.length-1];if(!last||!sameSet(last.z,z)){if(last&&last.i===i)L.pop();L.push({i,z})}});badNext(s)}
function badNext(s){const m=get(mId());let ph=m.ph;
 if(ph==='choixa')ph='choixb';else if(ph==='choixb')ph='jeu';else if(ph==='tma'||ph==='tmb')ph='jeu';else if(ph==='entrea')ph='entreb';else if(ph==='entreb')ph='jeu';
 mUpd(x=>{x.ph=ph})}
function badPoint(w){const J=PX.J,o=w==='a'?'b':'a',S=PX.S,nW=eqNom(S,get(mId())[w].eq);
 const d=modal(`<h3>Point pour ${esc(nW)} : comment ?</h3><div class="row wrapf"><button class="b p big" id="pf">Faute / touche de l'adversaire</button><button class="b p big" id="pd">Point direct (volant au sol sans être touché)</button></div><div id="pz" style="display:none"><p class="lab">Zone où le volant est tombé (terrain de l'adversaire)</p><div class="cw" id="pzc">${courtSvg(J,{click:1})}</div></div><div class="row end"><button class="b" data-x>Annuler</button></div>`,{wide:1});
 d.querySelector('#pf').onclick=()=>{d.remove();badAdd({w,k:'f'})};d.querySelector('#pd').onclick=()=>{d.querySelector('#pz').style.display=''};
 d.querySelector('#pzc').addEventListener('click',e=>{const g=e.target.closest('[data-z]');if(!g)return;d.remove();badAdd({w,k:'d',z:+g.dataset.z})})}
function badAdd(p){const J=PX.J;let next=null;const m0=get(mId());if(!m0||m0.fin||badCalc(J,m0).over)return;upd(mId(),{},m=>{p.t=Date.now();m.pts=(m.pts||[]).concat(p);const R=badCalc(J,m);if(R.over)m.ph='deva';else if(R.set>0&&R.cur[0]===0&&R.cur[1]===0){m.ph='entrea';next=R.set}});
 if(next!=null)toast('Fin du set '+next+' : '+PX.J.tEntre+' min, chaque coach peut changer la stratégie');render()}
function badUndo(){mUpd(m=>{m.pts=(m.pts||[]).slice(0,-1);const n=m.pts.length;['a','b'].forEach(s=>{m.strat[s]=(m.strat[s]||[]).filter((x,i)=>i===0||x.i<=n)})})}
function badGuess(s,z){PX.zf=[];mUpd(m=>{m.guess=m.guess||{};m.guess[s]=z&&z.length?z:null;m.ph=s==='a'?'devb':'fin'})}
function badDel(){if(!confirm('Supprimer ce match ?'))return;del(mId());MATCH=null;render()}
/* enseignant : matchs et classement dans l'onglet Classe */
function badClassHtml(P,S,c){PX=Object.assign(PX||{},{act:'bad',cls:c.id,c,S,P,J:P.jeu});const M=badMatches(c.id);
 return `<h3 class="h3">Matchs (${M.length})</h3>${M.length?`<div class="mlist">${M.map(m=>{const R=badCalc(P.jeu,m);return `<button class="mrow" onclick="go('match',{mt:'${m.id}'})"><b>${esc(eqNom(S,m.a.eq))}</b> <span>contre</span> <b>${esc(eqNom(S,m.b.eq))}</b><small>${m.fin?'Terminé · '+R.a+' – '+R.b+' pts':m.ph&&m.ph!=='prep'?'En cours':'Prévu'}${m.org?' · organisé par '+esc(eqNom(S,m.org)):''}</small></button>`}).join('')}</div>`:'<p class="mut">Les élèves organisent leurs matchs sur les tablettes.</p>'}`+badRankHtml(P.jeu,S,c.id)}

/* ================== CROSS TRAINING ================== */
const CT_SUB=[['seance','1 · Feuille de séance'],['prod','2 · Production'],['moi','3 · Ma fiche']];
function ctHtml(){const J=PX.J,F=F0(),s=curSub(CT_SUB),mem=memNames();let h=subTabs(CT_SUB);const ed=!F.lock||PX.teach;
 if(s==='seance'){h+=`<div class="row wrapf">${tmHtml('ctc','Concertation',J.concert*60)}</div><p class="mut">Feuille de séance collective du binôme : forme de travail, objectif de chacun (FC cible), échauffement, exercices et muscles travaillés, tours, temps de travail et de repos, réchappe, étirements. Séance de ${J.seanceMin} à ${J.seanceMax} minutes.</p>
  <div class="card"><b>Forme de travail</b><div class="row wrapf">${Object.keys(FORMES).map(f=>`<button class="b s${F.forme===f?' p':''}" onclick="ctSet(F=>F.forme='${f}')">${f}</button>`).join('')}</div>${F.forme?`<p class="mut sm">${esc(FORMES[F.forme])}</p>`:''}
  <b>Répartition du travail</b><div class="row wrapf">${[['sim','Les 2 en même temps'],['alt','En alternance (repos pendant le travail du partenaire)']].map(([k,l])=>`<button class="b s${F.rep===k?' p':''}" onclick="ctSet(F=>F.rep='${k}')">${l}</button>`).join('')}</div>
  <div class="g3"><label>Durée de pratique (min)<input type="number" inputmode="numeric" value="${esc(F.duree||'')}" onchange="ctSet(F=>F.duree=+this.value||null,1)"></label><label>Tours / rounds visés<input value="${esc(F.tours||'')}" onchange="ctSet(F=>F.tours=this.value,1)"></label><label>Rotations<input value="${esc(F.rot||'')}" onchange="ctSet(F=>F.rot=this.value,1)"></label><label>Temps de travail<input value="${esc(F.trav||'')}" onchange="ctSet(F=>F.trav=this.value,1)"></label><label>Temps de repos<input value="${esc(F.repos||'')}" onchange="ctSet(F=>F.repos=this.value,1)"></label></div></div>
  <div class="card"><b>Objectif personnel</b>${mem.map(x=>`<div class="g2"><label>${esc(x.n)} : objectif<input value="${esc((F.obj||{})[x.k]||'')}" placeholder="ex. travailler l'endurance, FC autour de 160" onchange="ctSet(F=>{F.obj=F.obj||{};F.obj['${x.k}']=this.value},1)"></label><label>FC cible (bpm)<input type="number" inputmode="numeric" value="${esc((F.fcc||{})[x.k]||'')}" onchange="ctSet(F=>{F.fcc=F.fcc||{};F.fcc['${x.k}']=this.value},1)"></label></div>`).join('')}</div>
  <div class="card"><label>Échauffement<textarea rows="3" onchange="ctSet(F=>F.ech=this.value,1)">${esc(F.ech||'')}</textarea></label></div>
  <div class="card"><b>Exercices</b><datalist id="exos">${EXOS.map(e=>`<option value="${esc(e[0])}">`).join('')}</datalist>
  ${(F.ex||[]).map((e,i)=>`<div class="exr"><input list="exos" placeholder="exercice" value="${esc(e.n)}" onchange="ctEx(${i},this.value)"><input placeholder="muscles travaillés" value="${esc(e.m||'')}" onchange="ctSet(F=>F.ex[${i}].m=this.value,1)"><input placeholder="répétitions / temps" value="${esc(e.q||'')}" onchange="ctSet(F=>F.ex[${i}].q=this.value,1)"><select onchange="ctSet(F=>F.ex[${i}].p=this.value,1)"><option value="">les deux</option>${mem.map(x=>`<option value="${x.k}"${e.p===x.k?' selected':''}>${esc(x.n)}</option>`).join('')}</select><button class="b s" onclick="ctSet(F=>F.ex.splice(${i},1))">🗑</button></div>`).join('')}
  <button class="b s" onclick="ctSet(F=>{F.ex=F.ex||[];F.ex.push({n:'',m:'',q:'',p:''})})">➕ Exercice</button><p class="mut sm">Écris les muscles travaillés par chaque exercice (pas de proposition automatique : c'est évalué).</p></div>
  <div class="card"><label>Réchappe prévue (si l'objectif devient trop difficile ou trop facile)<textarea rows="2" onchange="ctSet(F=>F.rech=this.value,1)">${esc(F.rech||'')}</textarea></label><label>Étirements / retour au calme<textarea rows="2" onchange="ctSet(F=>F.etir=this.value,1)">${esc(F.etir||'')}</textarea></label></div>`}
 if(s==='prod'){const f=F.forme||'AMRAP',min=+F.duree||(f==='EMOM'?J.emom:f==='AMRAP'?J.amrap:J.cap),ex=(F.ex||[]).filter(e=>e.n);
  const t=TM.ctp||(TM.ctp={dur:min*60,up:f!=='AMRAP',run:false,acc:0});if(f==='EMOM'){t.minute=1}if(!t.run&&t.left==null&&!t.acc){t.dur=min*60;t.up=f!=='AMRAP'}
  const el=tmLeft(t),mi=Math.floor(el/60);
  h+=`<div class="card big"><b>${esc(f)}</b> · ${min} min${f==='FOR TIME'?' (temps limite)':''}${F.tours?' · objectif : '+esc(F.tours):''}</div>${tmHtml('ctp',f==='EMOM'?'Minute en cours':f==='AMRAP'?'Temps restant':'Chrono',min*60,f!=='AMRAP')}
  ${f==='EMOM'&&ex.length?`<div class="card soft big">Minute ${mi+1} : <b>${esc(ex[mi%ex.length].n)}</b> ${esc(ex[mi%ex.length].q||'')}</div>`:''}
  <div class="g2">${mem.map(x=>{const L=(F.log||[]).filter(l=>l.k===x.k);return `<div class="card"><b>${esc(x.n)}</b> <span class="mut">FC cible ${esc((F.fcc||{})[x.k]||'—')}</span><div class="row wrapf"><button class="b p" onclick="ctLog('${x.k}',{tour:1})">+1 tour</button><button class="b" onclick="ctFc('${x.k}')">❤️ FC</button></div>
   <p>Tours : <b>${L.filter(l=>l.tour).length}</b> · FC : ${L.filter(l=>l.fc).map(l=>`<b>${l.fc}</b> <small class="mut">(${tmFmt(l.at||0)})</small>`).join(' · ')||'—'}</p></div>`}).join('')}</div>
  <div class="row wrapf"><button class="b" onclick="ctRech()">⚠ Réchappe (régulation)</button><button class="b" onclick="ctSet(F=>{F.log=(F.log||[]).slice(0,-1)})" ${(F.log||[]).length?'':'disabled'}>↶ Annuler la dernière saisie</button></div>
  ${(F.log||[]).filter(l=>l.rech).map(l=>`<div class="card warn sm">⚠ ${tmFmt(l.at||0)} · ${esc(l.t||'réchappe')}</div>`).join('')}`}
 if(s==='moi'){const me=PX.cm&&mem.some(x=>x.k===PX.cm)?PX.cm:'';h+=`<p class="mut">Feuille individuelle : choisis ton prénom.</p><div class="chips">${mem.map(x=>`<button class="chip${x.k===me?' on':''}" onclick="PX.cm='${x.k}';render()">${esc(x.n)}</button>`).join('')}</div>`;
  if(me){const I=ixOf(PX.act,PX.cls,me),L=(F.log||[]).filter(l=>l.k===me&&l.fc);
   h+=`<div class="card"><div class="row wrapf"><span class="lab">FC de repos</span><button class="b" onclick="ctIx('${me}','fcr','FC de repos')">${I.fcr||'—'} bpm</button><span class="lab">FC cible</span><b>${esc((F.fcc||{})[me]||'—')}</b></div>
   <p>FC relevées pendant la séance : ${L.map(l=>'<b>'+l.fc+'</b>').join(' · ')||'—'} ${(I.fc||[]).map(v=>'<b>'+v+'</b>').join(' · ')} <button class="b s" onclick="ctIxFc('${me}')">➕ FC</button></p>
   ${[['mus','Ressenti musculaire'],['resp','Ressenti respiratoire'],['fat','Fatigue générale']].map(([k,l])=>`<div class="row wrapf"><span class="lab" style="min-width:190px">${l}</span>${Array.from({length:10},(_,i)=>`<button class="rp${+I[k]===i+1?' on':''}" onclick="ctIxSet('${me}','${k}',${i+1})">${i+1}</button>`).join('')}</div>`).join('')}
   <label>Sensations<textarea rows="3" onchange="ctIxSet('${me}','sens',this.value,1)">${esc(I.sens||'')}</textarea></label><label>Mes exercices (s'ils sont différents de ceux de mon partenaire)<textarea rows="2" onchange="ctIxSet('${me}','exd',this.value,1)">${esc(I.exd||'')}</textarea></label>
   ${repInline(me)}<div class="row wrapf"><span class="lab">Mon objectif est atteint</span>${[['oui','Oui'],['part','En partie'],['non','Non']].map(([k,l])=>`<button class="b s${I.atteint===k?' p':''}" onclick="ctIxSet('${me}','atteint','${k}')">${l}</button>`).join('')}</div></div>`}}
 return h}
function ctSet(f,keep){tmUpd(F=>f(F),keep)}
function ctEx(i,v){const e=EXOS.find(x=>x[0].toLowerCase()===String(v).trim().toLowerCase());ctSet(F=>{F.ex[i].n=v})}
function ctLog(k,o){const t=TM.ctp;ctSet(F=>{F.log=(F.log||[]).concat(Object.assign({k,at:t?Math.round(tmLeft(t)):0,ts:Date.now()},o))})}
async function ctFc(k){const v=await numPad('Fréquence cardiaque (bpm)');if(v)ctLog(k,{fc:v})}
function ctRech(){const d=modal(`<h3>⚠ Réchappe</h3><p class="mut">Qu'est-ce que vous changez pour vous rapprocher de l'objectif ?</p><textarea id="rt" rows="3"></textarea><div class="row end"><button class="b" data-x>Annuler</button><button class="b p" id="ok">✓ Noter</button></div>`);d.querySelector('#ok').onclick=()=>{const t=d.querySelector('#rt').value.trim();d.remove();ctLog('',{rech:1,t})}}
function ctIxSet(k,f,v,keep){upd(ixId(PX.act,PX.cls,k),{},o=>{o[f]=v});if(!keep)render()}
async function ctIx(k,f,t){const v=await numPad(t);if(v)ctIxSet(k,f,v)}
async function ctIxFc(k){const v=await numPad('Fréquence cardiaque (bpm)');if(v)upd(ixId(PX.act,PX.cls,k),{},o=>{o.fc=(o.fc||[]).concat(v)});render()}

/* choix de la répartition des points (fil de séquence) au moment de remplir la feuille */
function repInline(k){const P=PX.P,ix=ixOf(PX.act,PX.cls,k),ev=evOf(PX.act,PX.cls,k),X=P.fil.retenus.map(id=>(aflFil(P,id)||{}).code||id);
 return `<div class="repi"><span class="lab">🎯 Répartition de ${esc(pfirst(PX.c,k))}</span>${P.fil.reps.map(r=>{const n=repPts(r);return `<button class="b s${ix.rep===r?' p':''}" onclick="repSet('${k}','${r}')">${X.map((x,j)=>esc(x)+' '+n[j]).join(' / ')}</button>`}).join('')}${ix.rep?'':'<span class="warn sm" style="padding:2px 8px;border-radius:8px">à choisir</span>'}${ev.rep&&ev.rep!==ix.rep?`<span class="mut sm">enseignant : ${esc(ev.rep)}</span>`:''}</div>`}
function repSet(k,r){upd(ixId(PX.act,PX.cls,k),{},o=>{o.rep=r;o.repAt=Date.now()});toast('Répartition enregistrée');render()}
