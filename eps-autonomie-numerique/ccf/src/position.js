/* ================== 💡 POSITIONNEMENT DANS LES AFLP ==================
   propose(P, ctx, k, aflId) → {d, src:[…]} : degré proposé d'après les données (observations des élèves et de l'enseignant,
   supports interactifs, forme de pratique). L'enseignant valide toujours (bouton « Choisir »).
   Auto-positionnement de l'élève : ix.ap = {aflId: degré}, saisi dans « Mon choix » ; affiché 🙋 sur la fiche. */
const lvl=r=>r<.25?0:r<.5?1:r<.8?2:3;
function propose(P,ctx,k,id){const I=[],J=P.jeu,R=obsRecs(ctx.act,ctx.cls,k),L=obsList(P).filter(it=>it.afl===id);
 L.forEach(it=>{const vals=R.map(r=>r.v&&r.v[it.id]).filter(v=>v!=null);if(!vals.length)return;
  if(it.type==='deg')I.push({d:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length),src:'observations « '+it.titre+' » ('+vals.length+')'});
  if(it.type==='check'){let ok=0,n=0;vals.forEach(v=>Object.values(v).forEach(x=>{n++;if(x===1)ok++}));if(n)I.push({d:lvl(ok/n),src:ok+'/'+n+' critères réussis « '+it.titre+' »'})}
  if(it.type==='count'){const t=(it.opts||[]).map((o,i)=>vals.reduce((s,v)=>s+(v[i]||0),0)),nz=t.filter(x=>x).length;if(t.some(x=>x))I.push({d:lvl(nz/Math.max(1,(it.opts||[]).length)),src:nz+' / '+(it.opts||[]).length+' « '+it.titre+' » utilisés'})}
  if(it.type==='court'){const pts=vals.flatMap(v=>v.pts||[]);if(pts.length>=5){const nf=new Set(pts.map(p=>p.f)).size,dr=pts.filter(p=>p.r==='d').length/pts.length;I.push({d:Math.min(3,Math.round((lvl(nf/Math.max(1,(it.opts||[]).length))+lvl(dr*2))/2)),src:'terrain : '+nf+' frappes différentes, '+Math.round(dr*100)+' % de points directs'})}}
  if(it.type==='wall'){const s=vals.filter(v=>v.t0).slice(-1)[0],x=escPassOf(ctx.act,ctx.cls,ctx.S,k);if(s&&x&&x.p&&x.p.zone){const cur=wallCur(s),sg=escSuggest(J,{zone:x.p.zone,dg:cur>J.nDeg?J.nDeg+1:cur});if(sg)I.push({d:sg.d,src:'grimpe observée : '+sg.t})}}
  if(it.type==='fc'){const all=vals.flatMap(v=>(v.m||[]).map(m=>m.fc)),c=fcCible(ctx,k),mg=+(it.opts||[])[0]||10;if(all.length&&c)I.push({d:lvl(all.filter(f=>Math.abs(f-c)<=mg).length/all.length),src:'FC dans la zone cible : '+all.filter(f=>Math.abs(f-c)<=mg).length+'/'+all.length})}});
 /* données de la forme de pratique */
 const a=aflAny(P,id)||{},auto=a.auto;
 if(auto==='esc-projet'){const x=escPassOf(ctx.act,ctx.cls,ctx.S,k),sg=x&&x.p&&escSuggest(J,x.p);if(sg)I.push({d:sg.d,src:'passage du CCF : '+sg.t})}
 if(auto==='esc-prises'){const x=escPassOf(ctx.act,ctx.cls,ctx.S,k),p=x&&x.p;if(p&&p.done){const B=(p.bonus||[]).slice(0,escNbBonus(J,p.zone)).filter(b=>b&&b.z),ko=B.filter(b=>b.ok===false).length,zr=escZoneOf(J,p.dg);I.push({d:+zr===+p.zone&&!ko?3:ko===1?2:+zr===+p.zone?1:0,src:'projet : '+(+zr===+p.zone?'hauteur respectée':'hauteur non respectée')+', '+ko+' prise(s) oubliée(s)'})}}
 if(auto==='esc-roles'){const t=teamOf(ctx.S,k),F=t?get('tm:'+ctx.act+':'+ctx.cls+':'+t.id)||{}:{};let as=0,cas=0,fu=0;(F.pass||[]).forEach(p=>{if(p.asr===k){as++;fu+=+p.fus||0}if(p.cas===k)cas++});if(as||cas)I.push({d:!(as&&cas)?0:fu>1?1:fu?2:3,src:'rôles : assureur '+as+', contre-assureur '+cas+', fusibles sautés '+fu})}
 if(auto==='bad-strat'){const s=badStatsEl(J,ctx.cls,k);if(s.coach)I.push({d:s.chg===0?0:s.dev?3:2,src:'coach : '+s.chg+' changement(s) de stratégie'})}
 if(auto==='ct-regul'){const ix=ixOf(ctx.act,ctx.cls,k);if(ix.atteint)I.push({d:{oui:3,part:2,non:1}[ix.atteint],src:'objectif atteint (élève) : '+{oui:'oui',part:'en partie',non:'non'}[ix.atteint]})}
 if(auto==='ct-donnees'){const ix=ixOf(ctx.act,ctx.cls,k),t=teamOf(ctx.S,k),F=t?get('tm:'+ctx.act+':'+ctx.cls+':'+t.id)||{}:{},n=(F.log||[]).filter(l=>l.k===k&&l.fc).length+(ix.fc||[]).length,res=['mus','resp','fat'].filter(x=>ix[x]).length,rech=(F.log||[]).some(l=>l.rech);if(n||res)I.push({d:n>=4&&res===3?(rech?3:2):n>=2?1:0,src:n+' FC relevées, '+res+'/3 ressentis'+(rech?', réchappe utilisée':'')})}
 if(!I.length)return null;return {d:Math.round(I.reduce((s,x)=>s+x.d,0)/I.length),src:I.map(x=>'D'+(x.d+1)+' · '+x.src)}}
