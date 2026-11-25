/* ================== 👁 OBSERVATION (élèves observateurs et enseignant) ==================
   Grilles d'observation tirées des critères du protocole, modifiables (P.obs). Types :
   deg   : choisir le degré de l'AFLP (descripteurs du protocole)
   check : critères observables, réussi ✓ / à améliorer ✗
   count : compteurs (frappes, actions…) touchés pendant la pratique
   Enregistrements « os:<act>:<classe>:<élève observé>:<id> » = {k, by, t, v:{idItem: valeur}} */
function obsDef(act){
 if(act==='esc')return [
  {id:'s1',afl:'p1',type:'wall',titre:'Grimpe chronométrée sur le mur',opts:['Poussée des jambes','Traction des bras','Pause / repos','Hésitation']},
  {id:'o1',afl:'p2',type:'count',titre:'Action des jambes pendant la grimpe',opts:['Poussée des jambes','Traction des bras','Prise hors d\'atteinte atteinte grâce aux jambes']},
  {id:'o2',afl:'p2',type:'deg',titre:'Utilisation des jambes'},
  {id:'o3',afl:'p1',type:'check',titre:'Projet du grimpeur',opts:['Zone annoncée atteinte','Prises bonus utilisées','Trajet planifié (pas d\'hésitation)']},
  {id:'o4',afl:'p4',type:'check',titre:'Assurage et contre-assurage',opts:['Corde toujours tendue, boucle maintenue','Assurage dynamique (suit le grimpeur)','Aucun fusible sauté','Contre-assureur attentif, mains sur la corde']},
  {id:'o5',afl:'p4',type:'deg',titre:'Assurage'}];
 if(act==='bad')return [
  {id:'s1',afl:'p2',type:'court',titre:'Terrain interactif : où tombe le volant ?',opts:['Amorti','Dégagement','Smash','Lob','Contre-amorti']},
  {id:'o1',afl:'p2',type:'count',titre:'Frappes utilisées',opts:['Amorti','Dégagement','Smash','Lob','Contre-amorti']},
  {id:'o2',afl:'p2',type:'deg',titre:'Panel de frappes'},
  {id:'o3',afl:'p1',type:'check',titre:'Stratégie',opts:['Joue dans les zones de sa stratégie','Varie ses zones pour cacher sa stratégie','Marque des points directs dans sa stratégie','N\'attend pas la faute de l\'adversaire']},
  {id:'o4',afl:'p1',type:'deg',titre:'Choix stratégiques'}];
 if(act==='ct')return [
  {id:'s1',afl:'p2',type:'fc',titre:'Fréquence cardiaque et zone cible',opts:['10']},
  {id:'o1',afl:'p1',type:'check',titre:'Motricité sécuritaire',opts:['Trajet','Respiration','Posture','Amplitude','Rythme']},
  {id:'o2',afl:'p1',type:'deg',titre:'Production sécuritaire'},
  {id:'o3',afl:'p2',type:'check',titre:'Données et régulation',opts:['Relève sa FC aux moments prévus','Note ses ressentis','Régule entre les rounds avec les données','Utilise la réchappe si besoin']},
  {id:'o4',afl:'p2',type:'deg',titre:'Recueil des données'}];
 return []}
function obsList(P){return P.obs||obsDef(P.act)}
function aflAny(P,id){return P.fin.afl.find(a=>a.id===id)||aflFil(P,id)}
function degTxt(a,d){const g=a&&a.deg[d];return g==null?'':typeof g==='string'?g:g.t}
function obsRecs(act,cls,k){return items('os:'+act+':'+cls+':'+(k?k+':':'')).sort((a,b)=>(b.t||0)-(a.t||0))}

