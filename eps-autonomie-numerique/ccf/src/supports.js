/* ================== SUPPORTS INTERACTIFS D'OBSERVATION (avec retour immédiat) ==================
   court (badminton) : terrain à toucher là où tombe le volant + frappe + issue → carte de chaleur des 6 zones, frappes, % dans la stratégie
   wall  (escalade)  : grimpe chronométrée, dégaines passées + actions (jambes, bras, pause…) → courbe hauteur / temps, comparaison au projet
   fc    (cross)     : fréquences cardiaques relevées → courbe avec la zone cible (FC cible ± marge), % dans la cible
   Enregistrées comme les autres grilles (OBS.v[id]) ; synthèse classe dans 👁 Observer (enseignant). */
const BAD_RES=[['d','Point direct'],['a','Faute / touche adverse'],['c','Échange continue'],['j','Faute du joueur']];
let OBSF={f:0,r:'c'};
/* ---------- couleurs, petits graphiques ---------- */
function heatOf(pts){const H={};(pts||[]).forEach(p=>{if(p.z)H[p.z]=(H[p.z]||0)+1});return H}
function barsHtml(L){const mx=Math.max(1,...L.map(x=>x[1]));return `<div class="bars">${L.map(([l,n,c])=>`<div class="br"><span>${esc(l)}</span><i style="width:${Math.round(100*n/mx)}%;background:${c||'var(--app)'}"></i><b>${n}</b></div>`).join('')}</div>`}
function lineSvg(pts,o){/* pts [{x,y}], o {xmax,ymin,ymax,band:[a,b],marks:[{x,c}],lab} */o=o||{};const W=320,H=150,l=34,b=20,t=8,r=8,X=x=>l+(W-l-r)*x/(o.xmax||1),Y=y=>t+(H-t-b)*(1-(y-o.ymin)/((o.ymax-o.ymin)||1));
 let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="${l}" y="${t}" width="${W-l-r}" height="${H-t-b}" fill="#fff" stroke="#E6E1D6"/>`;
 if(o.band)s+=`<rect x="${l}" y="${Y(o.band[1])}" width="${W-l-r}" height="${Math.max(0,Y(o.band[0])-Y(o.band[1]))}" fill="#2E9E5B" opacity=".18"/>`;
 (o.yt||[]).forEach(v=>s+=`<text x="${l-4}" y="${Y(v)+4}" text-anchor="end" font-size="10" fill="#6A6F78">${esc(o.yl?o.yl(v):v)}</text><line x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#F1EEE6"/>`);
 (o.marks||[]).forEach(m=>s+=`<line x1="${X(m.x)}" x2="${X(m.x)}" y1="${t}" y2="${H-b}" stroke="${m.c}" stroke-width="2" opacity=".7"/>`);
 if(pts.length)s+=`<polyline fill="none" stroke="${o.col||'#B8860B'}" stroke-width="3" stroke-linejoin="round" points="${pts.map(p=>X(p.x)+','+Y(p.y)).join(' ')}"/>`+pts.map(p=>`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5" fill="${o.col||'#B8860B'}"/>`).join('');
 s+=`<text x="${W-r}" y="${H-5}" text-anchor="end" font-size="10" fill="#6A6F78">${esc(o.lab||'')}</text></svg>`;return s}

/* ---------- BADMINTON : terrain interactif ---------- */
function stratOf(cls,k){const M=badMatches(cls).filter(m=>(m.a||{}).j===k||(m.b||{}).j===k);const m=M[M.length-1];if(!m)return null;const s=m.a.j===k?'a':'b',L=(m.strat&&m.strat[s])||[];return L.length?L[L.length-1].z:null}
function matchPtsOf(cls,k){const R=[];badMatches(cls).forEach(m=>['a','b'].forEach(s=>{if((m[s]||{}).j!==k)return;(m.pts||[]).forEach(p=>{if(p.w===s&&p.k==='d'&&p.z)R.push({z:+p.z,r:'d'})})}));return R}
function courtFeedback(J,pts,it,ctx,k){const H=heatOf(pts),n=pts.length,st=stratOf(ctx.cls,k),inS=st?pts.filter(p=>st.includes(p.z)).length:0;
 const fr2=(it.opts||[]).map((o,i)=>[o,pts.filter(p=>p.f===i).length]),rs=BAD_RES.map(([c,l])=>[l,pts.filter(p=>p.r===c).length,c==='d'?'#2E9E5B':c==='j'?'#d64545':'#9CA3AF']);
 const top=Object.keys(H).sort((a,b)=>H[b]-H[a])[0],nf=fr2.filter(x=>x[1]).length;
 return `<div class="fb"><div>${courtSvg(J,{heat:H,dots:pts.slice(-40)})}<p class="sm mut c">Carte de chaleur : ${n} volant${n>1?'s':''}${top?' · zone la plus visée : '+top:''}</p></div><div><b>Frappes</b>${barsHtml(fr2)}<b>Issue</b>${barsHtml(rs)}
 <p class="fbt">${n?`🎯 ${nf} frappe${nf>1?'s':''} différente${nf>1?'s':''} sur ${(it.opts||[]).length} · ${Math.round(100*pts.filter(p=>p.r==='d').length/n)} % de points directs${st?` · ${Math.round(100*inS/n)} % des volants dans sa stratégie (${zonesTxt(st)})`:''}`:'Touche le terrain là où tombe le volant.'}</p></div></div>`}
