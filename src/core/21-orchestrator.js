/* =====================================================================
   §7  RENDER orchestrator
   ===================================================================== */
let RED = new Set();
function ratioLabel(scale, forced){ const n=1/(scale*MM_PER_PX); const r=n<10?n.toFixed(1):Math.round(n); return "1:"+r+(forced?"":" (fit)"); }
function fitScale(prims, svg){ const W=svg.clientWidth||880,H=560,pad=28,bb=bboxOf(prims); return Math.min((W-2*pad)/bb.w,(H-2*pad)/bb.h); }
function memberSummary(){ const {sec,prim}=members(), c=state.conn;
  if(c.startsWith("CCON")) return prim.name+" → concrete";
  if(c.startsWith("BCON")) return sec.name+" → concrete";
  if(c.startsWith("BB") && state.beam2){ const f=members(farBeamState(state)).sec; return sec.name+" + "+f.name+" → "+prim.name; }
  return sec.name+" → "+prim.name; }

function redraw(){
  let geo; try{ geo=GEO[state.conn](state); }
  catch(e){ console.error(e); geo={A:[Pr.txt(0,0,"⚠ geometry error: "+e.message,{anchor:"start"})],B:[]}; }
  const items=validate(state);
  RED=new Set(); items.forEach(it=>{ if(it.level==="error") it.tags.forEach(t=>RED.add(t)); });
  const svgA=document.getElementById("viewA"), svgB=document.getElementById("viewB");
  const showA=state.view!=="B", showB=state.view!=="A";
  document.getElementById("figA").style.display=showA?"":"none";
  document.getElementById("figB").style.display=showB?"":"none";
  let forced=false, scale=1;
  if(state.drawScale!=="auto"){ scale=1/(Number(state.drawScale)*MM_PER_PX); forced=true; }
  else { const sc=[]; if(showA&&geo.A.length)sc.push(fitScale(geo.A,svgA)); if(showB&&geo.B.length)sc.push(fitScale(geo.B,svgB)); scale=sc.length?Math.min(...sc):1; }
  if(showA) renderView(svgA,geo.A,scale); else svgA.innerHTML="";
  if(showB) renderView(svgB,geo.B,scale); else svgB.innerHTML="";
  if(forced){ // physical sizing so 1:n prints true
    for(const [svg,show,prims] of [[svgA,showA,geo.A],[svgB,showB,geo.B]]) if(show){
      const W=svg.clientWidth||880; svg.style.width=(W*MM_PER_PX).toFixed(1)+"mm"; svg.style.height=(560*MM_PER_PX).toFixed(1)+"mm"; }
  } else { svgA.style.width=svgA.style.height=""; svgB.style.width=svgB.style.height=""; }
  const cd=CONN[state.conn], ms=memberSummary();
  const vBcap = (state.conn.startsWith("BB") && state.beam2) ? "Elevation (far beam)" : cd.vB;
  document.getElementById("capA").textContent=cd.vA+" — "+ms;
  document.getElementById("capB").textContent=vBcap+" — "+ms;
  document.getElementById("scaleA").textContent=showA?ratioLabel(scale,forced):"";
  document.getElementById("scaleB").textContent=showB?ratioLabel(scale,forced):"";
  const today=new Date().toISOString().slice(0,10);
  document.getElementById("connTitle").textContent=`${state.conn} · ${cd.name} · ${ms} · ${today}`;
  document.getElementById("titleStrip").innerHTML=
    `<span>${state.conn} — ${cd.name}</span><span class="sep">|</span><span class="muted">${ms}</span>`
    +`<span class="sep">|</span><span class="muted">${state.grade}</span><span class="sep">|</span>`
    +`<span class="muted">${today}</span><span class="sep">|</span><span class="muted">${ratioLabel(scale,forced)}</span>`;
  renderValidation(items);
  if(state.showParamTable) renderParamTable();
}
function debounce(fn,ms){ let h; return function(){ clearTimeout(h); h=setTimeout(fn,ms); }; }
const redrawD = debounce(redraw,50);

function renderValidation(items){
  const box=document.getElementById("validate");
  const ne=items.filter(i=>i.level==="error").length, nw=items.filter(i=>i.level==="warn").length;
  let h=`<h4>Validation `;
  h+= ne?`<span class="vbadge e">${ne} error${ne>1?"s":""}</span>`:`<span class="vbadge ok">no errors</span>`;
  if(nw) h+=`<span class="vbadge w">${nw} warn${nw>1?"s":""}</span>`;
  h+=`</h4>`;
  // Standing disclaimer (§4 review): a clean result is geometry/spacing only — no capacity is computed.
  h+=`<div class="vnote"><b>Detailing check only</b> — bolt, weld &amp; plate capacities are <b>not</b> calculated. A clear result means geometry &amp; spacing are legal, not that shear, bearing, weld or block-tearing resistance is adequate.</div>`;
  for(const it of items){
    if(it.level==="ok"){ h+=`<div class="vitem ok"><span class="code">OK</span><span>${it.msg}</span></div>`; continue; }
    h+=`<div class="vitem ${it.level==="error"?"e":"w"}"><span class="code">${it.code}</span><span>${it.msg}</span></div>`;
  }
  box.innerHTML=h;
}
function renderParamTable(){
  const wrap=document.getElementById("paramTableWrap"); wrap.hidden=false;
  const {sec,prim}=members(); const rows=[];
  rows.push(["Connection", state.conn+" — "+CONN[state.conn].name]);
  rows.push(["Members", memberSummary()]);
  rows.push(["Steel grade", state.grade]);
  for(const k of (SCHEMA[state.conn]||[])){ const c=CONTROLS[k]; if(!c||c.hidden) continue;
    if(c.group===G.FAR && !state.beam2) continue;
    if(k==="ts" && !state.farStiff && (state.conn==="BB-FIN"||state.conn==="BB-EP")) continue;
    let v=state[k]; if((k==="hp"||k==="hpB")&&v==0)v="auto"; if((k==="bp"||k==="bpB"||k==="Bp"||k==="Lp"||k==="hef"||k==="sa1"||k==="sa2"||k==="stiffHeight")&&v==0)v="auto";
    if(k==="secSec"||k==="primSec"||k==="secSecB"){ const ck=k==="secSec"?"secCustom":k==="secSecB"?"secCustomB":"primCustom"; v=resolveSec(v,state[ck]).name; }
    rows.push([c.label, v]); }
  // derived
  if(state.conn.endsWith("FIN")||state.conn.endsWith("EP")) rows.push(["Hole d₀ (derived)", holeDia()+" mm"]);
  if(state.conn.startsWith("BCON")||state.conn.startsWith("CCON")) rows.push(["hₑf (used)", hefVal()+" mm"]);
  let h=`<h3>Parameter summary — ${state.conn}</h3><table class="pt"><caption>${memberSummary()} · ${new Date().toISOString().slice(0,10)}</caption>`;
  for(const [k,v] of rows) h+=`<tr><th>${k}</th><td>${v}</td></tr>`;
  h+=`</table>`; wrap.innerHTML=h;
}
