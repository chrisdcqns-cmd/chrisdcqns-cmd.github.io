/* ================== ÉTAT DE LA TABLETTE (non partagé) ================== */
function lget(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
let T=Object.assign({act:'',cls:'',view:'eval',el:'',all:false,pv:'pro'},lget('ccf.t',{}));
let E=Object.assign({cls:'',act:'',team:'',tab:'pra',me:''},lget('ccf.e',{}));
const saveT=()=>lset('ccf.t',T),saveE=()=>lset('ccf.e',E);
const TABOF={eval:'eval',fiche:'eval',cls:'cls',team:'cls',match:'cls',bil:'bil',proto:'bib',res:'bib',print:'bib',obs:'eval',edit:'reg',act:'reg'};
function go(v,o){Object.assign(T,o||{});T.view=v;saveT();try{if(window.EPSTCCF&&isT()){EPSTCCF.closePanel();EPSTCCF.mark(TABOF[v]||'eval')}}catch(e){}render();window.scrollTo(0,0)}

/* ================== BARRE DU HAUT ================== */
function bar(){const t=isT(),A=ACTS[t?T.act:E.act],c=clsById(t?T.cls:E.cls),S=A&&c?ses(t?T.act:E.act,c.id):null;
 const sub=[A?'CCF '+A.nom:'Contrôle en cours de formation',S?VOIES[S.voie]:'',c?c.nom:''].filter(Boolean).join(' · ');
 $('#hd').style.setProperty('--app',COL);
 $('#hd').innerHTML=`<div class="ei" data-eps-logo title="CCF">${svgIco(ICO_CCF)}</div><div class="ht"><h1>CCF</h1><p>${esc(sub)}</p></div><span data-eps-bar></span>`+
 (t?`${T.act?'<button class="tb" onclick="go(\'act\')">🔀 Activité</button>':''}<button class="tb" onclick="lockApp()">🔓 Quitter</button>`:(E.cls?`<button class="tb" onclick="eleveClasse()">⇄ Classe</button>`:''));
 try{window.EPSD&&EPSD.refresh&&EPSD.refresh()}catch(e){}}

/* ================== RENDU ================== */
function render(){DB=ld();bar();const m=$('#m');if(isT())renderT(m);else renderE(m)}
function renderT(m){if(!T.act||T.view==='act')return actScreen(m);
 if(!['eval','fiche','cls','bil','proto','edit','res','team','match','print','obs'].includes(T.view))T.view='eval';
 ({eval:evalScreen,fiche:ficheScreen,cls:clsScreen,bil:bilScreen,proto:protoScreen,edit:editScreen,res:resScreen,team:teamScreenT,match:matchScreenT,print:printScreen,obs:obsScreenT})[T.view](m)}

/* ---------- choix de l'activité ---------- */
function actScreen(m){
 m.innerHTML=`<div class="wrap"><h2 class="h2">Choisis l'activité du CCF</h2><p class="mut">Chaque activité a son protocole (Bac pro, Bac général), sa forme de pratique pour les élèves et l'évaluation /20. Les protocoles sont modifiables (⚙ Réglages → Modifier le protocole).</p>
 <div class="tiles">${Object.keys(ACTS).map(a=>{const A=ACTS[a];return `<button class="tile" style="--c:${A.color}" onclick="go('eval',{act:'${a}'})"><span class="ti">${svgIco(A.icon)}</span><span><b>${esc(A.nom)}</b><small>${['pro','gt'].map(v=>VOIES[v]+(hasProto(a,v)?' ✓':' · à venir')).join(' · ')}</small><small>${esc(A.eq)}</small></span></button>`}).join('')}</div>
 <p class="mut" style="margin-top:18px">Les protocoles du Bac général arriveront ici dès que tu les enverras.</p></div>`}

/* ---------- puces des classes ---------- */
function clsChips(){const L=classesFor(T.act,T.all);
 return `<div class="chips">${L.map(o=>{const S=get(sesId(T.act,o.id));return `<button class="chip${o.id===T.cls?' on':''}" onclick="go('${T.view==='fiche'?'eval':T.view}',{cls:'${o.id}'})">${esc(o.nom)}${S&&S.open?' <i>●</i>':''}</button>`}).join('')}
 <label class="tg"><input type="checkbox" ${T.all?'checked':''} onchange="go(T.view,{all:this.checked})"> toutes les classes</label></div>`+(L.length?'':'<p class="mut">Aucune classe attribuée à cette activité. Coche « toutes les classes », ou attribue l\'activité dans Réglages communs → Listes d\'élèves.</p>')}
function needCls(m,title){const c=clsById(T.cls);if(c&&(T.all||!(c.off||[]).includes(T.act)))return c;
 m.innerHTML=`<div class="wrap"><h2 class="h2">${title}</h2>${clsChips()}<p class="mut">Choisis une classe.</p></div>`;return null}
function noProto(S){return `<div class="card warn"><b>Pas encore de protocole ${esc(VOIES[S.voie])} pour ${esc(ACTS[T.act].nom)}.</b><p>Envoie-le dans la conversation avec Claude : il sera ajouté ici. En attendant, tu peux passer la classe en ${S.voie==='pro'?'Bac général':'Bac pro'} ci-dessus.</p></div>`}

/* ---------- 📋 Évaluation : la classe ---------- */
function evalScreen(m){const c=needCls(m,'📋 Évaluation');if(!c)return;const S=ses(T.act,c.id),P=proto(T.act,S.voie),L=people(c);
 let h=`<div class="wrap"><div class="row"><h2 class="h2" style="flex:1">📋 Évaluation · ${esc(ACTS[T.act].nom)}</h2><button class="b s" onclick="OBS={k:'',by:'',v:{}};go('obs',{el:''})">👁 Observer</button></div>${clsChips()}
 <div class="card row wrapf"><span class="lab">Voie</span>${['pro','gt'].map(v=>`<button class="b s${S.voie===v?' p':''}" onclick="sesSet('voie','${v}')">${VOIES[v]}</button>`).join('')}
 <span class="lab" style="margin-left:10px">Date du CCF</span><input type="date" value="${esc(S.date||today())}" onchange="sesSet('date',this.value)">
 <label class="tg big"><input type="checkbox" ${S.open?'checked':''} onchange="sesSet('open',this.checked)"> Ouvert sur les tablettes élèves</label></div>`;
 if(!P){m.innerHTML=h+noProto(S)+'</div>';return}
 const ids=P.fin.afl.map(a=>a.code+' /'+a.pts).concat(P.fil.retenus.map(id=>(aflFil(P,id)||{}).code||id));
 h+=`<p class="mut">${(S.eq||[]).length} équipe(s) · touche un élève pour l'évaluer. Fil de séquence : ${P.fil.retenus.map(id=>esc((aflFil(P,id)||{}).code)).join(' et ')} (répartition choisie par l'élève).</p>
 <div class="tblw"><table class="tbl"><thead><tr><th>Élève</th><th>Équipe</th>${ids.map(x=>`<th>${esc(x)}</th>`).join('')}<th>Rép.</th><th>/20</th></tr></thead><tbody>`+
 L.map(p=>{const ev=evOf(T.act,c.id,p.k),ix=ixOf(T.act,c.id,p.k),N=notes(P,ev,ix),t=teamOf(S,p.k),dz=dispOf(c.nom,p.full),rep=repOf(P,ev,ix);
  return `<tr onclick="go('fiche',{el:'${p.k}'})"><td><b>${esc(p.full)}</b>${dz?`<small class="dz">🩹 ${esc(dz)}</small>`:''}</td><td>${esc(t?t.nom:'—')}</td>${ev.st?`<td colspan="${ids.length}" class="st">${ev.st==='abs'?'Absent(e)':'Dispensé(e)'}</td>`:N.aff.map(v=>`<td>${fr(v)}</td>`).join('')}<td>${rep?esc(rep):'<span class="mut">—</span>'}${ix.rep&&!ev.rep?' 🙋':''}</td><td><b>${ev.st?(ev.st==='abs'?'A':'D'):fr(N.tot)}</b></td></tr>`}).join('')+`</tbody></table></div></div>`;
 m.innerHTML=h}
function sesSet(k,v){sesPut(T.act,T.cls,S=>{S[k]=v});if(k==='open'&&v)toast('Les élèves de la classe voient le CCF sur les tablettes');render()}

/* ---------- fiche d'évaluation d'un élève ---------- */
function ficheCtx(){const c=clsById(T.cls),S=ses(T.act,T.cls);return {c,S,P:proto(T.act,S.voie),k:T.el,act:T.act,cls:T.cls}}
function evUpd(f){upd(evId(T.act,T.cls,T.el),{},f)}
function ficheScreen(m){const X=ficheCtx(),{c,S,P,k}=X;if(!c||!P){go('eval');return}const L=people(c),i=L.findIndex(p=>p.k===k),p=L[i];if(!p){go('eval');return}
 const ev=evOf(T.act,c.id,k),ix=ixOf(T.act,c.id,k),N=notes(P,ev,ix),t=teamOf(S,k),rep=repOf(P,ev,ix),dz=dispOf(c.nom,p.full),pr=pratiqueTxt(T.act,P,c.id,S,k);
 let h=`<div class="wrap"><div class="row wrapf"><button class="b" onclick="go('eval')">← Classe</button><button class="b" ${i>0?'':'disabled'} onclick="go('fiche',{el:'${(L[i-1]||{}).k}'})">◀</button><button class="b" ${i<L.length-1?'':'disabled'} onclick="go('fiche',{el:'${(L[i+1]||{}).k}'})">▶</button>
 <h2 class="h2" style="flex:1;margin:0">${esc(p.full)} <small class="mut">${esc(c.nom)}${t?' · '+esc(t.nom):''}</small></h2><div class="tot">${ev.st?(ev.st==='abs'?'Absent(e)':'Dispensé(e)'):fr(N.tot)}<small>/20</small></div></div>
 ${dz?`<p class="dz">🩹 ${esc(dz)}</p>`:''}
 <div class="row wrapf" style="margin:10px 0">${[['','Présent(e)'],['abs','Absent(e) · A'],['disp','Dispensé(e) / inapte · D']].map(s=>`<button class="b s${(ev.st||'')===s[0]?' p':''}" onclick="evUpd(e=>{e.st='${s[0]}'});render()">${s[1]}</button>`).join('')}
 <button class="b s" onclick="go('team',{tm:'${t?t.id:''}'})" ${t?'':'disabled'}>👁 Feuille de l'équipe</button><button class="b s" onclick="OBS={k:'${k}',by:'',v:{}};go('obs')">👁 Observer</button></div>
 ${(()=>{const R=obsRecs(T.act,c.id,k);return R.length?`<div class="card soft"><b>👁 Observations (élèves observateurs et toi)</b>${obsSummary(P,c,R,{act:T.act,cls:c.id,c,S,P},k)}</div>`:''})()}
 ${pr.length?`<div class="card soft"><b>Pratique le jour du CCF</b><br>${pr.map(esc).join('<br>')}</div>`:''}
 <div class="row wrapf" style="margin-top:12px"><button class="b" onclick="proposeAll()">💡 Positionner d'après les données (AFLP non notés)</button><span class="mut sm">Propositions calculées à partir des observations et de la pratique ; tu valides et tu ajustes. 🙋 = auto-positionnement de l'élève.</span></div>
 <h3 class="h3">${esc(P.fin.titre)} · ${finMax(P)} points <span class="mut">(${fr(N.fin)} pt)</span></h3>`;
 P.fin.afl.forEach(a=>{const x=(ev.fin||{})[a.id]||{},v=finV(a,x);
  h+=`<div class="afl"><div class="afh"><b>${esc(a.code)}</b> <span class="pill">/${a.pts}</span><span class="dcl">${esc(a.decl)}</span><span class="nt">${fr(v)}</span></div><p class="off">${esc(a.off)}</p>
  ${a.regles&&a.regles.length?`<details><summary>Règles de l'épreuve</summary><ul>${a.regles.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></details>`:''}
  <div class="degs">${a.deg.map((g,d)=>`<button class="dg d${d}${x.d===d?' on':''}" onclick="ficheDeg('${a.id}',${d})"><b>Degré ${d+1}${(ix.ap||{})[a.id]===d?' 🙋':''}</b><span>${nl2br(g.t)}</span><i>${fr(g.min)} à ${fr(g.max)} pt</i></button>`).join('')}</div>${proposeHtml(P,X,k,a.id,1)}
  ${x.d!=null?`<div class="sl"><span>${esc(a.degAj||'Position dans le degré')}</span><input type="range" min="${a.deg[x.d].min}" max="${a.deg[x.d].max}" step="0.25" value="${v}" oninput="this.nextElementSibling.textContent=fr(+this.value)" onchange="ficheV('${a.id}',+this.value)"><b>${fr(v)}</b></div>`:''}
  ${a.ajust?`<p class="mut sm">${esc(a.ajust)}</p>`:''}${a.auto?`<div class="aide">${aideHtml(a.auto,P,X)}</div>`:''}</div>`});
 const reps=repPts(rep||P.fil.reps[0]);
 h+=`<h3 class="h3">${esc(P.fil.titre)} · ${P.fil.pts} points <span class="mut">(${fr(N.fil)} pt)</span></h3>
 <div class="card row wrapf"><span class="lab">Répartition</span>${P.fil.reps.map(r=>`<button class="b s${rep===r?' p':''}" onclick="evUpd(e=>{e.rep='${r}'});render()">${P.fil.retenus.map(id=>esc((aflFil(P,id)||{}).code)).map((cd,j)=>cd+' '+repPts(r)[j]).join(' / ')}</button>`).join('')}
 <span class="mut">${ix.rep?'🙋 choix de l\'élève : '+esc(ix.rep):'l\'élève n\'a pas encore choisi'}${ev.rep&&ix.rep&&ev.rep!==ix.rep?' (modifié par toi)':''}</span></div>`;
 P.fil.retenus.forEach((id,j)=>{const a=aflFil(P,id)||{deg:[]},x=(ev.fil||{})[id]||{},B=P.fil.bareme[reps[j]]||[];
  h+=`<div class="afl"><div class="afh"><b>${esc(a.code)}</b> <span class="pill">/${reps[j]}</span><span class="dcl">${esc(a.decl)}</span><span class="nt">${fr(x.d!=null?B[x.d]:null)}</span></div><p class="off">${esc(a.off)}</p>
  ${a.regles&&a.regles.length?`<details><summary>Règles</summary><ul>${a.regles.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></details>`:''}
  <div class="degs">${a.deg.map((g,d)=>`<button class="dg d${d}${x.d===d?' on':''}" onclick="ficheFil('${id}',${d})"><b>Degré ${d+1}${(ix.ap||{})[id]===d?' 🙋':''}</b><span>${nl2br(g)}</span><i>${fr(B[d])} pt</i></button>`).join('')}</div>${proposeHtml(P,X,k,id,0)}
  ${a.auto?`<div class="aide">${aideHtml(a.auto,P,X)}</div>`:''}</div>`});
 h+=`<h3 class="h3">Commentaire</h3><textarea id="ficom" data-eps-comment rows="3" placeholder="Ce qui est réussi, ce qui reste à travailler…" onchange="evUpd(e=>{e.comm=this.value})">${esc(ev.comm||'')}</textarea>
 <div class="row end" style="margin-top:12px">${i<L.length-1?`<button class="b p" onclick="go('fiche',{el:'${L[i+1].k}'})">Élève suivant ▶</button>`:`<button class="b p" onclick="go('bil')">📄 Bilans de la classe</button>`}</div></div>`;
 m.innerHTML=h}
function ficheDeg(id,d){const P=ficheCtx().P,a=P.fin.afl.find(x=>x.id===id);evUpd(e=>{e.fin=e.fin||{};const x=e.fin[id]||{};if(x.d!==d){x.d=d;x.v=q25((a.deg[d].min+a.deg[d].max)/2)}e.fin[id]=x});render()}
function ficheV(id,v){evUpd(e=>{e.fin=e.fin||{};e.fin[id]=Object.assign(e.fin[id]||{},{v})});render()}
function ficheFil(id,d){evUpd(e=>{e.fil=e.fil||{};e.fil[id]={d}});render()}
function ficheGain(v,j){const P=ficheCtx().P,a=P.fin.afl[0],ev=evOf(T.act,T.cls,T.el),x=(ev.fin||{})[a.id];if(!x||x.d==null){toast('Choisis d\'abord le degré');return}const g=a.deg[x.d];ficheV(a.id,q25(g.min+(g.max-g.min)*(j?v/j:0)))}

/* ---------- 👥 Classe : équipes ---------- */
function eqSize(){return T.act==='esc'?(proto(T.act,'pro')||{jeu:{}}).jeu.nEq||4:2}
function clsScreen(m){const c=needCls(m,'👥 Classe et équipes');if(!c)return;const S=ses(T.act,c.id),L=people(c),P=proto(T.act,S.voie),A=ACTS[T.act];
 const free=L.filter(p=>!teamOf(S,p.k));
 let h=`<div class="wrap"><h2 class="h2">👥 Équipes · ${esc(A.nom)}</h2>${clsChips()}
 <p class="mut">${esc(A.eq)}. Les élèves retrouvent leur équipe sur les tablettes (onglet « Mon équipe »). Pour changer un élève d'équipe, choisis sa nouvelle équipe dans la liste.</p>
 <div class="row wrapf"><button class="b" onclick="eqNew()">➕ Nouvelle équipe</button><button class="b" onclick="eqAuto()">🎲 Former les équipes au hasard (${eqSize()} par équipe)</button><button class="b" onclick="eqClear()">🧹 Défaire les équipes</button><button class="b" onclick="go('print')">🖨 Fiches papier (si pas assez de tablettes)</button></div>
 <div class="teams">${(S.eq||[]).map(t=>`<div class="team"><div class="row"><input class="tn" value="${esc(t.nom)}" onchange="eqRen('${t.id}',this.value)">${T.act==='bad'?`<input class="tg2" placeholder="poule" value="${esc(t.g||'')}" onchange="eqG('${t.id}',this.value)">`:''}<button class="b s" title="Feuille de l'équipe" onclick="go('team',{tm:'${t.id}'})">👁</button><button class="b s" onclick="eqDel('${t.id}')">🗑</button></div>
  ${(t.el||[]).map(k=>`<div class="mem">${esc(pname(c,k))}${eqSel(S,k)}</div>`).join('')||'<p class="mut sm">Aucun élève</p>'}</div>`).join('')}</div>
 ${free.length?`<h3 class="h3">Sans équipe (${free.length})</h3><div class="teams"><div class="team">${free.map(p=>`<div class="mem">${esc(p.full)}${eqSel(S,p.k)}</div>`).join('')}</div></div>`:''}`;
 if(P&&T.act==='bad')h+=badClassHtml(P,S,c);
 m.innerHTML=h+'</div>'}
function eqSel(S,k){const t=teamOf(S,k);return `<select onchange="eqMove('${k}',this.value)"><option value="">—</option>${(S.eq||[]).map(x=>`<option value="${x.id}"${t&&t.id===x.id?' selected':''}>${esc(x.nom)}</option>`).join('')}</select>`}
function eqNew(){sesPut(T.act,T.cls,S=>{S.eq=S.eq||[];S.eq.push({id:'q'+uid(),nom:(T.act==='esc'?'Équipe ':'Binôme ')+(S.eq.length+1),el:[],g:''})});render()}
function eqRen(id,v){sesPut(T.act,T.cls,S=>{const t=S.eq.find(x=>x.id===id);if(t)t.nom=v.trim()||t.nom})}
function eqG(id,v){sesPut(T.act,T.cls,S=>{const t=S.eq.find(x=>x.id===id);if(t)t.g=v.trim()});render()}
function eqDel(id){if(!confirm('Supprimer cette équipe ? Ses élèves seront sans équipe (leurs données restent).'))return;sesPut(T.act,T.cls,S=>{S.eq=S.eq.filter(x=>x.id!==id)});render()}
function eqMove(k,id){sesPut(T.act,T.cls,S=>{S.eq.forEach(t=>t.el=(t.el||[]).filter(x=>x!==k));const t=S.eq.find(x=>x.id===id);if(t)t.el.push(k)});render()}
function eqClear(){if(!confirm('Défaire toutes les équipes de la classe ?'))return;sesPut(T.act,T.cls,S=>{S.eq=[]});render()}
function eqAuto(){const c=clsById(T.cls),S0=ses(T.act,T.cls);if((S0.eq||[]).length&&!confirm('Remplacer les équipes actuelles ?'))return;
 const n=eqSize(),ks=people(c).filter(p=>!dispOf(c.nom,p.full)).map(p=>p.k).sort(()=>Math.random()-.5),nb=Math.max(1,Math.round(ks.length/n));
 sesPut(T.act,T.cls,S=>{S.eq=[];for(let i=0;i<nb;i++)S.eq.push({id:'q'+uid()+i,nom:(T.act==='esc'?'Équipe ':'Binôme ')+(i+1),el:[],g:''});ks.forEach((k,i)=>S.eq[i%nb].el.push(k))});render()}

/* ---------- 📄 Bilans ---------- */
function bilScreen(m){const c=needCls(m,'📄 Bilans');if(!c)return;const S=ses(T.act,c.id),P=proto(T.act,S.voie);
 if(!P){m.innerHTML=`<div class="wrap"><h2 class="h2">📄 Bilans</h2>${clsChips()}${noProto(S)}</div>`;return}
 const L=people(c),R=L.map(p=>{const ev=evOf(T.act,c.id,p.k),ix=ixOf(T.act,c.id,p.k);return {p,ev,ix,N:notes(P,ev,ix)}}),ok=R.filter(r=>!r.ev.st&&r.N.tot!=null),moy=ok.length?ok.reduce((s,r)=>s+r.N.tot,0)/ok.length:null;
 const cols=P.fin.afl.map(a=>a.code+' /'+a.pts).concat(P.fil.retenus.map(id=>(aflFil(P,id)||{}).code));
 m.innerHTML=`<div class="wrap"><h2 class="h2">📄 Bilans · CCF ${esc(ACTS[T.act].nom)}</h2>${clsChips()}
 <p class="mut">${ok.length} élève(s) noté(s) sur ${L.length} · moyenne de la classe : <b>${fr(moy)}</b> /20 · ${esc(VOIES[S.voie])} · ${esc(dFR(S.date))}</p>
 <div class="row wrapf"><button class="b p" onclick="bilPronote()">📋 Pronote</button><button class="b" onclick="bilZip()">🗂 Fiches PDF (.zip)</button><button class="b" onclick="bilPdf()">📄 Toutes les fiches (un PDF)</button><button class="b" onclick="bilPub()">🌐 Publier en ligne</button><button class="b" onclick="window.print()">🖨 Imprimer le tableau</button><button class="b" onclick="go('print')">🖨 Documents de la leçon</button></div>
 ${repBilan(P,c,R)}
 <div class="print">${window.EPSR?EPSR.htmlHead({act:'CCF '+ACTS[T.act].nom,titre:VOIES[S.voie],ca:P.ca,ac:COL,nom:'Récapitulatif',classe:c.nom,date:dFR(S.date)}):''}
 <div class="tblw"><table class="tbl"><thead><tr><th>Élève</th>${cols.map(x=>`<th>${esc(x)}</th>`).join('')}<th>Rép.</th><th>/20</th></tr></thead><tbody>${R.map(r=>`<tr onclick="go('fiche',{el:'${r.p.k}'})"><td>${esc(r.p.full)}</td>${r.ev.st?`<td colspan="${cols.length+1}" class="st">${r.ev.st==='abs'?'Absent(e)':'Dispensé(e)'}</td>`:r.N.aff.map(v=>`<td>${fr(v)}</td>`).join('')+`<td>${esc(repOf(P,r.ev,r.ix)||'—')}</td>`}<td><b>${r.ev.st?(r.ev.st==='abs'?'A':'D'):fr(r.N.tot)}</b></td></tr>`).join('')}</tbody></table></div></div></div>`}
function bilRows(){const c=clsById(T.cls),S=ses(T.act,T.cls),P=proto(T.act,S.voie);return {c,S,P,L:people(c).map(p=>{const ev=evOf(T.act,c.id,p.k),ix=ixOf(T.act,c.id,p.k);return {p,ev,ix,N:notes(P,ev,ix)}})}}
function bilPronote(){if(!window.EPSR||!EPSR.pronote)return toast('Indisponible');const {c,P,L}=bilRows();
 EPSR.pronote({app:'ccf',classe:c.nom,titre:'CCF '+ACTS[T.act].nom,color:COL,cols:[{t:'Note /20'}].concat(P.fin.afl.map(a=>({t:a.code+' /'+a.pts}))).concat(P.fil.retenus.map(id=>({t:(aflFil(P,id)||{}).code}))),
  rows:L.map(r=>({nom:r.p.nom,prenom:r.p.prenom,st:r.ev.st==='abs'?'ABS':r.ev.st==='disp'?'DISP':'',v:[r.N.tot].concat(r.N.aff)}))})}

/* bilan des répartitions choisies (fil de séquence) */
function repBilan(P,c,R){const X=P.fil.retenus.map(id=>(aflFil(P,id)||{}).code||id),G={};P.fil.reps.forEach(r=>G[r]=[]);const none=[];
 R.forEach(r=>{const rep=repOf(P,r.ev,r.ix);if(!rep){none.push(r);return}(G[rep]=G[rep]||[]).push(r)});
 const who=r=>`<span class="rn">${esc(r.p.full)}${r.ev.rep&&r.ev.rep!==r.ix.rep?' <i title="saisi ou modifié par toi">✏️</i>':r.ix.rep?' <i title="choisi par l\'élève">🙋</i>':''}</span>`;
 return `<div class="card"><h3 class="h3" style="margin-top:0">🎯 Répartitions choisies · ${esc(P.fil.titre)}</h3><div class="repg">${Object.keys(G).map(r=>{const n=repPts(r);return `<div class="repc"><b>${X.map((x,j)=>esc(x)+' '+n[j]).join(' / ')}</b><span class="rk">${G[r].length}</span><div>${G[r].map(who).join('')||'<span class="mut sm">personne</span>'}</div></div>`}).join('')}
 <div class="repc no"><b>Pas encore choisi</b><span class="rk">${none.length}</span><div>${none.map(who).join('')||'<span class="mut sm">tout le monde a choisi</span>'}</div></div></div>
 <p class="mut sm">🙋 choisi par l'élève sur la tablette · ✏️ saisi ou modifié par toi (fiche de l'élève). Les élèves choisissent dans « Mon choix » ou au moment de remplir leur feuille de pratique.</p></div>`}