function courtUi(it,v,ctx){const J=ctx.P.jeu,pts=(v&&v.pts)||[];
 return `<div class="row wrapf"><span class="lab">Frappe</span>${(it.opts||[]).map((o,i)=>`<button class="chip${OBSF.f===i?' on':''}" onclick="OBSF.f=${i};render()">${esc(o)}</button>`).join('')}</div>
 <div class="row wrapf"><span class="lab">Issue</span>${BAD_RES.map(([c,l])=>`<button class="chip${OBSF.r===c?' on':''}" onclick="OBSF.r='${c}';render()">${l}</button>`).join('')}</div>
 <div class="ocourt" data-it="${it.id}">${courtSvg(J,{click:1,heat:heatOf(pts),dots:pts.slice(-25)})}</div>
 <div class="row wrapf"><button class="b s" onclick="courtUndo('${it.id}')" ${pts.length?'':'disabled'}>↶ Annuler le dernier volant</button><span class="mut sm">Touche le terrain adverse à l'endroit où tombe chaque volant frappé par l'élève observé.</span></div>
 ${courtFeedback(J,pts,it,ctx,OBS.k)}`}
document.addEventListener('click',e=>{const w=e.target.closest('.ocourt');if(!w)return;const g=e.target.closest('[data-z]'),svg=w.querySelector('svg');if(!g||!svg)return;
 const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(svg.getScreenCTM().inverse()),id=w.dataset.it;
 const o=OBS.v[id]||(OBS.v[id]={pts:[]});o.pts=o.pts||[];o.pts.push({x:Math.round(p.x),y:Math.round(p.y),z:+g.dataset.z,f:OBSF.f,r:OBSF.r,t:Date.now()});render()});
function courtUndo(id){const o=OBS.v[id];if(o&&o.pts)o.pts.pop();render()}
function courtSum(it,vals,ctx,k){const pts=vals.flatMap(v=>v.pts||[]);return courtFeedback(ctx.P.jeu,pts,it,ctx,k)}

/* ---------- ESCALADE : grimpe chronométrée sur le mur ---------- */
function wallState(v){return v||{ev:[]}}
function wallCur(v){return (v.ev||[]).filter(e=>e.k==='dg').reduce((m,e)=>Math.max(m,e.d),0)}
function wallUi(it,v,ctx){const J=ctx.P.jeu,s=wallState(v),cur=wallCur(s),run=s.t0&&!s.fin,n=J.nDeg;
 const btn=run?`<button class="b p big" onclick="wallDg('${it.id}')" ${cur>n?'disabled':''}>⬆ Le bassin passe ${cur>=n?'le TOP':'D'+(cur+1)}</button>`:'';
 return `<div class="row wrapf">${!s.t0?`<button class="b p big" onclick="wallGo('${it.id}')">▶ Départ de la grimpe</button>`:run?`<span class="tmr run"><span class="tl">Grimpe</span><b class="tv" data-wall="${s.t0}">${tmFmt((Date.now()-s.t0)/1000)}</b></span>${btn}<button class="b" onclick="wallEnd('${it.id}')">■ Fin de la grimpe</button>`:`<span class="pill ok">Grimpe terminée</span><button class="b s" onclick="delete OBS.v['${it.id}'];render()">↺ Recommencer</button>`}</div>
 ${run?`<div class="ocn">${(it.opts||[]).map((o,i)=>`<div class="occ"><button class="ocb" onclick="wallAct('${it.id}',${i})"><b>${(s.ev||[]).filter(e=>e.k==='a'&&e.i===i).length}</b><span>${esc(o)}</span></button></div>`).join('')}</div>`:''}
 ${wallFeedback(J,[s],it,ctx,OBS.k)}`}
