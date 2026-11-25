/* ================== COURSE D'ORIENTATION ↔ CO ÉVAL ==================
   CO Éval (même site, même tablette) garde ses résultats dans localStorage « coe.srv » = {rows:[{k, t, d:{me:{prenom,nom,classe}, run}}]},
   sa configuration en cours « coe.conf » (C.ev = évaluation en cours) et ses évaluations sauvegardées « coe.arch » = [{id, nom, from, to, cls, conf}].
   Le CCF lit ces données, calcule pour chaque élève ses points annoncés / réalisés, ses balises N2 / N3, son temps, et les range dans
   « cx:ori:<classe>:<élève> » = {src, imp:{…}, ed:{…}} : imp = données importées, ed = corrections de l'enseignant (prioritaires). */
const CO_F=[['ann','Points annoncés (projet)'],['pts','Points réalisés'],['nbPlan','Balises annoncées'],['nb','Balises ramenées'],['n2','dont N2'],['n3','dont N3'],['modif','Postes modifiés / abandonnés'],['oublis','Balises du projet manquées'],['bonus','Balises ou points bonus'],['over','Hors temps (1 = oui)'],['avance','Minutes d\'avance']];
function coLS(k,d){try{const v=localStorage.getItem('coe.'+k);return v?JSON.parse(v):d}catch(e){return d}}
function coNorm(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z]+/g,' ').trim().split(' ').filter(Boolean).sort().join(' ')}
function coSources(){const srv=coLS('srv',{rows:[]}),rows=(srv.rows||[]).filter(r=>r&&r.d&&r.d.me&&r.d.run),conf=coLS('conf',null),arch=coLS('arch',[])||[],L=[];
 const inWin=(r,a,b)=>{const t=r.d.run.t0||r.t||0;return t>=(a||0)&&t<(b||9e15)};
 if(conf){const from=(conf.ev&&conf.ev.date)||0;L.push({id:'cur',nom:(conf.ev&&conf.ev.nom)||'Évaluation en cours',conf,rows:rows.filter(r=>inWin(r,from,9e15))})}
 arch.forEach(a=>{if(a&&a.conf)L.push({id:a.id,nom:a.nom||'Évaluation sauvegardée',conf:a.conf,rows:rows.filter(r=>inWin(r,a.from,a.to)),date:a.to})});
 return L.filter(x=>x.rows.length)}
/* une course (format compact de CO Éval) → chiffres */
function coRun(conf,row,J){const x=row.d.run,p=(conf.parcours||[])[row.k]||{},niv=n=>{const b=(conf.balises||[]).find(b=>+b.n===+n);const v=b?+b.niv||0:0;return v===2?J.n2:v===3?J.n3:v};
 const S=(x.s||[]).map(s=>({code:s[1],att:s[2],st:s[3],bal:s[4]})),ok=new Set();S.forEach(s=>{if(['ok','saut','retour'].includes(s.st)&&s.bal!=null)ok.add(+s.bal)});
 const plan=(x.p||[]).map(Number),found=plan.filter(n=>ok.has(n)),extra=[...ok].filter(n=>!plan.includes(n));
 const lv=n=>{const b=(conf.balises||[]).find(b=>+b.n===+n);return b?+b.niv||0:0};
 const chrono=((x.t1||x.t0)-x.t0)/60000,max=+p.max||0;
 return {k:row.k,nom:p.nom||'Parcours '+(+row.k+1),duo:p.type==='duo',ann:plan.reduce((a,n)=>a+niv(n),0),pts:found.reduce((a,n)=>a+niv(n),0)+extra.reduce((a,n)=>a+niv(n),0),nbPlan:plan.length,nb:found.length+extra.length,
  n2:found.concat(extra).filter(n=>lv(n)===2).length,n3:found.concat(extra).filter(n=>lv(n)===3).length,modif:S.filter(s=>s.st==='passe'||s.st==='retour').length,oublis:plan.length-found.length,bonus:extra.length,
  over:max&&chrono>max?1:0,avance:max?Math.max(0,Math.round(max-chrono)):0,min:Math.round(chrono*10)/10,faux:S.filter(s=>s.st==='faux'||s.st==='hors').length}}
