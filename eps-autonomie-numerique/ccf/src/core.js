/* ================== OUTILS ================== */
const COL='#B8860B';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fr=x=>x==null||isNaN(x)?'—':String(Math.round(x*100)/100).replace('.',',');
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dFR=s=>s?new Date(s+'T12:00').toLocaleDateString('fr-FR'):'';
const lines=t=>String(t||'').split('\n').map(x=>x.trim()).filter(Boolean);
const nl2br=t=>esc(t).replace(/\n/g,'<br>');
function toast(m){document.querySelectorAll('.toast').forEach(x=>x.remove());const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function svgIco(p,c){return `<svg viewBox="0 0 24 24" fill="none" stroke="${c||'#fff'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`}
const ICO_CCF='<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>';
function beep(n){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const a=beep.a||(beep.a=new A());for(let i=0;i<(n||1);i++){const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;o.connect(g);g.connect(a.destination);const t=a.currentTime+i*.35;g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.start(t);o.stop(t+.3)}}catch(e){}}
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector('script[data-src="'+src+'"]'))return res();const s=document.createElement('script');s.src=src;s.dataset.src=src;s.onload=res;s.onerror=()=>rej(new Error('Chargement impossible : '+src));document.head.appendChild(s)})}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
const safe=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
/* boîte de dialogue simple */
function modal(html,o){o=o||{};const d=document.createElement('div');d.className='mdl';d.innerHTML=`<div class="mdl-b${o.wide?' w':''}">${html}</div>`;document.body.appendChild(d);
 d.addEventListener('click',e=>{if(e.target===d&&!o.lock)d.remove();const x=e.target.closest('[data-x]');if(x)d.remove()});return d}
/* pavé numérique (FC, nombres) sans clavier du système */
function numPad(title,val){return new Promise(res=>{let v=val!=null&&val!==''?String(val):'';const d=modal(`<h3>${esc(title)}</h3><div class="np-v"></div><div class="np-k">${'123456789'.split('').map(c=>`<button data-k="${c}">${c}</button>`).join('')}<button data-c>C</button><button data-k="0">0</button><button data-b>⌫</button></div><div class="row end"><button class="b" data-no>Annuler</button><button class="b p" data-ok>Valider</button></div>`,{lock:1});
 const show=()=>d.querySelector('.np-v').textContent=v||'—';show();
 d.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.k!=null){if(v.length<4)v+=b.dataset.k}else if(b.dataset.b!=null)v=v.slice(0,-1);else if(b.dataset.c!=null)v='';else if(b.dataset.no!=null){d.remove();res(null);return}else if(b.dataset.ok!=null){d.remove();res(v===''?null:+v);return}show()})})}

/* ================== DONNÉES (partagées entre tablettes par eps-home.js : EPSD.store) ==================
   localStorage « eps.ccf.v1 » = {items:{id:{…, u}}, pend:{id:u}, since}. Le plus récent l'emporte, élément par élément.
   pr:<act>-<voie>        protocole modifié par l'enseignant (sinon PROTOS)
   ss:<act>:<classe>      session de CCF de la classe : voie, date, ouverte aux élèves, équipes [{id,nom,el:[clé élève],g}]
   tm:<act>:<classe>:<éq> feuille d'équipe (écrite par les élèves) : projet + passages (escalade), séance + production (cross training)
   ix:<act>:<classe>:<él> feuille individuelle (élève) : répartition choisie, panel de stratégies, ressentis…
   ev:<act>:<classe>:<él> évaluation (enseignant) : statut, degrés, positions, répartition, commentaire
   mt:<classe>:<match>    match de badminton ; rs:<act> ressources ajoutées dans le CCF */
const KEY='eps.ccf.v1';
function ld(){let v=null;try{v=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}if(!v||!v.items)v={items:{},pend:{},since:0};v.pend=v.pend||{};return v}
let DB=ld();
function sv(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){toast('Mémoire de la tablette pleine')}}
function get(id){return DB.items[id]&&!DB.items[id].del?DB.items[id]:null}
function put(id,o){DB=ld();const prev=DB.items[id];o.u=Math.max(Date.now(),((prev&&prev.u)||0)+1);DB.items[id]=o;DB.pend[id]=o.u;sv();try{window.EPSD&&EPSD.syncSoon&&EPSD.syncSoon()}catch(e){}}
function del(id){const o=get(id);if(!o)return;put(id,{del:1})}
function items(pre){return Object.keys(DB.items).filter(k=>k.indexOf(pre)===0&&DB.items[k]&&!DB.items[k].del).map(k=>DB.items[k])}
function upd(id,def,f){const o=clone(get(id)||def);f(o);put(id,o);return o}

