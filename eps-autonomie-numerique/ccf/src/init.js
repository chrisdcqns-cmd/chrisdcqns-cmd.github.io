/* ================== DÉMARRAGE ================== */
/* espace enseignant commun (eps-shell.js) : Vue élève · Bibliothèque · Évaluation · Classe · Bilans · Réglages */
window.EPSTCCF=window.EPST?EPST.init({app:'ccf',nom:'CCF',color:COL,isTeacher:()=>isT(),anchor:'#hd',main:'#m',home:'eval',
 tabs:{ccf:false,seq:{panel:el=>{el.innerHTML='<h2>📅 Séquence</h2><p class="mut">Fiches de leçon du CCF, programmation et leçon en cours.</p><div class="epst-grid"><button type="button" class="epst-card" data-o="lec"><i>📝</i><span><b>Fiches de leçon</b><small>Dont la leçon du CCF</small></span></button><button type="button" class="epst-card" data-o="live"><i>📡</i><span><b>Leçon en cours</b><small>Messages, minuteur, rangement</small></span></button></div>';el.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{if(window.EPSLC)EPSLC.open(b.dataset.o)})}},eval:{go:()=>go(T.view==='fiche'?'fiche':'eval'),on:()=>['eval','fiche'].includes(T.view)},
  cls:{go:()=>go('cls'),on:()=>['cls','team','match'].includes(T.view)},
  bil:{go:()=>go('bil'),on:()=>T.view==='bil'}},
 biblio:[{ico:'🖨',label:'Documents à imprimer',sub:'La leçon du CCF, le terrain / le mur, les fiches à remplir sans tablette',go:()=>go('print')},{ico:'📜',label:'Le protocole',sub:'Lecture et impression (Bac pro, Bac général)',go:()=>go('proto')},{ico:'📚',label:'Ressources de l\'activité',sub:'Celles de l\'appli de l\'activité + celles ajoutées ici, visibles par les élèves',go:()=>go('res')}],
 reglages:[{ico:'✏️',label:'Modifier le protocole',sub:'Textes, degrés, points, AFLP retenus, forme de pratique',go:()=>go('edit',{pv:(T.cls&&ses(T.act,T.cls).voie)||T.pv||'pro'})},{ico:'🔀',label:'Changer d\'activité',sub:'Escalade, Badminton, Cross training, Course d\'orientation',go:()=>go('act')}]}):null;
/* écran commun « Choisis ta classe » (mode élève) */
(window.EPSG_Q=window.EPSG_Q||[]).push({app:'CCF',sub:'Contrôle en cours de formation',color:COL,icon:svgIco(ICO_CCF),
 isTeacher:()=>isT(),when:()=>!isT()&&!(E.cls&&openActs(E.cls).length)&&!(E.tab==='res'&&E.act),
 classes:()=>openClasses().map(o=>({id:o.id,nom:o.nom,note:'CCF '+openActs(o.id).map(a=>ACTS[a].nom).join(', ')})),
 current:()=>E.cls||'',
 demo:n=>{const c=lists().find(o=>o.nom===n);if(!c)return;let a=openActs(c.id)[0];if(!a){a=Object.keys(ACTS)[0];sesPut(a,c.id,S=>{S.open=true})}/* 👁 vue élève : la classe fictive a un CCF ouvert et ses équipes */
  if(!(ses(a,c.id).eq||[]).length){const ks=people(c).map(p=>p.k),sz=a==='esc'?4:2,nb=Math.max(1,Math.round(ks.length/sz));if(ks.length)sesPut(a,c.id,S=>{S.eq=[];for(let i=0;i<nb;i++)S.eq.push({id:'q'+uid()+i,nom:(a==='esc'?'Équipe ':'Binôme ')+(i+1),el:[],g:''});ks.forEach((k,i)=>S.eq[i%nb].el.push(k))})}},
 select:id=>{E.cls=id;E.team='';const A=openActs(id);E.act=A.length===1?A[0]:'';E.tab='pra';saveE();render()},
 resources:Object.keys(ACTS).map(a=>({ico:'📚',label:'Ressources '+ACTS[a].nom,sub:'Sécurité, échauffement, fiches',open:()=>{E.cls='';E.act=a;E.tab='res';saveE();render()}})),
 teacher:()=>unlock()});
window.epsAppHome=function(){if(isT()){go('eval');return}MATCH=null;eleveClasse()};
window.epsCurrentClass=()=>{const c=clsById(isT()?T.cls:E.cls);return c?{nom:c.nom,eleves:people(c).map(p=>p.full)}:null};
function hookStore(){if(window.EPSD&&EPSD.store){EPSD.store({pre:'ccf|',key:KEY,onChange:()=>{if(!document.querySelector('.mdl')&&!isTyping())render()}});return true}return false}
function isTyping(){const a=document.activeElement;return a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)}
if(!hookStore()){const iv=setInterval(()=>{if(hookStore())clearInterval(iv)},300);setTimeout(()=>clearInterval(iv),20000)}
addEventListener('storage',e=>{if(e.key===KEY&&!isTyping()&&!document.querySelector('.mdl'))render()});
addEventListener('eps-lists',()=>render());
let wasT=isT();setInterval(()=>{const t=isT();if(t!==wasT){wasT=t;render()}},1500);
/* tablette élève : les feuilles d'équipe des autres tablettes arrivent par la synchronisation */
setInterval(()=>{if(!isT()&&E.cls&&!isTyping()&&!document.querySelector('.mdl')&&(MATCH||SUB[E.act]==='class'||E.tab==='eq')){const before=JSON.stringify(DB.items);DB=ld();if(JSON.stringify(DB.items)!==before)render()}},5000);
render();