function coImport(srcId){const src=coSources().find(s=>s.id===srcId),c=clsById(T.cls);if(!src||!c)return;const P=proto('ori',ses('ori',c.id).voie)||proto('ori','gt'),J=P.jeu;
 const byName={};people(c).forEach(p=>byName[coNorm(p.full)]=p.k);const R={},miss=new Set();
 src.rows.forEach(r=>{const me=r.d.me,k=byName[coNorm((me.prenom||'')+' '+(me.nom||''))];if(!k){if(!me.classe||coNorm(me.classe)===coNorm(c.nom))miss.add((me.prenom||'')+' '+(me.nom||''));return}
  (R[k]=R[k]||{}).runs=(R[k].runs||[]).concat(coRun(src.conf,r,J))});
 Object.keys(R).forEach(k=>{const L=R[k].runs,imp={runs:L};['ann','pts','nbPlan','nb','n2','n3','modif','oublis','bonus'].forEach(f=>imp[f]=L.reduce((a,x)=>a+(x[f]||0),0));imp.over=L.some(x=>x.over)?1:0;imp.avance=L.length?Math.min(...L.map(x=>x.avance)):0;
  upd('cx:ori:'+c.id+':'+k,{ed:{}},o=>{o.src=src.nom;o.imp=imp;o.ed=o.ed||{};o.t=Date.now()})});
 toast(Object.keys(R).length+' élève(s) importé(s) de « '+src.nom+' »'+(miss.size?' · '+miss.size+' nom(s) non reconnu(s)':''));
 if(miss.size)setTimeout(()=>alert('Noms de CO Éval non trouvés dans la liste '+c.nom+' :\n'+[...miss].join('\n')+'\n\nVérifie l\'orthographe dans les listes, ou saisis leurs données dans leur fiche.'),300);render()}
function coVal(cls,k){const o=get('cx:ori:'+cls+':'+k);if(!o)return null;const v={};CO_F.forEach(([f])=>{const e=(o.ed||{})[f];v[f]=e!=null&&e!==''?+e:o.imp?o.imp[f]:null});v.runs=(o.imp||{}).runs||[];v.src=o.src||'';v.edited=Object.keys(o.ed||{}).filter(f=>o.ed[f]!=null&&o.ed[f]!=='').length;return v}
function coEdit(k,f,v){upd('cx:ori:'+T.cls+':'+k,{ed:{}},o=>{o.ed=o.ed||{};o.ed[f]=v===''?null:+String(v).replace(',','.')})}

/* ---------- carte d'import (onglet Évaluation) ---------- */
function coImportCard(c){const L=coSources(),nb=people(c).filter(p=>get('cx:ori:'+c.id+':'+p.k)).length;
 return `<div class="card soft"><b>📥 Résultats de CO Éval</b> <span class="mut sm">${nb} élève(s) de ${esc(c.nom)} ont déjà des données</span>
 ${L.length?`<div class="row wrapf" style="margin-top:6px">${L.map(s=>{const n=s.rows.filter(r=>!r.d.me.classe||coNorm(r.d.me.classe)===coNorm(c.nom)).length;return `<button class="b s" onclick="coImport('${s.id}')">📥 ${esc(s.nom)} <small class="mut">(${s.rows.length} course(s)${n?', '+n+' de la classe':''})</small></button>`}).join('')}</div>`:
 `<p class="sm">Aucun résultat de CO Éval sur cette tablette. Ouvre <a href="../co-eval/" target="_blank">CO Éval</a> en mode enseignant sur cette tablette (les résultats se chargent), puis reviens ici. Tu peux aussi saisir les données dans la fiche de chaque élève.</p>`}
 <div class="row wrapf" style="margin-top:6px"><button class="b p" onclick="coPositionClass()">💡 Positionner toute la classe (degrés, notes, répartition)</button><span class="mut sm">Seulement les élèves pas encore notés ; tu ajustes ensuite chaque fiche.</span></div></div>`}
/* positionnement de toute la classe : degrés proposés, note dans le degré selon le niveau des balises, répartition proposée */
function coPositionClass(){const c=clsById(T.cls),S=ses(T.act,c.id),P=proto(T.act,S.voie);if(!P)return;let n=0;
 people(c).forEach(p=>{const ctx={act:T.act,cls:c.id,c,S,P},v=coVal(c.id,p.k),ev0=evOf(T.act,c.id,p.k);if(ev0.st)return;let ch=0;
  upd(evId(T.act,c.id,p.k),{},e=>{e.fin=e.fin||{};e.fil=e.fil||{};
   P.fin.afl.forEach(a=>{if(e.fin[a.id]&&e.fin[a.id].d!=null)return;const pr=propose(P,ctx,p.k,a.id);if(!pr)return;const g=a.deg[pr.d],r=v&&v.nb?v.n3/v.nb:.5;e.fin[a.id]={d:pr.d,v:q25(g.min+(g.max-g.min)*r)};ch=1});
   P.fil.retenus.forEach(id=>{if(e.fil[id]&&e.fil[id].d!=null)return;const pr=propose(P,ctx,p.k,id);if(pr){e.fil[id]={d:pr.d};ch=1}});
   const ix=ixOf(T.act,c.id,p.k);if(!e.rep&&!ix.rep){const rp=repPropose(P,ctx,p.k);if(rp){e.rep=rp.r;ch=1}}});if(ch)n++});
 toast(n?n+' élève(s) positionné(s) : vérifie et ajuste chaque fiche':'Rien à positionner (déjà noté ou pas de données)');render()}

