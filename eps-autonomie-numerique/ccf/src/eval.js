/* ================== NOTES DU CCF ==================
   Fin de séquence : chaque AFLP noté (degré d 0-3 + valeur v dans la fourchette du degré, au 0,25).
   Fil de séquence : 2 AFLP retenus, répartition choisie par l'élève (4-4, 6-2, 2-6), degré → points du barème. */
const evId=(act,cls,k)=>'ev:'+act+':'+cls+':'+k, ixId=(act,cls,k)=>'ix:'+act+':'+cls+':'+k;
function evOf(act,cls,k){return get(evId(act,cls,k))||{}}
function ixOf(act,cls,k){return get(ixId(act,cls,k))||{}}
function repOf(P,ev,ix){const r=ev.rep||ix.rep;return P&&P.fil.reps.includes(r)?r:null}
function q25(x){return Math.round(x*4)/4}
function finV(a,x){if(!x||x.d==null)return null;const g=a.deg[x.d];if(!g)return null;let v=x.v==null?g.max:+x.v;return Math.min(g.max,Math.max(g.min,v))}
function filV(P,ev,ix,i){const id=P.fil.retenus[i],x=ev.fil&&ev.fil[id];if(!x||x.d==null)return null;const rep=repOf(P,ev,ix)||P.fil.reps[0],pts=repPts(rep)[i],B=P.fil.bareme[pts];return B?B[x.d]:null}
function notes(P,ev,ix){const R={fin:0,fil:0,tot:null,ok:true,aff:[],stat:ev.st||''};if(!P)return R;
 P.fin.afl.forEach(a=>{const v=finV(a,ev.fin&&ev.fin[a.id]);R.aff.push(v);if(v==null)R.ok=false;else R.fin+=v});
 [0,1].forEach(i=>{const v=filV(P,ev,ix,i);R.aff.push(v);if(v==null)R.ok=false;else R.fil+=v});
 R.tot=R.ok?q25(R.fin+R.fil):null;R.part=R.fin+R.fil;return R}
function finMax(P){return P.fin.afl.reduce((s,a)=>s+(+a.pts||0),0)}

/* ================== AIDES AU POSITIONNEMENT (données de la forme de pratique) ================== */
function escPassOf(act,cls,S,k){const t=teamOf(S,k);if(!t)return null;const F=get('tm:'+act+':'+cls+':'+t.id);if(!F)return null;return {F,p:(F.pass||[]).find(x=>x.el===k)||null}}
function escSuggest(J,p){if(!p||p.dg==null||p.dg===''||!p.zone)return null;const zr=escZoneOf(J,p.dg);if(+zr===+p.zone)return {d:3,t:'zone annoncée atteinte : projet respecté'};
 const diff=Math.abs(+p.dg-escZoneBorne(J,+p.zone));return {d:diff<=1?2:diff<=2?1:0,t:'écart de '+diff+' dégaine'+(diff>1?'s':'')+' avec la hauteur annoncée'}}
