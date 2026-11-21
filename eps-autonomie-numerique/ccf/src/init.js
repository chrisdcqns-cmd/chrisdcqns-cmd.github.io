/* ================== DÉMARRAGE ================== */
/* espace enseignant commun (eps-shell.js) : Vue élève · Bibliothèque · Évaluation · Classe · Bilans · Réglages */
window.EPSTCCF=window.EPST?EPST.init({app:'ccf',nom:'CCF',color:COL,isTeacher:()=>isT(),anchor:'#hd',main:'#m',home:'eval',
 tabs:{eval:{go:()=>go(T.view==='fiche'?'fiche':'eval'),on:()=>['eval','fiche'].includes(T.view)},
  cls:{go:()=>go('cls'),on:()=>['cls','team','match'].includes(T.view)},
  bil:{go:()=>go('bil'),on:()=>T.view==='bil'}},
 biblio:[{ico:'📜',label:'Le protocole',sub:'Lecture et impression (Bac pro, Bac général)',go:()=>go('proto')},{ico:'📚',label:'Ressources de l\'activité',sub:'Celles de l\'appli de l\'activité + celles ajoutées ici, visibles par les élèves',go:()=>go('res')}],
 reglages:[{ico:'✏️',label:'Modifier le protocole',sub:'Textes, degrés, points, AFLP retenus, forme de pratique',go:()=>go('edit',{pv:(T.cls&&ses(T.act,T.cls).voie)||T.pv||'pro'})},{ico:'🔀',label:'Changer d\'activité',sub:'Escalade, Badminton, Cross training',go:()=>go('act')}]}):null;
/* écran commun « Choisis ta classe » (mode élève) */
(window.EPSG_Q=window.EPSG_Q||[]).push({app:'CCF',sub:'Contrôle en cours de formation',color:COL,icon:svgIco(ICO_CCF),
 isTeacher:()=>isT(),when:()=>!isT()&&!(E.cls&&openActs(E.cls).length)&&!(E.tab==='res'&&E.act),
 classes:()=>openClasses().map(o=>({id:o.id,nom:o.nom,note:'CCF '+openActs(o.id).map(a=>ACTS[a].nom).join(', ')})),
 current:()=>E.cls||'',
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