function wallGo(id){OBS.v[id]={t0:Date.now(),ev:[]};render()}
function wallDg(id){const s=OBS.v[id];s.ev.push({k:'dg',d:wallCur(s)+1,t:Date.now()-s.t0});if(wallCur(s)>PXO.P.jeu.nDeg)s.fin=Date.now()-s.t0;render()}
function wallAct(id,i){const s=OBS.v[id];s.ev.push({k:'a',i,t:Date.now()-s.t0});render()}
function wallEnd(id){const s=OBS.v[id];s.fin=Date.now()-s.t0;render()}
setInterval(()=>{document.querySelectorAll('[data-wall]').forEach(el=>el.textContent=tmFmt((Date.now()-+el.dataset.wall)/1000))},500);
function wallFeedback(J,L,it,ctx,k){const s=L.filter(x=>x&&x.t0).slice(-1)[0];if(!s)return '<p class="mut sm">Lance le chrono au départ, puis touche « Le bassin passe… » à chaque dégaine.</p>';
 const dg=(s.ev||[]).filter(e=>e.k==='dg'),end=(s.fin||Date.now()-s.t0)/1000,cur=wallCur(s),n=J.nDeg,pts=[{x:0,y:0}].concat(dg.map(e=>({x:e.t/1000,y:e.d})));if(!s.fin)pts.push({x:end,y:cur});
 const cols=['#2E9E5B','#d64545','#3aa0d8','#f0a030','#6B3FA0'],marks=(s.ev||[]).filter(e=>e.k==='a').map(e=>({x:e.t/1000,c:cols[e.i%cols.length]}));
 const cnt=(it.opts||[]).map((o,i)=>[o,(s.ev||[]).filter(e=>e.k==='a'&&e.i===i).length,cols[i%cols.length]]);
 const x=escPassOf(ctx.act,ctx.cls,ctx.S,k),p=x&&x.p,zr=escZoneOf(J,cur>n?n+1:cur),gaps=dg.map((e,i)=>e.t-(i?dg[i-1].t:0)),slow=gaps.length?gaps.indexOf(Math.max(...gaps)):-1;
 return `<div class="fb"><div>${lineSvg(pts,{xmax:Math.max(10,end),ymin:0,ymax:n+1,yt:[0,J.b1,J.b2,J.b3,n+1],yl:v=>v===0?'sol':v>n?'TOP':'D'+v,marks,lab:'temps (s)'})}<p class="sm mut c">Hauteur du bassin pendant la grimpe (traits : actions observées)</p></div>
 <div><b>Actions</b>${barsHtml(cnt)}<p class="fbt">🧗 Atteint : <b>${cur>n?'TOP':cur?'D'+cur:'sol'}</b> (zone ${zr||0}) en ${tmFmt(end)}${dg.length?` · ${Math.round(end/dg.length)} s par dégaine en moyenne · passage le plus long : ${slow===0?'sol':'D'+slow} → D${slow+1} (${Math.round(gaps[slow]/1000)} s)`:''}${p&&p.zone?` · projet : Z${p.zone} → ${+zr===+p.zone?'✅ projet respecté':'écart de '+Math.abs((cur>n?n+1:cur)-escZoneBorne(J,+p.zone))+' dégaine(s)'}`:''}${cnt.length>1&&cnt[0][1]+cnt[1][1]?` · jambes / bras : ${cnt[0][1]} / ${cnt[1][1]}`:''}</p></div></div>`}
function wallSum(it,vals,ctx,k){return wallFeedback(ctx.P.jeu,vals,it,ctx,k)}

/* ---------- CROSS TRAINING : courbe de fréquence cardiaque ---------- */
function fcCible(ctx,k){const t=teamOf(ctx.S,k),F=t?get('tm:'+ctx.act+':'+ctx.cls+':'+t.id)||{}:{};return +((F.fcc||{})[k])||null}
function fcAll(ctx,k,v){const t=teamOf(ctx.S,k),F=t?get('tm:'+ctx.act+':'+ctx.cls+':'+t.id)||{}:{},I=ixOf(ctx.act,ctx.cls,k);
 return ((v&&v.m)||[]).map(x=>x.fc).concat((F.log||[]).filter(l=>l.k===k&&l.fc).map(l=>l.fc)).concat(I.fc||[])}
function fcUi(it,v,ctx){const s=v||{m:[]},c=fcCible(ctx,OBS.k);
 return `<div class="row wrapf"><button class="b p big" onclick="fcAdd('${it.id}')">❤️ Ajouter une FC</button>${(s.m||[]).length?`<button class="b s" onclick="OBS.v['${it.id}'].m.pop();render()">↶ Annuler</button>`:''}<span class="mut sm">FC cible de l'élève : <b>${c||'non renseignée (feuille de séance)'}</b> · marge ± ${+(it.opts||[])[0]||10} bpm</span></div>${fcFeedback([s],it,ctx,OBS.k)}`}