/* ---------- fiche élève : données de la course, modifiables ---------- */
function coFicheHtml(X){const v=coVal(X.cls,X.k)||{runs:[]},o=get('cx:ori:'+X.cls+':'+X.k)||{};
 return `<div class="card"><b>🧭 Données de la course</b> <span class="mut sm">${v.src?'importées de CO Éval · « '+esc(v.src)+' »':'pas encore importées'}${v.edited?' · '+v.edited+' valeur(s) corrigée(s) par toi':''}</span>
 ${v.runs.length?`<div class="tblw" style="margin:6px 0"><table class="tbl"><thead><tr><th>Parcours</th><th>Annoncé</th><th>Réalisé</th><th>Balises</th><th>N2 / N3</th><th>Temps</th><th>Modifs</th></tr></thead><tbody>${v.runs.map(r=>`<tr><td>${esc(r.nom)}${r.duo?' 👥':''}</td><td>${r.ann} pts</td><td><b>${r.pts} pts</b></td><td>${r.nb} / ${r.nbPlan}</td><td>${r.n2} / ${r.n3}</td><td>${fr(r.min)} min${r.over?' ⚠ hors temps':''}</td><td>${r.modif}${r.oublis?' · '+r.oublis+' manquée(s)':''}</td></tr>`).join('')}</tbody></table></div>`:''}
 <div class="g4 cof">${CO_F.map(([f,l])=>{const imp=o.imp?o.imp[f]:null,ed=(o.ed||{})[f];return `<label>${esc(l)}<input type="number" inputmode="decimal" value="${ed!=null&&ed!==''?esc(ed):imp!=null?esc(imp):''}" class="${ed!=null&&ed!==''?'edt':''}" onchange="coEdit('${X.k}','${f}',this.value);render()">${ed!=null&&ed!==''&&imp!=null?`<small>CO Éval : ${esc(imp)}</small>`:''}</label>`}).join('')}</div>
 <p class="mut sm">Corrige ou complète librement : la valeur corrigée (en jaune) remplace celle de CO Éval et sert aux propositions de degré.</p></div>`}

/* ---------- propositions de degré d'après les données (utilisées par propose()) ---------- */
function coSuggest(auto,P,ctx,k){const v=coVal(ctx.cls,k);if(!v)return null;const J=P.jeu;
 if(auto==='co-pts'){if(v.ann==null||v.pts==null||!v.ann)return null;const d=v.pts<v.ann?0:v.pts>v.ann?3:v.modif>0?1:2;return {d,src:'points réalisés '+v.pts+' / annoncés '+v.ann+(v.modif?', '+v.modif+' poste(s) modifié(s)':'')}}
 if(auto==='co-dep'){if(v.nb==null)return null;const d=v.over?0:v.oublis>0?1:(v.nb&&v.n3===v.nb&&v.avance>=J.avance)?3:v.n3>v.n2?2:1;return {d,src:(v.over?'hors temps':'dans les temps'+(v.avance?' ('+v.avance+' min d\'avance)':''))+', N2 '+v.n2+' / N3 '+v.n3+(v.oublis?', '+v.oublis+' balise(s) manquée(s)':'')}}
 if(auto==='co-plan'){if(v.nb==null)return null;const mn=J.nMinF;const d=v.nbPlan&&v.nb<v.nbPlan/2?0:(v.modif||v.oublis)?1:v.nb>=mn?((v.bonus||0)>0||v.pts>v.ann?3:2):1;return {d,src:v.nb+' balises (minimum '+J.nMinF+' / '+J.nMinG+'), '+(v.modif||v.oublis?'projet modifié':'projet respecté')+(v.bonus?', '+v.bonus+' bonus':'')}}
 if(auto==='co-coop'){const ind=v.runs.filter(r=>!r.duo);if(!ind.length)return null;const miss=ind.reduce((a,r)=>a+r.oublis,0),col=v.runs.filter(r=>r.duo),colOk=col.length&&col.every(r=>!r.oublis);return {d:miss?1:colOk?3:2,src:'parcours individuels : '+(miss?miss+' balise(s) manquée(s)':'toutes les balises')+(col.length?', collectif '+(colOk?'complet':'incomplet'):'')}}
 return null}