/* ================== PROTOCOLES ================== */
function protoId(act,voie){return act+'-'+voie}
function hasProto(act,voie){return !!(get('pr:'+protoId(act,voie))||PROTOS[protoId(act,voie)])}
function proto(act,voie){const id=protoId(act,voie),o=get('pr:'+id)||PROTOS[id];if(!o)return null;const P=clone(o);const D=PROTOS[id];if(D){P.jeu=Object.assign({},D.jeu,P.jeu||{})}return P}
function protoModifie(act,voie){return !!get('pr:'+protoId(act,voie))}
function aflFil(P,id){return P.fil.afl.find(a=>a.id===id)}
function repPts(rep){const m=/^(\d+)\s*-\s*(\d+)$/.exec(rep||'');return m?[+m[1],+m[2]]:[4,4]}

/* ================== CLASSES ET ÉLÈVES (listes communes, eps-lists.js) ================== */
function lists(){try{return window.EPSL?EPSL.items():[]}catch(e){return[]}}
function clsById(id){return lists().find(o=>o.id===id)||null}
function people(o){if(!o)return[];try{return EPSL.people(o).map(p=>({k:p.k,prenom:p.prenom||'',nom:p.nom||'',full:p.full}))}catch(e){return[]}}
function pname(o,k){const p=people(o).find(x=>x.k===k);return p?p.full:'?'}
function pfirst(o,k){const p=people(o).find(x=>x.k===k);return p?(p.prenom||p.full):'?'}
function classesFor(act,all){const c=act;return lists().filter(o=>all||!(o.off||[]).includes(c)).sort((a,b)=>a.nom.localeCompare(b.nom,'fr',{numeric:true}))}
function guessVoie(nom){const n=String(nom||'').replace(/\s+/g,'').toUpperCase();return /^(2|SECONDE|2NDE)|^[1T](G|GT|STMG|STI2D|STL|ST2S|STD2A|STAV|STHR)/.test(n)?'gt':'pro'}
function sesId(act,cls){return 'ss:'+act+':'+cls}
function ses(act,cls){const o=get(sesId(act,cls));if(o)return o;const c=clsById(cls);return {act,cls,voie:guessVoie(c&&c.nom),date:today(),open:false,eq:[]}}
function sesPut(act,cls,f){return upd(sesId(act,cls),ses(act,cls),f)}
function teamOf(S,k){return (S.eq||[]).find(t=>(t.el||[]).includes(k))||null}
function dispOf(clsNom,full){try{const d=window.EPSD&&EPSD.find(clsNom||'',full);return d?EPSD.label(d):''}catch(e){return''}}

/* ================== MODE ENSEIGNANT (code commun à toutes les applis) ================== */
let unlockedUntil=0;
function hashCode(c){let h=5381,s='relais:'+c;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return String(h)}
function hubTeach(){try{return Date.now()<+(localStorage.getItem('eps.teach.until')||0)}catch(e){return false}}
function isT(){if(window.EPS_VUE_ELEVE)return false;return Date.now()<unlockedUntil||hubTeach()}
window.epsIsTeacher=()=>isT();
async function unlock(){
 const pin=window.epsPin,done=()=>{unlockedUntil=Date.now()+60*60000;try{localStorage.setItem('eps.teach.until',String(unlockedUntil))}catch(e){}try{window.EPSG&&EPSG.close()}catch(e){}render()};
 let stored=null;try{stored=JSON.parse(localStorage.getItem('relais-vitesse-code-v1')||'null')}catch(e){}
 if(!pin){const v=prompt('Code enseignant');if(v==null)return;if(!stored||hashCode(v)===stored){if(!stored)try{localStorage.setItem('relais-vitesse-code-v1',JSON.stringify(hashCode(v)))}catch(e){}done()}else alert('Code incorrect');return}
 if(stored){const v=await pin({title:'🔒 Code enseignant',min:4,max:12,check:v=>hashCode(v)===stored});if(v!==null)done();return}
 const v=await pin({title:'🔒 Crée ton code enseignant',text:'4 chiffres, pour toutes les applications.',len:4});if(v===null)return;
 const w=await pin({title:'🔒 Confirme le code',text:'Tape le même code une 2e fois.',len:4,check:w=>w===v||'Les deux codes sont différents.'});if(w===null)return;
 try{localStorage.setItem('relais-vitesse-code-v1',JSON.stringify(hashCode(v)))}catch(e){}done()}
