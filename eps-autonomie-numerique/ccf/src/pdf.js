/* ================== FICHES PDF (pdf-lib, une page paysage par élève) · .zip · bilans en ligne ================== */
const WA='€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function pdfTxt(s){return String(s==null?'':s).replace(/[   ]/g,' ').replace(/[≤]/g,'<=').replace(/[≥]/g,'>=').replace(/[−]/g,'-').replace(/[→]/g,'->').replace(/[■★✓✔]/g,'-').replace(/[✅]/g,'(oui)').replace(/[❌]/g,'(non)').split('').filter(ch=>ch==='\n'||(ch.charCodeAt(0)>=32&&ch.charCodeAt(0)<=255)||WA.includes(ch)).join('')}
function hex(c){const n=parseInt(c.slice(1),16);return PDFLib.rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)}
function wrap(f,t,size,w){const out=[];pdfTxt(t).split('\n').forEach(par=>{let l='';par.split(' ').forEach(wd=>{const x=l?l+' '+wd:wd;if(f.widthOfTextAtSize(x,size)>w&&l){out.push(l);l=wd}else l=x});out.push(l)});return out}
async function pdfLibs(){await loadScript('../vendor/pdf-lib.min.js')}
async function fichePage(doc,F,B,o){const {P,S,c,p,ev,ix,N}=o,PW=841.89,PH=595.28,M=28,W=PW-2*M,pg=doc.addPage([PW,PH]),ink=hex('#14171C'),grey=hex('#6A6F78'),app=hex(COL),line=hex('#E6E1D6'),white=PDFLib.rgb(1,1,1);
 let y=PH-M;const R=(window.EPSR&&EPSR.get())||{};
 const T=(x,yy,t,sz,f,col,opt)=>{opt=opt||{};let s=pdfTxt(t);const ff=f||F;if(opt.max)while(s&&ff.widthOfTextAtSize(s,sz)>opt.max)s=s.slice(0,-2)+'…';const w=ff.widthOfTextAtSize(s,sz);pg.drawText(s,{x:opt.right?x-w:opt.center?x-w/2:x,y:yy,size:sz,font:ff,color:col||ink})};
 /* en-tête commun (même présentation que EPSR.htmlHead) */
 pg.drawRectangle({x:M,y:y-54,width:W,height:54,color:ink});pg.drawRectangle({x:M,y:y-54,width:6,height:54,color:app});
 T(M+18,y-23,'CCF '+P.apsa+' — '+VOIES[S.voie],14,B,white,{max:W*.55});T(M+18,y-41,[R.etab,R.prof,'EPS · '+P.ca].filter(Boolean).join(' · '),9,F,hex('#A9AEB8'),{max:W*.55});
 T(M+W-14,y-23,p.full,14,B,white,{right:1,max:W*.4});T(M+W-14,y-41,[c.nom,dFR(S.date)].filter(Boolean).join(' · '),9,F,hex('#A9AEB8'),{right:1});
 y-=72;
 /* note */
 pg.drawRectangle({x:M+W-120,y:y-44,width:120,height:44,borderColor:app,borderWidth:2,color:white});
 T(M+W-60,y-30,ev.st?(ev.st==='abs'?'Absent(e)':'Dispensé(e)'):(N.tot==null?'—':fr(N.tot)+' / 20'),ev.st?13:20,B,ink,{center:1});
 T(M,y-14,P.fin.titre+' : '+fr(N.fin)+' / '+finMax(P),12,B);T(M,y-32,P.fil.titre+' : '+fr(N.fil)+' / '+P.fil.pts+(repOf(P,ev,ix)?' (répartition '+repOf(P,ev,ix)+')':''),12,B);
 y-=58;
 const cw=[150,W-150-80-60,80,60];const row=(cells,h,bold,fill)=>{if(fill)pg.drawRectangle({x:M,y:y-h,width:W,height:h,color:fill});let x=M;cells.forEach((t,i)=>{const L=wrap(i===1?F:B,t,9,cw[i]-10);L.slice(0,Math.floor((h-6)/11)).forEach((l,j)=>T(x+5,y-12-j*11,l,9,bold||i===0?B:F));x+=cw[i]});pg.drawLine({start:{x:M,y:y-h},end:{x:M+W,y:y-h},thickness:.6,color:line});y-=h};
 row(['AFLP','Degré atteint','Points','Sur'],18,true,hex('#F1EEE6'));
 P.fin.afl.forEach(a=>{const x=(ev.fin||{})[a.id],v=finV(a,x),g=x&&x.d!=null?a.deg[x.d]:null,t=g?'Degré '+(x.d+1)+' : '+g.t.replace(/\n/g,' '):'Non évalué',h=Math.max(30,12+wrap(F,t,9,cw[1]-10).length*11);row([a.code+' · '+a.decl,t,fr(v),String(a.pts)],Math.min(h,70))});
 const reps=repPts(repOf(P,ev,ix)||P.fil.reps[0]);
 P.fil.retenus.forEach((id,j)=>{const a=aflFil(P,id)||{deg:[]},x=(ev.fil||{})[id],t=x&&x.d!=null?'Degré '+(x.d+1)+' : '+(a.deg[x.d]||''):'Non évalué',h=Math.max(30,12+wrap(F,t,9,cw[1]-10).length*11);row([a.code+' · '+(a.decl||''),t,fr(filV(P,ev,ix,j)),String(reps[j])],Math.min(h,60))});
 y-=10;const pr=pratiqueTxt(S.act||T.act,P,c.id,S,p.k);
 if(pr.length){T(M,y-10,'Pratique le jour du CCF',10,B);y-=14;pr.forEach(l=>wrap(F,l,9,W).forEach(z=>{T(M,y-10,z,9,F,grey);y-=12}))}
 if(ev.comm){y-=6;T(M,y-10,'Commentaire',10,B);y-=14;wrap(F,ev.comm,10,W).slice(0,6).forEach(z=>{T(M,y-10,z,10);y-=13})}
 T(M,M-8,pdfTxt(P.etab+' · '+(P.ref||'')),7,F,grey,{max:W})}
