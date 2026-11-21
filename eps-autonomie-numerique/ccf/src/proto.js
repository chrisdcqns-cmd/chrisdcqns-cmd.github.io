/* ================== 📜 LE PROTOCOLE (lecture, impression) ================== */
function protoHtml(P,eleve){const J=P.jeu;
 let h=`<div class="proto"><div class="ph" style="--c:${ACTS[P.act].color}"><div><b>${esc(P.apsa)}</b> · ${esc(P.ca)} · ${esc(VOIES[P.voie])}</div><small>${esc(P.etab||'')} · session ${esc(P.session||'')}</small></div>
 <h3>${esc(P.fin.titre)} : ${finMax(P)} points</h3><div class="oe"><b>Objectif de l'épreuve</b><p>${esc(P.oe)}</p></div>
 <h4>Principe d'élaboration de l'épreuve</h4><ul>${P.principe.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
 P.fin.afl.forEach(a=>{h+=`<div class="pafl"><div class="pah"><b>${esc(a.code)}</b> · noté sur ${a.pts} points</div><p class="off">${esc(a.off)}</p><p><b>Dans l'activité :</b> ${esc(a.decl)}</p>${a.regles.length?`<ul>${a.regles.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`:''}
  <div class="pdeg">${a.deg.map((g,d)=>`<div class="d${d}"><b>Degré ${d+1}</b><span>${nl2br(g.t)}</span><i>${fr(g.min)} → ${fr(g.max)}</i></div>`).join('')}</div>${a.ajust&&!eleve?`<p class="sm mut">${esc(a.ajust)}</p>`:''}</div>`});
 const R=P.fil.retenus.map(id=>aflFil(P,id)).filter(Boolean);
 h+=`<h3>${esc(P.fil.titre)} : ${P.fil.pts} points</h3>${eleve?'':`<p class="sm mut">${esc(P.fil.note||'')}</p>`}`;
 R.forEach(a=>{h+=`<div class="pafl"><div class="pah"><b>${esc(a.code)}</b> · retenu</div><p class="off">${esc(a.off)}</p><p><b>Dans l'activité :</b> ${esc(a.decl)}</p>${a.regles&&a.regles.length?`<ul>${a.regles.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`:''}
  <div class="pdeg">${a.deg.map((g,d)=>`<div class="d${d}"><b>Degré ${d+1}</b><span>${nl2br(g)}</span></div>`).join('')}</div></div>`});
 h+=`<table class="tbl bar"><thead><tr><th></th>${[1,2,3,4].map(d=>`<th>Degré ${d}</th>`).join('')}</tr></thead><tbody>${Object.keys(P.fil.bareme).map(n=>`<tr><td>Note sur ${n} points</td>${P.fil.bareme[n].map(v=>`<td>${fr(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
 <p class="rap">${nl2br(P.fil.rappel)}</p>`;
 if(!eleve){const NA=P.fil.afl.filter(a=>!P.fil.retenus.includes(a.id));if(NA.length)h+=`<details><summary>AFLP non retenus (${NA.map(a=>esc(a.code)).join(', ')})</summary>${NA.map(a=>`<p><b>${esc(a.code)}</b> — ${esc(a.off)}</p>`).join('')}</details>`;
  h+=`<details><summary>Réglages de la forme de pratique</summary><ul>${(JEU_LAB[P.act]||[]).map(([k,l])=>`<li>${esc(l)} : <b>${esc(J[k])}</b></li>`).join('')}</ul></details><p class="sm mut">${esc(P.ref||'')}</p>`}
 return h+'</div>'}
function protoScreen(m){const v=T.pv||'pro',P=proto(T.act,v);
 m.innerHTML=`<div class="wrap"><div class="row wrapf noprint"><h2 class="h2" style="flex:1;margin:0">📜 Protocole · ${esc(ACTS[T.act].nom)}</h2>${['pro','gt'].map(x=>`<button class="b s${v===x?' p':''}" onclick="go('proto',{pv:'${x}'})">${VOIES[x]}</button>`).join('')}${P?`<button class="b s" onclick="go('edit',{pv:'${v}'})">✏️ Modifier</button><button class="b s" onclick="window.print()">🖨 Imprimer</button>`:''}</div>
 ${P?(protoModifie(T.act,v)?'<p class="mut noprint">✏️ Version modifiée par toi (le texte d\'origine reste disponible : Modifier → Revenir au texte d\'origine).</p>':'')+'<div class="print">'+protoHtml(P)+'</div>':`<div class="card warn"><b>Pas encore de protocole ${esc(VOIES[v])}.</b><p>Envoie-le à Claude dans la conversation : il sera ajouté ici.</p></div>`}</div>`}

/* ================== ✏️ MODIFIER LE PROTOCOLE ================== */
let EDP=null;
function editScreen(m){const v=T.pv||'pro';if(!EDP||EDP.id!==protoId(T.act,v))EDP=proto(T.act,v);const P=EDP;
 if(!P){m.innerHTML=`<div class="wrap"><button class="b" onclick="go('proto')">← Protocole</button><div class="card warn">Pas de protocole ${esc(VOIES[v])} pour cette activité.</div></div>`;return}
 const ta=(path,val,r)=>`<textarea rows="${r||2}" data-p="${path}">${esc(val)}</textarea>`,inp=(path,val,t)=>`<input type="${t||'text'}" data-p="${path}" value="${esc(val)}"${t==='number'?' step="0.25"':''}>`;
 let h=`<div class="wrap ed"><div class="row wrapf"><button class="b" onclick="EDP=null;go('proto')">← Protocole</button><h2 class="h2" style="flex:1;margin:0">✏️ ${esc(P.apsa)} · ${esc(VOIES[v])}</h2><button class="b" onclick="edReset()">↺ Revenir au texte d'origine</button><button class="b p" onclick="edSave()">✓ Enregistrer</button></div>
 <p class="mut">Tout est modifiable. Une ligne = une puce. Les notes des élèves sont recalculées avec le protocole enregistré.</p>
 <div class="card"><h3 class="h3">En-tête</h3><div class="g3"><label>APSA${inp('apsa',P.apsa)}</label><label>Champ d'apprentissage${inp('ca',P.ca)}</label><label>Session${inp('session',P.session)}</label></div><label>Établissement${inp('etab',P.etab)}</label>
 <label>Objectif de l'épreuve (OE)${ta('oe',P.oe,3)}</label><label>Principe d'élaboration de l'épreuve (une ligne par puce)${ta('principe',P.principe.join('\n'),7)}</label></div>
 <div class="card"><h3 class="h3">${esc(P.fin.titre)}</h3><label>Titre${inp('fin.titre',P.fin.titre)}</label>`;
 P.fin.afl.forEach((a,i)=>{h+=`<div class="eda"><div class="g3"><label>Code${inp(`fin.afl.${i}.code`,a.code)}</label><label>Noté sur (points)${inp(`fin.afl.${i}.pts`,a.pts,'number')}</label><label>Texte de l'aide à l'ajustement${inp(`fin.afl.${i}.degAj`,a.degAj||'')}</label></div>
  <label>AFLP officiel${ta(`fin.afl.${i}.off`,a.off)}</label><label>AFLP décliné dans l'activité${ta(`fin.afl.${i}.decl`,a.decl)}</label><label>Règles de l'épreuve (une ligne par puce)${ta(`fin.afl.${i}.regles`,a.regles.join('\n'),3)}</label><label>Ajustement dans le degré${ta(`fin.afl.${i}.ajust`,a.ajust||'')}</label>
  <div class="g4">${a.deg.map((g,d)=>`<div class="edd d${d}"><b>Degré ${d+1}</b>${ta(`fin.afl.${i}.deg.${d}.t`,g.t,4)}<div class="row">de${inp(`fin.afl.${i}.deg.${d}.min`,g.min,'number')}à${inp(`fin.afl.${i}.deg.${d}.max`,g.max,'number')}</div></div>`).join('')}</div></div>`});
 h+=`</div><div class="card"><h3 class="h3">${esc(P.fil.titre)}</h3><div class="g3"><label>Titre${inp('fil.titre',P.fil.titre)}</label><label>Noté sur${inp('fil.pts',P.fil.pts,'number')}</label><label>Répartitions (séparées par des virgules)${inp('fil.reps',P.fil.reps.join(', '))}</label></div>
 <b>Barème (points par degré)</b><table class="tbl"><tbody>${Object.keys(P.fil.bareme).map(n=>`<tr><td>Note sur ${n}</td>${P.fil.bareme[n].map((x,d)=>`<td>${inp(`fil.bareme.${n}.${d}`,x,'number')}</td>`).join('')}</tr>`).join('')}</tbody></table>
 <p class="mut sm">AFLP retenus par l'équipe : coche exactement 2 AFLP (le 1er coché = AFLX, le 2e = AFLY).</p>`;
 P.fil.afl.forEach((a,i)=>{const r=P.fil.retenus.indexOf(a.id);h+=`<div class="eda${r>=0?'':' off'}"><div class="row"><label class="tg big"><input type="checkbox" data-ret="${a.id}" ${r>=0?'checked':''}> Retenu ${r>=0?'('+(r?'AFLY':'AFLX')+')':''}</label>${inp(`fil.afl.${i}.code`,a.code)}</div>
  <label>AFLP officiel${ta(`fil.afl.${i}.off`,a.off)}</label><label>AFLP décliné dans l'activité${ta(`fil.afl.${i}.decl`,a.decl)}</label><label>Règles (une ligne par puce)${ta(`fil.afl.${i}.regles`,(a.regles||[]).join('\n'),2)}</label>
  <div class="g4">${a.deg.map((g,d)=>`<div class="edd d${d}"><b>Degré ${d+1}</b>${ta(`fil.afl.${i}.deg.${d}`,g,3)}</div>`).join('')}</div></div>`});
 h+=`<label>Rappels${ta('fil.rappel',P.fil.rappel,5)}</label><label>Note de l'équipe EPS${ta('fil.note',P.fil.note||'',2)}</label></div>
 <div class="card"><h3 class="h3">Forme de pratique (tablettes des élèves)</h3><div class="g3">${(JEU_LAB[P.act]||[]).map(([k,l])=>`<label>${esc(l)}${inp('jeu.'+k,P.jeu[k],'number')}</label>`).join('')}</div></div>
 <div class="row end"><button class="b p" onclick="edSave()">✓ Enregistrer le protocole</button></div></div>`;
 m.innerHTML=h;
 m.querySelectorAll('[data-p]').forEach(el=>el.onchange=()=>edSet(el.dataset.p,el.value,el.type));
 m.querySelectorAll('[data-ret]').forEach(el=>el.onchange=()=>{const id=el.dataset.ret,R=EDP.fil.retenus.filter(x=>x!==id);if(el.checked)R.push(id);EDP.fil.retenus=R;editScreen(m)})}
function edSet(path,val,type){const ks=path.split('.');let o=EDP;for(let i=0;i<ks.length-1;i++)o=o[ks[i]];const k=ks[ks.length-1];
 if(['principe','regles'].includes(k))val=lines(val);else if(k==='reps')val=val.split(',').map(x=>x.trim().replace(/\s*-\s*/,'-')).filter(x=>/^\d+-\d+$/.test(x));else if(type==='number')val=val===''?0:+String(val).replace(',','.');
 o[k]=val;
 if(k==='reps')val.forEach(r=>repPts(r).forEach(n=>{if(!EDP.fil.bareme[n])EDP.fil.bareme[n]=[0,0,0,0]}))}
function edSave(){const P=EDP;if(P.fil.retenus.length!==2){toast('Coche exactement 2 AFLP retenus');return}
 for(const a of P.fin.afl)for(const g of a.deg)if(!(g.min<=g.max)){toast(a.code+' : vérifie les fourchettes (de ≤ à)');return}
 if(!P.fil.reps.length){toast('Indique au moins une répartition');return}
 put('pr:'+P.id,clone(P));toast('Protocole enregistré et partagé');EDP=null;go('proto')}
function edReset(){if(!confirm('Revenir au texte d\'origine du protocole ? Tes modifications seront perdues.'))return;if(get('pr:'+protoId(T.act,T.pv||'pro')))del('pr:'+protoId(T.act,T.pv||'pro'));EDP=null;toast('Texte d\'origine rétabli');go('proto')}

/* ================== 📚 RESSOURCES : celles de l'appli de l'activité + celles ajoutées ici ==================
   Escalade : contenus de l'appli Escalade (« escalade.c »). Badminton : fiches techniques (« eps_badminton_v1 »).
   Toute appli (dont une future appli Cross training) peut publier ses ressources dans localStorage « eps.res.<code> » = [{titre, texte, lien, img}]. */
function appRes(act,teach){const R=[];
 try{if(act==='esc'){const C=JSON.parse(localStorage.getItem('escalade.c')||'null');if(C){const N={sec:'Sécurité',ech:'Échauffement',enc:"S'encorder",ass:'Assurage',the:'Thématiques'};
  Object.keys(N).forEach(s=>{const B=C[s]||[];let t='',v=0;B.forEach(b=>{if(b.t==='h')return;if(b.t==='s')t+=(t?'\n':'')+'■ '+b.v;else if(b.t==='p')t+='\n'+b.v;else if(b.t==='vgs')v+=(b.items||[]).length;else if(b.t==='v'||b.t==='f')v++});if(t||v)R.push({titre:N[s],texte:t.trim()+(v?`\n(${v} vidéo${v>1?'s':''} dans l'appli Escalade)`:''),src:'Appli Escalade',lien:'../escalade/'})})}}
 if(act==='bad'){const B=JSON.parse(localStorage.getItem('eps_badminton_v1')||'null');((B&&B.tech)||[]).forEach(f=>R.push({titre:f.nom,texte:[f.but,(f.cr||[]).length?'Critères de réalisation :\n• '+f.cr.join('\n• '):'',(f.err||[]).length?'Erreurs fréquentes :\n• '+f.err.join('\n• '):'',f.astuce?'💡 '+f.astuce:''].filter(Boolean).join('\n'),img:f.img||'',lien:f.video||'',src:'Appli Badminton · '+(f.cat||'')}))}
 const X=JSON.parse(localStorage.getItem('eps.res.'+act)||'null');(Array.isArray(X)?X:[]).forEach(r=>R.push(Object.assign({src:'Appli '+ACTS[act].nom},r)))}catch(e){}
 if(act==='ct'){if(teach)R.push({titre:'Exercices sans matériel et muscles travaillés',texte:EXOS.map(e=>'• '+e[0]+' : '+e[1]).join('\n'),src:'CCF · visible par toi seulement (les muscles sont évalués : AFLP6)'});R.push({titre:'Formes de travail',texte:Object.keys(FORMES).map(k=>'■ '+k+'\n'+FORMES[k]).join('\n'),src:'CCF'},{titre:'Prendre sa fréquence cardiaque',texte:"Deux doigts (index et majeur) sur l'artère du cou ou du poignet, jamais le pouce. Compte les battements pendant 15 secondes et multiplie par 4.\nFC maximale théorique ≈ 220 − âge.",src:'CCF'})}
 return R}
function ownRes(act){return ((get('rs:'+act)||{}).list||[])}
function resHtml(act,teach){const A=appRes(act,teach),O=ownRes(act);
 const card=(r,i)=>`<div class="res"><div class="rh"><b>${esc(r.titre)}</b><small>${esc(r.src||'Ajoutée dans le CCF')}</small>${teach&&i!=null?`<button class="b s" onclick="resEdit(${i})">✏️</button>`:''}</div>${r.img?`<img src="${esc(r.img)}" alt="">`:''}<p>${nl2br(r.texte||'')}</p>${r.lien?`<a class="b s" href="${esc(r.lien)}" target="_blank" rel="noopener">${/^\.\.\//.test(r.lien)?'Ouvrir l\'appli':'▶ Ouvrir le lien'}</a>`:''}</div>`;
 return `<div class="ress">${O.map((r,i)=>card(r,i)).join('')}${A.map(r=>card(r,null)).join('')}</div>`+(A.length+O.length?'':'<p class="mut">Aucune ressource pour l\'instant.</p>')}
function resScreen(m){m.innerHTML=`<div class="wrap"><div class="row wrapf"><h2 class="h2" style="flex:1;margin:0">📚 Ressources · ${esc(ACTS[T.act].nom)}</h2><button class="b p" onclick="resEdit(-1)">➕ Ajouter une ressource</button></div>
 <p class="mut">Visibles par les élèves le jour du CCF (onglet Ressources). Celles de l'appli ${esc(ACTS[T.act].nom)} apparaissent automatiquement quand tu les ajoutes dans l'appli${T.act==='ct'?' (l\'appli Cross training n\'est pas encore sur le site : ses ressources viendront ici dès qu\'elle existera)':''}.</p>${resHtml(T.act,true)}</div>`}
function resEdit(i){const O=ownRes(T.act),r=i>=0?O[i]:{titre:'',texte:'',lien:'',img:''};
 const d=modal(`<h3>${i>=0?'Modifier':'Ajouter'} une ressource</h3><label>Titre<input id="rt" value="${esc(r.titre)}"></label><label>Texte<textarea id="rx" rows="6">${esc(r.texte)}</textarea></label><label>Lien (vidéo, site)<input id="rl" value="${esc(r.lien)}"></label>
 <label>Photo <input type="file" id="ri" accept="image/*"></label>${r.img?'<img src="'+esc(r.img)+'" style="max-width:160px;border-radius:8px">':''}
 <div class="row end">${i>=0?'<button class="b" id="rd">🗑 Supprimer</button>':''}<button class="b" data-x>Annuler</button><button class="b p" id="ro">✓ Enregistrer</button></div>`,{wide:1});
 let img=r.img||'';d.querySelector('#ri').onchange=e=>{const f=e.target.files[0];if(!f)return;shrink(f,900).then(u=>{img=u;toast('Photo prête')})};
 d.querySelector('#ro').onclick=()=>{const n={titre:d.querySelector('#rt').value.trim()||'Ressource',texte:d.querySelector('#rx').value,lien:d.querySelector('#rl').value.trim(),img};upd('rs:'+T.act,{list:[]},o=>{o.list=o.list||[];if(i>=0)o.list[i]=n;else o.list.push(n)});d.remove();render()};
 const rd=d.querySelector('#rd');if(rd)rd.onclick=()=>{if(!confirm('Supprimer cette ressource ?'))return;upd('rs:'+T.act,{list:[]},o=>{o.list.splice(i,1)});d.remove();render()}}
function shrink(file,max){return new Promise(res=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{let w=im.width,h=im.height,q=.8;const c=document.createElement('canvas'),x=c.getContext('2d');let out='';
 for(let s=Math.min(1,max/Math.max(w,h));s>.1;s*=.8){c.width=Math.round(w*s);c.height=Math.round(h*s);x.drawImage(im,0,0,c.width,c.height);out=c.toDataURL('image/jpeg',q);if(out.length<30000)break;q=Math.max(.5,q-.1)}URL.revokeObjectURL(u);res(out)};im.src=u})}