function lockApp(){unlockedUntil=0;try{localStorage.setItem('eps.teach.until','0')}catch(e){}render()}
window.epsTeacherEntry=()=>{if(!isT())unlock()};

/* ================== MINUTEURS ================== */
const TM={};/* id → {dur (s), end (ms) | left (s), run, up (chrono), cb} */
function tmFmt(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function tmLeft(t){if(t.up)return t.run?(Date.now()-t.start)/1000+(t.acc||0):(t.acc||0);return t.run?(t.end-Date.now())/1000:(t.left!=null?t.left:t.dur)}
function tmHtml(id,label,dur,up){const t=TM[id]||(TM[id]={dur,up:!!up,run:false,acc:0});if(!t.run&&t.dur!==dur&&!up&&t.left==null)t.dur=dur;
 return `<div class="tmr" data-tm="${id}"><span class="tl">${esc(label)}</span><b class="tv">${tmFmt(tmLeft(t))}</b><button class="b s" data-tmgo="${id}">${t.run?'⏸':'▶'}</button><button class="b s" data-tmrs="${id}">↺</button></div>`}
function tmToggle(id){const t=TM[id];if(!t)return;if(t.run){if(t.up)t.acc=tmLeft(t);else t.left=tmLeft(t);t.run=false}else{if(t.up)t.start=Date.now();else t.end=Date.now()+1000*(t.left!=null?t.left:t.dur);t.run=true;try{beep.a&&beep.a.resume()}catch(e){}}tmPaint()}
function tmReset(id){const t=TM[id];if(!t)return;t.run=false;t.left=null;t.acc=0;t.lastMin=0;tmPaint()}
function tmPaint(){Object.keys(TM).forEach(id=>{const t=TM[id],L=tmLeft(t);if(!t.up&&t.run&&L<=0){t.run=false;t.left=0;beep(3);if(t.cb)try{t.cb()}catch(e){}}
 if(t.up&&t.run&&t.minute){const m=Math.floor(L/60);if(m>(t.lastMin||0)){t.lastMin=m;beep(1);if(t.onMin)try{t.onMin(m)}catch(e){}}}
 $$(`[data-tm="${id}"]`).forEach(el=>{el.querySelector('.tv').textContent=tmFmt(tmLeft(t));const b=el.querySelector('[data-tmgo]');if(b)b.textContent=t.run?'⏸':'▶';el.classList.toggle('end',!t.up&&tmLeft(t)<=0);el.classList.toggle('run',!!t.run)})})}
setInterval(tmPaint,250);
document.addEventListener('click',e=>{const g=e.target.closest('[data-tmgo]');if(g){tmToggle(g.dataset.tmgo);return}const r=e.target.closest('[data-tmrs]');if(r)tmReset(r.dataset.tmrs)});

/* ================== TERRAIN DE BADMINTON : demi-terrain découpé en 6 zones (comme le protocole) ==================
   Vue de dessus, fond du terrain à gauche, filet à droite. 1 2 3 en haut (du fond vers le filet), 6 5 4 en bas. */
function zoneOrder(){return [[1,2,3],[6,5,4]]}
function courtSvg(J,o){o=o||{};const sel=o.sel||[],W=320,H=190,x0=12,y0=12,cw=W-2*x0-14,ch=H-2*y0,c1=cw*(J.c1||34)/100,c2=cw*(J.c2||67)/100,cols=[[0,c1],[c1,c2],[c2,cw]],Z=zoneOrder();
 const m=v=>v/6.70*cw,w=v=>v/6.10*ch;let s=`<svg class="court${o.click?' ck':''}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
 s+=`<rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" fill="#2f7d5b" stroke="#fff" stroke-width="2.5"/>`;
 Z.forEach((row,r)=>row.forEach((z,c)=>{const on=sel.includes(z),x=x0+cols[c][0],y=y0+r*ch/2,ww=cols[c][1]-cols[c][0];
  s+=`<g data-z="${z}"><rect x="${x}" y="${y}" width="${ww}" height="${ch/2}" fill="${on?(o.color||'#F2C94C'):'transparent'}" fill-opacity="${on?.85:0}"/>`+
  `<text x="${x+ww/2}" y="${y+ch/4+9}" text-anchor="middle" font-size="26" font-weight="800" fill="${on?'#14171C':'#fff'}" font-family="system-ui,sans-serif">${z}</text></g>`}));
 /* lignes du terrain (mètres) : service long double à 0,76 du fond, service court à 1,98 du filet, couloirs 0,46 */
 const L=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="1.5" opacity=".75"/>`;
 s+=L(x0+m(.76),y0,x0+m(.76),y0+ch)+L(x0+cw-m(1.98),y0,x0+cw-m(1.98),y0+ch)+L(x0,y0+w(.46),x0+cw,y0+w(.46))+L(x0,y0+ch-w(.46),x0+cw,y0+ch-w(.46))+L(x0,y0+ch/2,x0+cw-m(1.98),y0+ch/2);
 /* découpe des zones : pointillés rouges, comme le schéma du protocole */
 s+=`<line x1="${x0+c1}" y1="${y0}" x2="${x0+c1}" y2="${y0+ch}" stroke="#ff4d4d" stroke-width="2.5" stroke-dasharray="7 5"/><line x1="${x0+c2}" y1="${y0}" x2="${x0+c2}" y2="${y0+ch}" stroke="#ff4d4d" stroke-width="2.5" stroke-dasharray="7 5"/><line x1="${x0}" y1="${y0+ch/2}" x2="${x0+cw}" y2="${y0+ch/2}" stroke="#ff4d4d" stroke-width="2.5" stroke-dasharray="7 5"/>`;
 s+=`<line x1="${x0+cw+5}" y1="${y0-6}" x2="${x0+cw+5}" y2="${y0+ch+6}" stroke="#14171C" stroke-width="3"/><circle cx="${x0+cw+5}" cy="${y0-6}" r="4" fill="#14171C"/><circle cx="${x0+cw+5}" cy="${y0+ch+6}" r="4" fill="#14171C"/>`;
 s+=`<text x="${x0+4}" y="${H-1}" font-size="10" fill="#6A6F78" font-family="system-ui">fond</text><text x="${x0+cw-4}" y="${H-1}" text-anchor="end" font-size="10" fill="#6A6F78" font-family="system-ui">filet</text>`;
 return s+'</svg>'}
function zonesTxt(z){return (z||[]).length?'zone'+(z.length>1?'s ':' ')+[...z].sort((a,b)=>a-b).join(', '):'aucune zone'}
function sameSet(a,b){a=[...(a||[])].sort().join(',');b=[...(b||[])].sort().join(',');return a===b&&a!==''}

/* ================== CALCULS DE LA FORME DE PRATIQUE ================== */
/* ESCALADE — zone atteinte d'après la dernière dégaine dépassée par le bassin (TOP = nDeg + 1) */
function escZoneOf(J,dg){if(dg==null||dg==='')return null;dg=+dg;if(dg>J.nDeg)return 4;if(dg>=J.b3)return 3;if(dg>=J.b2)return 2;if(dg>=J.b1)return 1;return 0}
function escZoneBorne(J,z){return z>=4?J.nDeg+1:[0,J.b1,J.b2,J.b3][z]}
function escNbBonus(J,z){return +z===1?1:(J.bonusN||2)}
function escPts(J,p){/* p = passage {zone, bonus:[{z, ok}], dg} */
 const zp=[0,J.z1,J.z2,J.z3,J.z4];let pz=0;const zr=escZoneOf(J,p.dg);
 if(p.dg!=null&&p.dg!==''&&+zr===+p.zone)pz=zp[+p.zone]+(+p.zone===4?J.top:0);
 let pb=0;(p.bonus||[]).slice(0,escNbBonus(J,p.zone)).forEach(b=>{if(!b||!b.z)return;if(b.ok===true)pb+=J.bonusVal*b.z;else if(b.ok===false)pb-=J.bonusVal*b.z});
 return {zone:pz,bonus:pb,tot:pz+pb,zr}}
function escPrevu(J,p){const zp=[0,J.z1,J.z2,J.z3,J.z4];return (p.zone?zp[+p.zone]+(+p.zone===4?J.top:0):0)+(p.bonus||[]).slice(0,escNbBonus(J,p.zone)).reduce((s,b)=>s+(b&&b.z?J.bonusVal*b.z:0),0)}
/* BADMINTON — score stratégique d'un match ; stratégie active d'un camp à un point donné */
function badStratAt(m,side,i){const L=(m.strat&&m.strat[side])||[];let s=null;L.forEach(x=>{if(x.i<=i)s=x});return s}
function badCalc(J,m){const R={sets:[],a:0,b:0,sa:0,sb:0,setsA:0,setsB:0,dev:{a:false,b:false},fini:!!m.fin,used:{a:[],b:[]}};
 let set=0,ca=0,cb=0;(m.pts||[]).forEach((p,i)=>{const w=p.w,st=badStratAt(m,w,i);let v=J.pFaute;if(p.k==='d')v=st&&(st.z||[]).includes(+p.z)?J.pDirect:J.pHors;
  if(w==='a'){ca++;R.a+=v}else{cb++;R.b+=v}
  if(ca>=J.pts||cb>=J.pts){R.sets.push([ca,cb]);if(ca>cb)R.setsA++;else R.setsB++;ca=0;cb=0;set++}});
 if(ca||cb)R.sets.push([ca,cb]);R.cur=[ca,cb];R.set=set;
 ['a','b'].forEach(s=>{((m.strat&&m.strat[s])||[]).forEach(x=>{if(!R.used[s].some(y=>sameSet(y,x.z)))R.used[s].push(x.z)})});
 const o={a:'b',b:'a'};['a','b'].forEach(s=>{const g=m.guess&&m.guess[s];if(g&&R.used[o[s]].some(z=>sameSet(z,g))){R.dev[s]=true;if(s==='a')R.a+=J.pDevine;else R.b+=J.pDevine}});
 R.over=R.set>=J.sets;
 R.win=!R.over?null:R.setsA>R.setsB?'a':R.setsB>R.setsA?'b':(+J.nul?(R.a>R.b?'a':R.b>R.a?'b':'='):'=');
 R.changes={a:Math.max(0,((m.strat&&m.strat.a)||[]).length-1),b:Math.max(0,((m.strat&&m.strat.b)||[]).length-1)};
 return R}
function badMatches(cls){return items('mt:'+cls+':').sort((a,b)=>(a.t||0)-(b.t||0))}
function badStatsEl(J,cls,k){const M=badMatches(cls),st={j:0,v:0,pts:0,coach:0,chg:0,dev:0,arb:0};
 M.forEach(m=>{const R=badCalc(J,m);['a','b'].forEach(s=>{const x=m[s]||{};if(x.j===k&&R.over){st.j++;if(R.win===s)st.v++;st.pts+=s==='a'?R.a:R.b}if(x.c===k){st.coach++;st.chg+=R.changes[s];if(R.dev[s])st.dev++}});if(m.arb===k)st.arb++});return st}
function badRanking(J,S,cls){const T={};(S.eq||[]).forEach(t=>T[t.id]={t,j:0,v:0,n:0,pts:0});
 badMatches(cls).forEach(m=>{const R=badCalc(J,m);if(!R.over)return;['a','b'].forEach(s=>{const x=T[(m[s]||{}).eq];if(!x)return;x.j++;if(R.win===s)x.v++;else if(R.win==='=')x.n++;x.pts+=s==='a'?R.a:R.b})});
 return Object.values(T).sort((a,b)=>b.v-a.v||b.pts-a.pts)}