function coAide(auto,P,X){const s=coSuggest(auto,P,X,X.k);return s?`<p>${esc(s.src)} → plutôt <b>degré ${s.d+1}</b></p>`:'<p class="mut">Pas de données de course : importe CO Éval (onglet Évaluation) ou saisis-les dans « Données de la course ».</p>'}

/* ---------- élève : feuille projet (KIFEKOI) du binôme ---------- */
function coHtml(){const F=F0(),mem=memNames(),J=PX.J,cartes=[['col','Parcours collectif (à deux)'],['i1','Parcours individuel 1'],['i2','Parcours individuel 2']];
 let h=`<p class="mut">Les courses se font avec <a href="../co-eval/" target="_blank">CO Éval</a>. Ici, le binôme prépare son projet (KIFEKOI) : ordre des balises, points annoncés (N2 = ${J.n2} pts, N3 = ${J.n3} pts), réchappes, répartition des cartes. ${J.nMinF} balises à ramener pour les filles, ${J.nMinG} pour les garçons.</p>
 <div class="row wrapf">${tmHtml('cop','Planification du projet commun',J.tPlan*60)}${tmHtml('cor','Répartition des parcours',J.tRep*60)}</div>`;
 cartes.forEach(([id,l])=>{const x=(F.cartes||{})[id]||{};h+=`<div class="card"><b>${l}</b>${id!=='col'?`<div class="row wrapf"><span class="lab">Qui court ?</span>${mem.map(m=>`<button class="b s${x.qui===m.k?' p':''}" onclick="coSet('${id}','qui','${m.k}')">${esc(m.n)}</button>`).join('')}</div>`:''}
  <div class="g3"><label>Balises annoncées, dans l'ordre<input value="${esc(x.ordre||'')}" placeholder="ex. 7, 2, 9, 14" onchange="coSet('${id}','ordre',this.value,1)"></label><label>Nombre de N2<input type="number" value="${esc(x.n2||'')}" onchange="coSet('${id}','n2',this.value)"></label><label>Nombre de N3<input type="number" value="${esc(x.n3||'')}" onchange="coSet('${id}','n3',this.value)"></label></div>
  <div class="g2"><label>Balises de réchappe / bonus<input value="${esc(x.rech||'')}" onchange="coSet('${id}','rech',this.value,1)"></label><div class="big" style="align-self:end">Points annoncés : <b>${(+x.n2||0)*J.n2+(+x.n3||0)*J.n3}</b></div></div></div>`});
 const tot=cartes.reduce((a,[id])=>{const x=(F.cartes||{})[id]||{};return a+(+x.n2||0)*J.n2+(+x.n3||0)*J.n3},0);
 h+=`<div class="card big">Projet de points du binôme : <b>${tot} pts</b></div><label>Point de rendez-vous / échange de cartes<input value="${esc(F.rdv||'')}" onchange="tmUpd(F=>F.rdv=this.value,1)"></label>${mem.map(m=>repInline(m.k)).join('')}`;
 return h}
function coSet(id,f,v,keep){tmUpd(F=>{F.cartes=F.cartes||{};F.cartes[id]=F.cartes[id]||{};F.cartes[id][f]=v},keep)}
/* document à imprimer : KIFEKOI */
function pdCoKif(c,S,P){const J=P.jeu;return teamsOr(S,6,2).map(t=>pg(`${pdHead(P,S,c,'KIFEKOI · projet du binôme',t.nom)}<p>${t.el.map(k=>nm(c,k)).join(' · ')} · N2 = ${J.n2} pts, N3 = ${J.n3} pts · ${J.nMinF} balises filles / ${J.nMinG} garçons</p>
 ${['Parcours collectif (à deux)','Parcours individuel 1 · coureur : …………………','Parcours individuel 2 · coureur : …………………'].map(x=>`<h4>${x}</h4><table class="ptb"><tr><th style="width:150px">Ordre des balises</th>${Array.from({length:12},(_,i)=>`<td class="c" style="height:30px">${i+1}<br>…</td>`).join('')}</tr><tr><th>Niveau (N2 / N3)</th>${Array.from({length:12},()=>'<td></td>').join('')}</tr></table><p class="sm">Points annoncés : ……… · Réchappes / bonus : …………………………… · Réalisé : ……… pts</p>`).join('')}
 <p>Point de rendez-vous : ……………………………… &nbsp; <b>Projet de points du binôme : ……… pts</b></p>
 <p>🙋 Répartition (annoncée avant l'épreuve) : ${t.el.map(k=>`${nm(c,k)} : ${P.fil.reps.map(r=>'☐ '+r).join(' ')}`).join(' &nbsp;·&nbsp; ')}</p>`)).join('')}
