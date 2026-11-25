/* ================== MODE ÉLÈVE ================== */
function openActs(cls){return Object.keys(ACTS).filter(a=>{const s=get(sesId(a,cls));return s&&s.open})}
function openClasses(){return lists().filter(o=>openActs(o.id).length).sort((a,b)=>a.nom.localeCompare(b.nom,'fr',{numeric:true}))}
function eleveClasse(){E.cls='';E.team='';E.act='';saveE();MATCH=null;render();try{window.EPSG&&EPSG.open()}catch(e){}}
function renderE(m){
 if(!E.cls){if(E.tab==='res'&&E.act&&ACTS[E.act]){m.innerHTML=`<div class="wrap"><div class="row"><button class="b" onclick="E.tab='pra';E.act='';saveE();eleveClasse()">← Choisis ta classe</button><h2 class="h2" style="flex:1;margin:0">📚 Ressources · ${esc(ACTS[E.act].nom)}</h2></div>${resHtml(E.act,false)}</div>`;return}
  m.innerHTML=`<div class="wrap"><div class="empty"><h2>Choisis ta classe</h2><p class="mut">Le CCF s'affiche quand ton enseignant l'ouvre pour ta classe.</p><button class="b p" onclick="eleveClasse()">Choisir ma classe</button></div></div>`;
  setTimeout(()=>{if(!isT()&&!E.cls&&!document.querySelector('.epsg'))try{EPSG.open()}catch(e){}},50);return}
 const c=clsById(E.cls),A=openActs(E.cls);
 if(!c||!A.length){m.innerHTML=`<div class="wrap"><div class="empty"><h2>Le CCF n'est pas ouvert</h2><p class="mut">Ton enseignant ne l'a pas encore ouvert pour ${esc(c?c.nom:'ta classe')}.</p><button class="b p" onclick="eleveClasse()">⇄ Changer de classe</button></div></div>`;return}
 if(!A.includes(E.act)){if(A.length===1){E.act=A[0];saveE()}else{m.innerHTML=`<div class="wrap"><h2 class="h2">Quelle activité ?</h2><div class="tiles">${A.map(a=>`<button class="tile" style="--c:${ACTS[a].color}" onclick="E.act='${a}';E.team='';saveE();render()"><span class="ti">${svgIco(ACTS[a].icon)}</span><span><b>${esc(ACTS[a].nom)}</b><small>CCF</small></span></button>`).join('')}</div></div>`;return}}
 bar();const S=ses(E.act,E.cls),P=proto(E.act,S.voie);
 if(!P){m.innerHTML=`<div class="wrap"><div class="empty"><h2>CCF ${esc(ACTS[E.act].nom)}</h2><p class="mut">Le protocole n'est pas encore prêt.</p></div></div>`;return}
 let t=(S.eq||[]).find(x=>x.id===E.team);if(!t&&E.team){E.team='';saveE()}
 const TABS=[['pra','🏁 Pratique'],['eq','👥 Mon équipe'],['obs','👁 Observer'],['choix','🎯 Mon choix'],['proto','📜 Le protocole'],['res','📚 Ressources']];
 if(!t&&(E.tab==='pra'||!E.tab))E.tab='eq';
 let h=`<nav class="etabs" style="--c:${ACTS[E.act].color}">${TABS.map(([k,l])=>`<button class="${E.tab===k?'on':''}" onclick="E.tab='${k}';saveE();MATCH=null;render()">${l}</button>`).join('')}</nav><div class="wrap">`;
 const ctx={act:E.act,cls:E.cls,c,S,P,J:P.jeu,t,teach:false};
 if(E.tab==='pra'){PX=ctx;h+=t?(MATCH&&E.act==='bad'?matchHtml():`<h2 class="h2">${esc(t.nom)} <small class="mut">${(t.el||[]).map(k=>esc(pfirst(c,k))).join(', ')}</small></h2>`+praHtml(ctx)):''}
 else if(E.tab==='eq')h+=eqEleveHtml(c,S,t);
 else if(E.tab==='obs'){PXO=ctx;h+=`<h2 class="h2">👁 Observer un camarade</h2>`+obsHtml(ctx)}
 else if(E.tab==='choix')h+=choixHtml(c,S,P,t);
 else if(E.tab==='proto')h+=`<h2 class="h2">📜 Le protocole du CCF</h2>`+protoHtml(P,true);
 else h+=`<h2 class="h2">📚 Ressources</h2>`+resHtml(E.act,false);
 m.innerHTML=h+'</div>'}