/* ---------- écran d'observation (élève ou enseignant) ---------- */
let OBS={k:'',by:'',v:{},start:0};
function obsHtml(ctx){const {P,c,S}=ctx,L=obsList(P),mem=ctx.t?(ctx.t.el||[]):people(c).map(p=>p.k),all=people(c).map(p=>p.k);
 if(!L.length)return '<p class="mut">Pas de grille d\'observation pour cette activité.</p>';
 const pool=ctx.teach?all:(ctx.t?Array.from(new Set(mem.concat(...(S.eq||[]).map(t=>t.el||[])))):all);
 let h=`<p class="mut">Choisis l'élève que tu observes, puis remplis les supports pendant qu'il pratique : le retour s'affiche tout de suite. Les critères viennent du protocole du CCF.</p>
 <p class="lab">J'observe</p><div class="chips">${pool.map(k=>`<button class="chip${OBS.k===k?' on':''}" onclick="obsPick('${k}')">${esc(pname(c,k))}</button>`).join('')}</div>`;
 if(!OBS.k)return h;
 if(!ctx.teach)h+=`<p class="lab">Je suis</p><div class="chips">${mem.filter(k=>k!==OBS.k).map(k=>`<button class="chip${OBS.by===k?' on':''}" onclick="OBS.by='${k}';render()">${esc(pfirst(c,k))}</button>`).join('')||'<span class="mut">—</span>'}</div>`;
 L.forEach(it=>{const a=aflAny(P,it.afl),v=OBS.v[it.id];
  h+=`<div class="afl obs"><div class="afh"><b>${esc(a?a.code:'')}</b><span class="dcl">${esc(it.titre)}</span></div>`;
  if(it.type==='deg')h+=`<div class="degs">${(a?a.deg:[]).map((g,d)=>`<button class="dg d${d}${v===d?' on':''}" onclick="obsSet('${it.id}',${d})"><b>Degré ${d+1}</b><span>${nl2br(degTxt(a,d))}</span></button>`).join('')}</div>`;
  if(it.type==='check')h+=`<div class="ock">${(it.opts||[]).map((o,i)=>{const x=(v||{})[i];return `<div class="ocr"><span>${esc(o)}</span><button class="b s${x===1?' p':''}" onclick="obsChk('${it.id}',${i},1)">✓ réussi</button><button class="b s${x===0?' ko':''}" onclick="obsChk('${it.id}',${i},0)">✗ à améliorer</button></div>`}).join('')}</div>`;
  if(OBSX[it.type])h+=OBSX[it.type].ui(it,v,ctx);
  if(it.type==='count'){const tot=(it.opts||[]).reduce((s,o,i)=>s+((v||{})[i]||0),0);h+=`<div class="ocn">${(it.opts||[]).map((o,i)=>{const n=(v||{})[i]||0;return `<div class="occ"><button class="ocb" onclick="obsCnt('${it.id}',${i},1)"><b>${n}</b><span>${esc(o)}</span></button><button class="b s" onclick="obsCnt('${it.id}',${i},-1)" ${n?'':'disabled'}>−1</button><i style="width:${tot?Math.round(100*n/tot):0}%"></i></div>`}).join('')}</div>`}
  h+='</div>'});
 h+=`<label>Remarque (facultatif)<textarea rows="2" onchange="OBS.rq=this.value">${esc(OBS.rq||'')}</textarea></label><div class="row end"><button class="b" onclick="obsReset()">Effacer</button><button class="b p" onclick="obsSave(${ctx.teach?1:0})" ${Object.keys(OBS.v).length?'':'disabled'}>✓ Enregistrer l'observation</button></div>`;
 const R=obsRecs(ctx.act,ctx.cls,OBS.k);if(R.length)h+=`<h3 class="h3">Observations déjà faites sur ${esc(pfirst(c,OBS.k))}</h3>`+obsSummary(P,c,R);
 return h}
function obsPick(k){if(OBS.k!==k)OBS={k,by:OBS.by,v:{},start:Date.now()};render()}
function obsSet(id,d){OBS.v[id]=OBS.v[id]===d?undefined:d;if(OBS.v[id]===undefined)delete OBS.v[id];render()}
function obsChk(id,i,x){const o=OBS.v[id]||(OBS.v[id]={});o[i]=o[i]===x?undefined:x;if(o[i]===undefined)delete o[i];render()}
function obsCnt(id,i,d){const o=OBS.v[id]||(OBS.v[id]={});o[i]=Math.max(0,(o[i]||0)+d);render()}
function obsReset(){OBS.v={};OBS.rq='';render()}
function obsSave(teach){const ctx=PXO;if(!teach&&!OBS.by){toast('Indique qui observe');return}const id=uid();
 put('os:'+ctx.act+':'+ctx.cls+':'+OBS.k+':'+id,{k:OBS.k,by:teach?'prof':OBS.by,t:Date.now(),v:clone(OBS.v),rq:OBS.rq||''});
 toast('Observation enregistrée');OBS.v={};OBS.rq='';render()}
