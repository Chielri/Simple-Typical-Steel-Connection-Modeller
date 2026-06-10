/* =====================================================================
   Export / import / print  (§8)  + Phase-2 capacity stub (§9.6)
   ===================================================================== */
const Capacity = { boltShear:()=>null, plateBearing:()=>null, weldResistance:()=>null, run:()=>null }; // stub boundary

function resolveVars(s){ const cs=getComputedStyle(document.documentElement);
  return s.replace(/var\((--[a-zA-Z0-9_]+)\)/g,(m,n)=>(cs.getPropertyValue(n).trim()||"#000")); }
function standaloneSVG(){
  const svgA=document.getElementById("viewA"), svgB=document.getElementById("viewB");
  const showA=state.view!=="B", showB=state.view!=="A";
  const parts=[]; let W=0,H=0, gap=20;
  if(showA){ const vb=svgA.getAttribute("viewBox").split(" ").map(Number); parts.push({svg:svgA,w:vb[2],h:vb[3]}); }
  if(showB){ const vb=svgB.getAttribute("viewBox").split(" ").map(Number); parts.push({svg:svgB,w:vb[2],h:vb[3]}); }
  const vH=Math.max(...parts.map(p=>p.h)); W=parts.reduce((a,p)=>a+p.w,0)+gap*(parts.length-1);
  const strip=34; H=vH+strip;
  let inner="", x=0;
  for(const p of parts){ inner+=`<g transform="translate(${x},0)">`+p.svg.innerHTML+`</g>`; x+=p.w+gap; }
  // §7 title strip: connection ID + members + date, report-ready
  const cd=CONN[state.conn], scl=document.getElementById("scaleA").textContent||"";
  const title=`${state.conn} — ${cd.name}    ${memberSummary()}    ${state.grade}    ${new Date().toISOString().slice(0,10)}    Scale ${scl}`;
  const footer=`<g transform="translate(0,${vH})"><rect x="0" y="0" width="${W}" height="${strip}" fill="#ffffff" stroke="#1a1f26" stroke-width="0.8"/>`
    +`<text x="10" y="22" font-family="Segoe UI,Arial" font-size="13" font-weight="700" fill="#1a1f26">${title.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</text></g>`;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
       +`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`+inner+footer+`</svg>`;
  return resolveVars(s);
}
function download(name, blob){ const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
function exportSVG(){ download(state.conn+".svg", new Blob([standaloneSVG()],{type:"image/svg+xml"})); }
function exportPNG(){
  const s=standaloneSVG(), img=new Image();
  const m=/width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/.exec(s); const W=+m[1],H=+m[2], sc=2;
  img.onload=()=>{ const cv=document.createElement("canvas"); cv.width=W*sc; cv.height=H*sc; const ctx=cv.getContext("2d");
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,cv.width,cv.height); ctx.scale(sc,sc); ctx.drawImage(img,0,0);
    cv.toBlob(b=>download(state.conn+"@2x.png",b),"image/png"); };
  img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s);
}
function exportJSON(){ download(state.conn+".json", new Blob([JSON.stringify(state,null,2)],{type:"application/json"})); }
function importJSON(file){ const r=new FileReader(); r.onload=()=>{ try{ const o=JSON.parse(r.result);
  if(!o.conn||!SCHEMA[o.conn]) throw new Error("unrecognised connection id"); state=Object.assign(defaultState(o.conn),o);
  document.body.classList.toggle("dark",state.theme==="dark"); buildTiles(); buildPanel(); redraw();
  }catch(e){ alert("Load failed: "+e.message); } }; r.readAsText(file); }

function bindTopbar(){
  document.getElementById("viewSeg").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b)return;
    state.view=b.dataset.v; [...e.currentTarget.children].forEach(x=>x.classList.toggle("on",x===b)); redraw(); });
  document.getElementById("btnTable").onclick=()=>{ state.showParamTable=!state.showParamTable;
    const w=document.getElementById("paramTableWrap"); if(state.showParamTable)renderParamTable(); else w.hidden=true; };
  document.getElementById("btnSVG").onclick=exportSVG;
  document.getElementById("btnPNG").onclick=exportPNG;
  document.getElementById("btnSave").onclick=exportJSON;
  document.getElementById("btnLoad").onclick=()=>document.getElementById("fileIn").click();
  document.getElementById("fileIn").onchange=e=>{ if(e.target.files[0])importJSON(e.target.files[0]); e.target.value=""; };
  document.getElementById("btnPrint").onclick=()=>{ if(!state.showParamTable){state.showParamTable=true;renderParamTable();} window.print(); };
  document.getElementById("btnTheme").onclick=()=>{ document.body.classList.toggle("dark"); state.theme=document.body.classList.contains("dark")?"dark":"light"; redraw(); };
}
function buildDatalists(){
  const ukb=sectionsByType("UKB"), ukc=sectionsByType("UKC");
  const mk=(id,first,second)=>{ const dl=el("datalist",{id},document.body);
    el("option",{value:"CUSTOM",label:"Custom I-section"},dl);
    for(const s of first) el("option",{value:s.name,label:`${s.type} ${s.mass}kg/m`},dl);
    for(const s of second) el("option",{value:s.name,label:`${s.type} ${s.mass}kg/m`},dl); };
  mk("dlBeam",ukb,ukc); mk("dlCol",ukc,ukb);
}