function eqEleveHtml(c,S,t){const L=S.eq||[];
 if(!L.length)return `<div class="empty"><h2>Pas encore d'équipes</h2><p class="mut">Ton enseignant forme les équipes. Patiente un instant.</p></div>`;
 return `<h2 class="h2">👥 Choisis ton équipe</h2><div class="tiles">${L.map(x=>`<button class="tile${t&&t.id===x.id?' on':''}" style="--c:${ACTS[E.act].color}" onclick="E.team='${x.id}';E.tab='pra';saveE();render()"><span><b>${esc(x.nom)}${x.g?' · poule '+esc(x.g):''}</b><small>${(x.el||[]).map(k=>esc(pname(c,k))).join(' · ')||'—'}</small></span></button>`).join('')}</div>`}
function choixHtml(c,S,P,t){const mem=t?(t.el||[]):people(c).map(p=>p.k),me=E.me&&mem.includes(E.me)?E.me:'',X=P.fil.retenus.map(id=>aflFil(P,id)||{});
 let h=`<h2 class="h2">🎯 Ma répartition des points</h2><p>${esc(P.fil.titre)} : ${P.fil.pts} points sur 2 AFLP. Avant l'évaluation de fin de séquence, je choisis comment répartir ces points.</p>
 ${X.map((a,j)=>`<div class="card"><b>${j?'AFLY':'AFLX'} · ${esc(a.code)}</b> — ${esc(a.decl||a.off)}</div>`).join('')}
 <p class="lab">Qui es-tu ?</p><div class="chips">${mem.map(k=>`<button class="chip${k===me?' on':''}" onclick="E.me='${k}';saveE();render()">${esc(pname(c,k))}</button>`).join('')}</div>`;
 if(me){const ix=ixOf(E.act,E.cls,me),ev=evOf(E.act,E.cls,me);
  h+=`<div class="reps">${P.fil.reps.map(r=>{const n=repPts(r);return `<button class="rep${ix.rep===r?' on':''}" onclick="choixSet('${me}','${r}')"><b>${X.map((a,j)=>esc(a.code)+' : '+n[j]+' pts').join('<br>')}</b></button>`}).join('')}</div>
  ${ix.rep?`<p class="ok">✓ Choix enregistré : ${esc(ix.rep)}.</p>`:''}${ev.rep&&ev.rep!==ix.rep?`<p class="mut">Ton enseignant a noté : ${esc(ev.rep)}.</p>`:''}`}
 return h}
function choixSet(k,r){upd(ixId(E.act,E.cls,k),{},o=>{o.rep=r;o.repAt=Date.now()});toast('Choix enregistré');render()}

/* ================== ENSEIGNANT : feuille d'équipe et match ================== */
function teamScreenT(m){const S=ses(T.act,T.cls),c=clsById(T.cls),P=c&&proto(T.act,S.voie),t=(S.eq||[]).find(x=>x.id===T.tm);
 if(!t||!P){go('cls');return}
 m.innerHTML=`<div class="wrap"><div class="row"><button class="b" onclick="MATCH=null;go('cls')">← Équipes</button><h2 class="h2" style="flex:1;margin:0">${esc(t.nom)} <small class="mut">${(t.el||[]).map(k=>esc(pfirst(c,k))).join(', ')}</small></h2></div><p class="mut">Feuille de l'équipe, comme sur la tablette des élèves : tu peux la corriger.</p>`+
 (MATCH&&T.act==='bad'?(PX={act:T.act,cls:T.cls,c,S,P,J:P.jeu,t,teach:true},matchHtml()):praHtml({act:T.act,cls:T.cls,c,S,P,J:P.jeu,t,teach:true}))+'</div>'}
function matchScreenT(m){const S=ses(T.act,T.cls),c=clsById(T.cls),P=c&&proto(T.act,S.voie);if(!P){go('cls');return}
 PX={act:'bad',cls:T.cls,c,S,P,J:P.jeu,t:null,teach:true};MATCH=T.mt;const h=matchHtml();if(!MATCH){go('cls');return}
 m.innerHTML=`<div class="wrap">${h.replace('onclick="MATCH=null;render()"','onclick="MATCH=null;go(\'cls\')"')}</div>`}
