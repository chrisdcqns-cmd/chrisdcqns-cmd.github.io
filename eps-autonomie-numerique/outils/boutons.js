// Analyse du code des boutons (attributs on…="…") : chaque gestionnaire doit être du JavaScript valide une fois la page affichée.
const fs=require("fs");
function strip(v,PH){let o="",i=0;while(i<v.length){if(v[i]==="$"&&v[i+1]==="{"){let d=1,j=i+2;while(j<v.length&&d>0){if(v[j]==="{")d++;else if(v[j]==="}")d--;j++}o+=PH;i=j}else o+=v[i++]}return o}
const ent=c=>c.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
let tot=0,bad=0;const out=[];
for(const f of process.argv.slice(2)){
  const s=fs.readFileSync(f,"utf8").replace(/[A-Za-z0-9+\/=]{300,}/g,"");
  const inScript=[];if(f.endsWith(".html")){const r=/<script\b[^>]*>([\s\S]*?)<\/script>/g;let m;while((m=r.exec(s)))inScript.push([m.index,r.lastIndex])}
  const isJs=p=>!f.endsWith(".html")||inScript.some(([a,b])=>p>=a&&p<b);
  const re=/\bon(?:click|change|input|keydown|keyup|blur|toggle|submit|pointerdown|touchstart|error|load|ended)=(\\?)"/g;let m;const seen=new Set();
  while((m=re.exec(s))){const escq=m[1]==="\\";let i=re.lastIndex,v="",ok=false;
    while(i<s.length&&i-re.lastIndex<1500){if(s[i]==="$"&&s[i+1]==="{"){let d=1,j=i+2;while(j<s.length&&d>0){if(s[j]==="{")d++;else if(s[j]==="}")d--;j++}v+=s.slice(i,j);i=j;continue}
      if(escq&&s[i]==="\\"&&s[i+1]==='"'){ok=true;break}if(!escq&&s[i]==='"'){ok=true;break}v+=s[i++]}
    if(!ok||seen.has(v))continue;seen.add(v);if(/'\s*\+|\+\s*'/.test(v)&&!v.includes("${"))continue; /* concaténation JS classique : non analysable ici */
    tot++;const js=isJs(m.index);let fine=false,err="";
    for(const ph of ["x","0","'x'",""]){let c=strip(v,ph);if(js)c=c.replace(/\\\\/g,"\u0001").replace(/\\'/g,"'").replace(/\\`/g,"`").replace(/\\n/g," ").replace(/\u0001/g,"\\");c=ent(c);
      try{new Function("event",c);fine=true;break}catch(e){err=e.message}}
    if(!fine){bad++;out.push(f+" :: "+err+"\n     "+v.slice(0,240))}}
}
out.forEach(x=>console.log(x));console.log("boutons contrôlés :",tot,"· suspects :",bad);process.exit(bad?1:0);