function dgTxt(J,dg){return dg==null||dg===''?'—':+dg>J.nDeg?'TOP':+dg===0?'sous D1':'D'+dg}
function aideHtml(auto,P,ctx){if(auto&&auto.indexOf('co-')===0)return coAide(auto,P,ctx);const J=P.jeu,{act,cls,S,k}=ctx,c=clsById(cls);
 if(auto==='esc-projet'){const x=escPassOf(act,cls,S,k),p=x&&x.p;if(!p)return '<p class="mut">Pas encore de passage enregistré pour cet élève.</p>';
  const r=escPts(J,p),sg=escSuggest(J,p);return `<p>Zone annoncée : <b>Z${p.zone||'?'}</b> (${p.zone?dgTxt(J,escZoneBorne(J,+p.zone)):''}) · atteint : <b>${dgTxt(J,p.dg)}</b> (zone ${r.zr==null?'—':r.zr}) · points : <b>${r.tot}</b></p>${sg?`<p>Suggestion : <b>degré ${sg.d+1}</b> (${esc(sg.t)}) <button class="b s" onclick="ficheDeg('${P.fin.afl[0].id}',${sg.d})">Choisir</button></p>`:''}`}
 if(auto==='esc-prises'){const x=escPassOf(act,cls,S,k),p=x&&x.p;if(!p)return '<p class="mut">Pas encore de passage enregistré.</p>';const B=(p.bonus||[]).slice(0,escNbBonus(J,p.zone)).filter(b=>b&&b.z);
  return `<p>Prises bonus : ${B.map(b=>`Z${b.z} ${esc(b.rep||'')} ${b.ok===true?'✅ utilisée':b.ok===false?'❌ oubliée':'…'}`).join(' · ')||'aucune'}${x.F.regu?' · régulation : '+esc(x.F.regu):''}</p>`}
 if(auto==='esc-roles'){const t=teamOf(S,k);if(!t)return '<p class="mut">Pas d\'équipe.</p>';const F=get('tm:'+act+':'+cls+':'+t.id)||{};let a=0,cc=0,o=0,fu=0;(F.pass||[]).forEach(p=>{if(p.asr===k){a++;fu+=+p.fus||0}if(p.cas===k)cc++;if(p.obs===k)o++});
  return `<p>Assureur : <b>${a}</b> fois · contre-assureur : <b>${cc}</b> · observateur : <b>${o}</b> · fusibles sautés en assurant : <b>${fu}</b>${a&&cc?'':' · <span class="warn">⚠ les 2 rôles sont obligatoires</span>'}</p>`}
 if(auto==='bad-gain'){const s=badStatsEl(J,cls,k);if(!s.j)return '<p class="mut">Aucun match terminé comme joueur.</p>';const a=P.fin.afl[0];
  return `<p>Matchs gagnés : <b>${s.v} / ${s.j}</b> · points marqués : <b>${s.pts}</b>. <button class="b s" onclick="ficheGain(${s.v},${s.j})">Placer dans le degré selon les matchs gagnés</button></p>`}
 if(auto==='bad-strat'){const s=badStatsEl(J,cls,k);return `<p>Comme coach : <b>${s.coach}</b> match${s.coach>1?'s':''} · changements de stratégie : <b>${s.chg}</b> · stratégies adverses devinées : <b>${s.dev}</b>${s.arb?' · arbitre : '+s.arb:''}</p>`}
 if(auto==='bad-orga'){const t=teamOf(S,k);if(!t)return '<p class="mut">Pas de binôme.</p>';const M=badMatches(cls).filter(m=>(m.a||{}).eq===t.id||(m.b||{}).eq===t.id);
  return `<p>Matchs du binôme : ${M.map(m=>{const R=badCalc(J,m),me=(m.a||{}).eq===t.id?'a':'b',ot=me==='a'?'b':'a',on=(S.eq.find(x=>x.id===(m[ot]||{}).eq)||{}).nom||'?';return `${esc(on)} ${R.over?(R.win===me?'✅':R.win==='='?'=':'❌'):'…'}`}).join(' · ')||'aucun'}</p>`}
 if(auto==='ct-donnees'||auto==='ct-regul'||auto==='ct-muscles'){const t=teamOf(S,k),F=t?get('tm:'+act+':'+cls+':'+t.id)||{}:{},I=ixOf(act,cls,k),fc=(I.fc||[]).length+((F.log||[]).filter(l=>l.k===k&&l.fc).length);
  if(auto==='ct-donnees')return `<p>FC relevées : <b>${fc}</b> · ressentis : ${['mus','resp','fat'].map(x=>I[x]?['','musculaire','respiratoire','fatigue'][['','mus','resp','fat'].indexOf(x)]+' '+I[x]+'/10':'').filter(Boolean).join(' · ')||'non remplis'}${(F.log||[]).some(l=>l.rech)?' · réchappe utilisée':''}</p>`;
  if(auto==='ct-regul')return `<p>Objectif : ${esc((F.obj||{})[k]||'—')} · FC cible : ${esc((F.fcc||{})[k]||'—')} · atteint (élève) : <b>${{oui:'oui',non:'non',part:'en partie'}[I.atteint]||'—'}</b>${(F.log||[]).filter(l=>l.rech).map(l=>' · réchappe : '+esc(l.t||'')).join('')}</p>`;
  return `<p>Exercices et muscles notés par le binôme : ${(F.ex||[]).map(e=>`<b>${esc(e.n)}</b> (${esc(e.m||'?')})`).join(' · ')||'—'}</p>`}
 return ''}
/* résumé de la pratique d'un élève (fiche enseignant, PDF) */
function pratiqueTxt(act,P,cls,S,k){const J=P.jeu,out=[];
 if(act==='ori'){const v=coVal(cls,k);if(v)out.push(`Points réalisés ${v.pts} / annoncés ${v.ann} · ${v.nb} balise(s) (N2 ${v.n2}, N3 ${v.n3})${v.over?' · hors temps':''}${v.modif?' · '+v.modif+' poste(s) modifié(s)':''}`)}
 if(act==='esc'){const x=escPassOf(act,cls,S,k);if(x&&x.p){const p=x.p,r=escPts(J,p);out.push(`Voie ${p.voie||'?'} · zone annoncée Z${p.zone||'?'} · atteint ${dgTxt(J,p.dg)} · ${r.tot} pts (zone ${r.zone}, bonus ${r.bonus>=0?'+':''}${r.bonus})`);
  const T=(x.F.pass||[]).reduce((s,q)=>s+escPts(J,q).tot,0);out.push('Total de l\'équipe : '+T+' pts')}}
 if(act==='bad'){const s=badStatsEl(J,cls,k);out.push(`Joueur : ${s.v}/${s.j} matchs gagnés, ${s.pts} points marqués · coach : ${s.coach} match(s), ${s.chg} changement(s) de stratégie, ${s.dev} stratégie(s) devinée(s)`)}
 if(act==='ct'){const t=teamOf(S,k),F=t?get('tm:'+act+':'+cls+':'+t.id)||{}:{},I=ixOf(act,cls,k);if(F.forme)out.push(`${F.forme}${F.duree?' · '+F.duree+' min':''} · ${(F.ex||[]).length} exercice(s) · objectif : ${(F.obj||{})[k]||'—'} · FC cible ${(F.fcc||{})[k]||'—'}`);
  const tours=(F.log||[]).filter(l=>l.k===k&&l.tour).length;if(tours)out.push(tours+' tour(s) réalisé(s)');if(I.atteint)out.push('Objectif atteint : '+({oui:'oui',non:'non',part:'en partie'}[I.atteint]))}
 return out}