async function pdfFor(keys){await pdfLibs();const {c,S,P,L}=bilRows(),doc=await PDFLib.PDFDocument.create(),F=await doc.embedFont(PDFLib.StandardFonts.Helvetica),B=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);S.act=T.act;
 for(const r of L.filter(r=>!keys||keys.includes(r.p.k)))await fichePage(doc,F,B,{P,S,c,p:r.p,ev:r.ev,ix:r.ix,N:r.N});return doc.save()}
async function bilPdf(){try{toast('Préparation du PDF…');const {c}=bilRows();download(new Blob([await pdfFor(null)],{type:'application/pdf'}),'CCF_'+safe(ACTS[T.act].nom)+'_'+safe(c.nom)+'_'+today().split('-').reverse().join('-')+'.pdf')}catch(e){alert('Export impossible : '+e.message)}}
async function bilZip(){try{toast('Préparation des fiches…');await loadScript('../vendor/jszip.min.js');const {c,L}=bilRows(),z=new JSZip(),d=today().split('-').reverse().join('-');
 for(const r of L)z.file(safe(r.p.nom||r.p.full)+'_'+safe(r.p.prenom)+'_CCF_'+safe(ACTS[T.act].nom)+'.pdf',await pdfFor([r.p.k]));
 z.file('Recapitulatif_'+safe(c.nom)+'.pdf',await pdfFor(null));
 download(await z.generateAsync({type:'blob'}),'CCF_'+safe(ACTS[T.act].nom)+'_'+safe(c.nom)+'_'+d+'.zip')}catch(e){alert('Export impossible : '+e.message)}}
function bilPub(){if(!window.EPSD||!EPSD.publish)return toast('Indisponible');const {c,L}=bilRows();
 EPSD.publish({app:'ccf'+T.act,nom:'CCF '+ACTS[T.act].nom,color:COL,classe:c.nom,eleves:L.filter(r=>!r.ev.st&&r.N.tot!=null).map(r=>({full:r.p.full,bytes:()=>pdfFor([r.p.k])}))})}