function proposeHtml(P,ctx,k,id,fin){const p=propose(P,ctx,k,id),ap=(ixOf(ctx.act,ctx.cls,k).ap||{})[id];
 return `<div class="prop">${p?`💡 <b>Positionnement proposé : degré ${p.d+1}</b> <button class="b s" onclick="${fin?`ficheDeg('${id}',${p.d})`:`ficheFil('${id}',${p.d})`}">Choisir</button><small>${p.src.map(esc).join(' · ')}</small>`:'<small class="mut">💡 Pas encore assez de données pour proposer un degré (observations, pratique).</small>'}${ap!=null?`<small>🙋 l'élève se positionne au <b>degré ${ap+1}</b></small>`:''}</div>`}
function proposeAll(){const X=ficheCtx(),{P,k}=X,ev=evOf(T.act,T.cls,k);let n=0;
 evUpd(e=>{e.fin=e.fin||{};e.fil=e.fil||{};P.fin.afl.forEach(a=>{if(e.fin[a.id]&&e.fin[a.id].d!=null)return;const p=propose(P,X,k,a.id);if(p){e.fin[a.id]={d:p.d,v:q25((a.deg[p.d].min+a.deg[p.d].max)/2)};n++}});
  P.fil.retenus.forEach(id=>{if(e.fil[id]&&e.fil[id].d!=null)return;const p=propose(P,X,k,id);if(p){e.fil[id]={d:p.d};n++}})});
 toast(n?n+' AFLP positionné(s) d\'après les données : vérifie et ajuste':'Rien à proposer (déjà noté ou pas de données)');render()}

/* ================== 🎯 MODE ÉLÈVE : je me positionne, puis je choisis ma répartition ================== */
function choixHtml(c,S,P,t){const mem=t?(t.el||[]):people(c).map(p=>p.k),me=E.me&&mem.includes(E.me)?E.me:'',X=P.fil.retenus.map(id=>aflFil(P,id)||{id,deg:[]});
 let h=`<h2 class="h2">🎯 Je choisis ma répartition</h2><p>${esc(P.fil.titre)} : <b>${P.fil.pts} points</b> sur 2 AFLP. Je me positionne d'abord sur chacun, puis l'appli me montre ce que rapporte chaque répartition.</p>
 <p class="lab">Qui es-tu ?</p><div class="chips">${mem.map(k=>`<button class="chip${k===me?' on':''}" onclick="E.me='${k}';saveE();render()">${esc(pname(c,k))}</button>`).join('')}</div>`;
 if(!me)return h;const ix=ixOf(E.act,E.cls,me),ap=ix.ap||{},ctx={act:E.act,cls:E.cls,c,S,P};
 h+=`<h3 class="h3">1 · Je me positionne</h3>`;
 X.forEach((a,j)=>{const pr=propose(P,ctx,me,a.id);h+=`<div class="afl"><div class="afh"><b>${j?'AFLY':'AFLX'} · ${esc(a.code)}</b><span class="dcl">${esc(a.decl||a.off)}</span></div>
  <div class="degs">${a.deg.map((g,d)=>`<button class="dg d${d}${ap[a.id]===d?' on':''}" onclick="apSet('${me}','${a.id}',${d})"><b>Degré ${d+1}</b><span>${nl2br(g)}</span></button>`).join('')}</div>
  ${pr?`<p class="sm">💡 D'après les observations et ta pratique : plutôt <b>degré ${pr.d+1}</b>.</p>`:''}</div>`});
 h+=`<details${P.fin.afl.some(a=>ap[a.id]!=null)?' open':''}><summary>Je me positionne aussi sur la fin de séquence (${P.fin.afl.map(a=>esc(a.code)).join(', ')})</summary>${P.fin.afl.map(a=>`<div class="afl"><div class="afh"><b>${esc(a.code)}</b><span class="dcl">${esc(a.decl)}</span></div><div class="degs">${a.deg.map((g,d)=>`<button class="dg d${d}${ap[a.id]===d?' on':''}" onclick="apSet('${me}','${a.id}',${d})"><b>Degré ${d+1}</b><span>${nl2br(g.t)}</span></button>`).join('')}</div></div>`).join('')}</details>`;
 const ok=X.every(a=>ap[a.id]!=null);
 h+=`<h3 class="h3">2 · Ce que rapporte chaque répartition</h3>`;
 if(!ok)h+='<p class="mut">Positionne-toi sur les 2 AFLP pour voir le calcul.</p>';
 else{const sc=P.fil.reps.map(r=>{const n=repPts(r);return {r,n,v:X.reduce((s,a,j)=>s+((P.fil.bareme[n[j]]||[])[ap[a.id]]||0),0)}}),best=Math.max(...sc.map(x=>x.v));
  h+=`<div class="reps">${sc.map(x=>`<button class="rep${ix.rep===x.r?' on':''}${x.v===best?' best':''}" onclick="choixSet('${me}','${x.r}')"><b>${X.map((a,j)=>esc(a.code)+' : '+x.n[j]+' pts → '+fr((P.fil.bareme[x.n[j]]||[])[ap[a.id]])).join('<br>')}</b><span class="tot2">${fr(x.v)} / ${P.fil.pts}</span>${x.v===best?'<i>⭐ le plus intéressant pour toi</i>':''}</button>`).join('')}</div>
  <p class="sm mut">Conseil : mets le plus de points sur l'AFLP où tu es le plus à l'aise. C'est ton enseignant qui positionne le jour du CCF.</p>`}
 h+=`<h3 class="h3">3 · Mon choix</h3>${ix.rep?`<p class="ok">✓ Choix enregistré : ${X.map((a,j)=>esc(a.code)+' '+repPts(ix.rep)[j]+' pts').join(' / ')}.</p>`:'<p class="warn" style="padding:6px 10px;border-radius:8px">Touche la répartition que tu choisis ci-dessus.</p>'}`;
 const ev=evOf(E.act,E.cls,me);if(ev.rep&&ev.rep!==ix.rep)h+=`<p class="mut">Ton enseignant a noté : ${esc(ev.rep)}.</p>`;
 return h}
function apSet(k,id,d){upd(ixId(E.act,E.cls,k),{},o=>{o.ap=o.ap||{};o.ap[id]=d;o.apAt=Date.now()});render()}

/* ================== 🎯 RÉPARTITION PROPOSÉE (4-4, 6-2, 2-6) ==================
   d'après le positionnement de l'élève (ix.ap) ou, à défaut, les données (propose) : la répartition qui rapporte le plus */
function repPropose(P,ctx,k){const ix=ixOf(ctx.act,ctx.cls,k),X=P.fil.retenus,D=X.map(id=>{const a=(ix.ap||{})[id];if(a!=null)return {d:a,s:'🙋'};const p=propose(P,ctx,k,id);return p?{d:p.d,s:'💡'}:null});
 if(D.some(x=>!x))return null;const sc=P.fil.reps.map(r=>{const n=repPts(r);return {r,v:X.reduce((s,id,j)=>s+((P.fil.bareme[n[j]]||[])[D[j].d]||0),0)}});const best=sc.reduce((a,b)=>b.v>a.v?b:a);
 return {r:best.r,v:best.v,why:X.map((id,j)=>((aflFil(P,id)||{}).code||id)+' '+D[j].s+' D'+(D[j].d+1)).join(', '),sc}}
function repProposeHtml(P,ctx,k,cur){const p=repPropose(P,ctx,k);if(!p)return '<small class="mut">💡 Pas encore de positionnement de l\'élève ni de données pour proposer une répartition.</small>';
 return `💡 Répartition proposée : <b>${esc(p.r)}</b> (${fr(p.v)} / ${P.fil.pts}) ${cur===p.r?'✓':`<button class="b s" onclick="evUpd(e=>{e.rep='${p.r}'});render()">Appliquer</button>`}<small>${esc(p.why)} · ${p.sc.map(x=>x.r+' → '+fr(x.v)).join(' · ')} (🙋 positionnement de l'élève, 💡 d'après les données)</small>`}