async function fcAdd(id){const v=await numPad('Fréquence cardiaque (bpm)');if(!v)return;const s=OBS.v[id]||(OBS.v[id]={m:[]});s.m.push({fc:v,t:Date.now()});render()}
function fcFeedback(L,it,ctx,k){const own=L.flatMap(s=>(s&&s.m)||[]).map(x=>x.fc),all=own.length?own:fcAll(ctx,k,null),c=fcCible(ctx,k),mg=+(it.opts||[])[0]||10;
 if(!all.length)return '<p class="mut sm">Ajoute les FC relevées à chaque round : la courbe et la zone cible apparaissent ici.</p>';
 const mn=Math.min(...all,c?c-mg:999),mx=Math.max(...all,c?c+mg:0),inb=c?all.filter(f=>Math.abs(f-c)<=mg).length:0;
 return `<div class="fb"><div>${lineSvg(all.map((f,i)=>({x:i+1,y:f})),{xmax:Math.max(2,all.length),ymin:Math.floor((mn-10)/10)*10,ymax:Math.ceil((mx+10)/10)*10,yt:[Math.floor((mn-10)/10)*10,c||Math.round((mn+mx)/2),Math.ceil((mx+10)/10)*10],band:c?[c-mg,c+mg]:null,col:'#d64545',lab:'relevés'})}<p class="sm mut c">${c?'Bande verte : FC cible '+c+' ± '+mg:''}</p></div>
 <div><p class="fbt">❤️ ${all.length} relevé(s) · mini ${Math.min(...all)} · maxi ${Math.max(...all)} · moyenne ${Math.round(all.reduce((a,b)=>a+b,0)/all.length)} bpm${c?` · <b>${Math.round(100*inb/all.length)} %</b> dans la zone cible${all[all.length-1]>c+mg?' · ⬇ trop haut : allège (réchappe)':all[all.length-1]<c-mg?' · ⬆ trop bas : intensifie':' · ✅ dans la cible'}`:''}</p></div></div>`}
function fcSum(it,vals,ctx,k){return fcFeedback(vals,it,ctx,k)}
const OBSX={court:{ui:courtUi,sum:courtSum,lab:'Terrain interactif (badminton)'},wall:{ui:wallUi,sum:wallSum,lab:'Mur chronométré (escalade)'},fc:{ui:fcUi,sum:fcSum,lab:'Courbe de FC (cross training)'}};

/* ---------- 📊 retour de la classe (enseignant) : une carte par élève ---------- */
function classBoard(ctx){const {P,c}=ctx,L=obsList(P),it=L.find(x=>OBSX[x.type]);
 return `<h3 class="h3">📊 Retour de la classe${it?' · '+esc(it.titre):''}</h3><p class="mut sm">Données des observations (élèves et toi) et de la pratique. Touche un élève pour l'observer et voir le détail.</p><div class="board">${people(c).map(p=>{const R=obsRecs(ctx.act,ctx.cls,p.k);let viz='';
  if(it){const vals=R.map(r=>r.v&&r.v[it.id]).filter(Boolean);
   if(it.type==='court'){const pts=vals.flatMap(v=>v.pts||[]).concat(matchPtsOf(ctx.cls,p.k));viz=pts.length?courtSvg(P.jeu,{heat:heatOf(pts)})+`<small>${pts.length} volants</small>`:''}
   if(it.type==='wall'){const s=vals.filter(v=>v.t0).slice(-1)[0],x=escPassOf(ctx.act,ctx.cls,ctx.S,p.k),dg=x&&x.p?x.p.dg:null;viz=s||dg!=null?`<div class="bigv">${s?(wallCur(s)>P.jeu.nDeg?'TOP':'D'+wallCur(s)):dgTxt(P.jeu,dg)}</div><small>${x&&x.p&&x.p.zone?'projet Z'+x.p.zone:''}${s?' · '+tmFmt((s.fin||0)/1000):''}</small>`:''}
   if(it.type==='fc'){const all=vals.flatMap(v=>(v.m||[]).map(m=>m.fc)),A=all.length?all:fcAll(ctx,p.k,null),cb=fcCible(ctx,p.k);viz=A.length?lineSvg(A.map((f,i)=>({x:i+1,y:f})),{xmax:Math.max(2,A.length),ymin:Math.min(...A,cb||999)-15,ymax:Math.max(...A,cb||0)+15,band:cb?[cb-10,cb+10]:null,col:'#d64545'}):''}}
  return `<button class="bc" onclick="OBS={k:'${p.k}',by:'',v:{}};render()"><b>${esc(p.full)}</b>${viz||'<span class="mut sm">pas encore de données</span>'}<small>${R.length} observation(s)</small></button>`}).join('')}</div>`}