/* synthèse des observations reçues (fiche enseignant, écran élève) */
function obsSummary(P,c,R,ctx,k){const L=obsList(P);ctx=ctx||PXO;k=k||(R[0]&&R[0].k);
 return `<div class="obsum">${L.map(it=>{const a=aflAny(P,it.afl),vals=R.map(r=>r.v&&r.v[it.id]).filter(v=>v!=null);if(!vals.length)return '';
  if(OBSX[it.type])return `<div><b>${esc(a?a.code:'')} · ${esc(it.titre)}</b>${OBSX[it.type].sum(it,vals,ctx,k)}</div>`;
  let body='';if(it.type==='deg')body=vals.map((d,i)=>`<span class="pill">D${d+1}</span>`).join(' ');
  if(it.type==='check')body=(it.opts||[]).map((o,i)=>{const ok=vals.filter(v=>v[i]===1).length,ko=vals.filter(v=>v[i]===0).length;return ok+ko?`${esc(o)} : <b>${ok}✓ ${ko}✗</b>`:''}).filter(Boolean).join(' · ');
  if(it.type==='count'){const t=(it.opts||[]).map((o,i)=>vals.reduce((s,v)=>s+(v[i]||0),0));body=(it.opts||[]).map((o,i)=>`${esc(o)} <b>${t[i]}</b>`).join(' · ')}
  return `<p><b>${esc(a?a.code:'')} · ${esc(it.titre)}</b> : ${body}</p>`}).join('')}
 <p class="mut sm">${R.length} observation(s) · ${R.slice(0,6).map(r=>(r.by==='prof'?'toi':esc(pfirst(c,r.by)))+' '+new Date(r.t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})).join(' · ')}${R.filter(r=>r.rq).map(r=>'<br>« '+esc(r.rq)+' »').join('')}</p></div>`}
let PXO=null;
function obsScreenT(m){const c=needCls(m,'👁 Observer');if(!c)return;const S=ses(T.act,c.id),P=proto(T.act,S.voie);if(!P){m.innerHTML='<div class="wrap">'+noProto(S)+'</div>';return}
 PXO={act:T.act,cls:c.id,c,S,P,teach:true};if(T.el&&!OBS.k)OBS.k=T.el;
 m.innerHTML=`<div class="wrap"><div class="row"><button class="b" onclick="go(T.el?'fiche':'eval')">← ${T.el?'Fiche':'Classe'}</button><h2 class="h2" style="flex:1;margin:0">👁 Observer · ${esc(ACTS[T.act].nom)}</h2><button class="b s" onclick="go('edit',{pv:'${S.voie}'})">✏️ Modifier les critères</button></div>${clsChips()}${OBS.k?'<button class="b s" onclick="OBS={k:\'\',by:\'\',v:{}};render()">📊 Retour de la classe</button>':''}${obsHtml(PXO)}${OBS.k?'':classBoard(PXO)}</div>`}
/* éditeur des grilles d'observation (dans Modifier le protocole) */
function obsEditHtml(P){const L=P.obs||(P.obs=obsDef(P.act)),A=P.fin.afl.concat(P.fil.afl);
 return `<div class="card"><h3 class="h3">👁 Grilles d'observation (élèves observateurs)</h3><p class="mut sm">Critères observés pendant la pratique. « Degrés » reprend les descripteurs de l'AFLP choisi ; « Critères ✓/✗ » et « Compteurs » : une ligne par critère.</p>
 ${L.map((it,i)=>`<div class="eda"><div class="g3"><label>Titre<input data-p="obs.${i}.titre" value="${esc(it.titre)}"></label><label>AFLP<select data-p="obs.${i}.afl">${A.map(a=>`<option value="${a.id}"${a.id===it.afl?' selected':''}>${esc(a.code)}</option>`).join('')}</select></label><label>Type<select data-p="obs.${i}.type" data-re="1">${[['deg','Degrés de l\'AFLP'],['check','Critères ✓ / ✗'],['count','Compteurs']].concat(Object.keys(OBSX).map(k=>[k,OBSX[k].lab])).map(([v,t])=>`<option value="${v}"${it.type===v?' selected':''}>${t}</option>`).join('')}</select></label></div>
 ${it.type!=='deg'?`<label>${it.type==='court'?'Frappes (une par ligne)':it.type==='wall'?'Actions observées (une par ligne)':it.type==='fc'?'Marge autour de la FC cible (bpm)':'Critères (une ligne par critère)'}<textarea rows="3" data-p="obs.${i}.opts">${esc((it.opts||[]).join('\n'))}</textarea></label>`:''}<div class="row end"><button class="b s" onclick="obsMv(${i},-1)" ${i?'':'disabled'}>↑</button><button class="b s" onclick="obsMv(${i},1)" ${i<L.length-1?'':'disabled'}>↓</button><button class="b s" onclick="EDP.obs.splice(${i},1);render()">🗑 Retirer</button></div></div>`).join('')}
 <div class="row wrapf"><button class="b s" onclick="EDP.obs.push({id:'o'+uid(),afl:EDP.fin.afl[0].id,type:'check',titre:'Nouveau critère',opts:['Critère 1']});render()">➕ Ajouter une grille</button><button class="b s" onclick="if(confirm('Remettre les grilles proposées au départ ?')){EDP.obs=obsDef(EDP.act);render()}">↺ Grilles de départ</button></div></div>`}
function obsMv(i,d){const L=EDP.obs,j=i+d;[L[i],L[j]]=[L[j],L[i]];render()}
