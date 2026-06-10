/* =====================================================================
   §8  UI builder (left panel)
   ===================================================================== */
function el(tag,attrs,parent){ const e=document.createElement(tag); if(attrs)for(const k in attrs){ if(k==="text")e.textContent=attrs[k]; else if(k==="html")e.innerHTML=attrs[k]; else e.setAttribute(k,attrs[k]); } if(parent)parent.appendChild(e); return e; }

function buildTiles(){
  const box=document.getElementById("tiles"); box.innerHTML="";
  for(const fam of FAMILIES){
    el("div",{class:"fam",text:fam.label},box);
    for(const id of fam.ids){
      const t=el("div",{class:"tile"+(state.conn===id?" sel":"")},box);
      el("div",{class:"id",text:id},t); el("div",{class:"nm",text:CONN[id].name},t);
      t.onclick=()=>{ const keep={view:state.view,drawScale:state.drawScale,theme:state.theme,showParamTable:state.showParamTable};
        state=defaultState(id); Object.assign(state,keep); buildTiles(); buildPanel(); redraw(); };
    }
  }
}
function numField(key){
  const c=CONTROLS[key], wrap=el("div",{class:"numwrap"});
  const inp=el("input",{type:"number",value:state[key],step:c.step||1,min:c.min,max:c.max},wrap);
  const stp=el("div",{class:"stp"},wrap); const up=el("button",{text:"▲"},stp), dn=el("button",{text:"▼"},stp);
  const commit=v=>{ v=Math.max(c.min!=null?c.min:-1e9,Math.min(c.max!=null?c.max:1e9, v)); state[key]=v; inp.value=v; redrawD(); };
  inp.oninput=()=>{ const v=parseFloat(inp.value); if(!isNaN(v)){ state[key]=v; redrawD(); } };
  inp.onblur=()=>{ const v=parseFloat(inp.value); commit(isNaN(v)?(c.def||0):v); };
  up.onclick=()=>commit((parseFloat(inp.value)||0)+(c.step||1));
  dn.onclick=()=>commit((parseFloat(inp.value)||0)-(c.step||1));
  return wrap;
}
function enumField(key){ const c=CONTROLS[key], s=el("select");
  for(const o of c.opts){ const op=el("option",{value:o,text:o},s); if(state[key]==o)op.selected=true; }
  s.onchange=()=>{ state[key]=s.value; if(key==="axis"||key==="epMode"||key==="concType"||key==="anchorType"||key==="finPos")buildPanel(); redraw(); }; return s; }
function boolField(key){ const lab=el("label",{class:"chk"}); const cb=el("input",{type:"checkbox"},lab); cb.checked=!!state[key];
  cb.onchange=()=>{ state[key]=cb.checked; buildPanel(); redraw(); }; lab.appendChild(document.createTextNode(" on")); return lab; }
function sectionField(key){
  const c=CONTROLS[key], frag=document.createDocumentFragment();
  const listId = slotKind(state.conn,key)==="col"?"dlCol":"dlBeam";
  const inp=el("input",{list:listId,value:state[key],class:"secinp"},frag);
  inp.onchange=()=>{ state[key]=inp.value.trim().toUpperCase(); buildPanel(); redraw(); };
  inp.oninput=()=>{ state[key]=inp.value.trim().toUpperCase(); redrawD(); };
  if(state[key]==="CUSTOM"){
    const ck=key==="secSec"?"secCustom":key==="secSecB"?"secCustomB":"primCustom", cv=state[ck];
    const grid=el("div",{class:"fld full",style:"display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:4px"},frag);
    for(const f of ["h","b","tf","tw","r"]){ const w=el("div",{},grid); el("label",{text:f,style:"font-size:10px"},w);
      const ii=el("input",{type:"number",value:cv[f],step:f==="r"?0.5:1,style:"width:100%"},w);
      ii.oninput=()=>{ cv[f]=parseFloat(ii.value)||0; redrawD(); }; }
  }
  return frag;
}
function buildPanel(){
  const box=document.getElementById("accordions"); box.innerHTML="";
  // global group
  const gWrap=el("details",{class:"acc",open:""},box); el("summary",{text:"Global"},gWrap);
  const gBody=el("div",{class:"body"},gWrap);
  const gradeF=el("div",{class:"fld"},gBody); el("label",{text:"Steel grade"},gradeF);
  const gs=el("select",{},gradeF); for(const o of ["S275","S355"]){const op=el("option",{value:o,text:o},gs); if(state.grade==o)op.selected=true;} gs.onchange=()=>{state.grade=gs.value;redraw();};
  const scF=el("div",{class:"fld"},gBody); el("label",{text:"Drawing scale"},scF);
  const ss=el("select",{},scF); for(const o of [["auto","auto"],["5","1:5"],["10","1:10"],["20","1:20"]]){const op=el("option",{value:o[0],text:o[1]},ss); if(String(state.drawScale)==o[0])op.selected=true;} ss.onchange=()=>{state.drawScale=ss.value;redraw();};
  // connection groups
  const keys=SCHEMA[state.conn]||[]; const groups=[];
  for(const k of keys){ const c=CONTROLS[k]; if(!c||c.hidden) continue; const g=c.group;
    let grp=groups.find(x=>x.g===g); if(!grp){grp={g,keys:[]};groups.push(grp);} grp.keys.push(k); }
  for(const grp of groups){
    const acc=el("details",{class:"acc",open:""},box); el("summary",{text:grp.g},acc);
    const body=el("div",{class:"body"},acc);
    for(const k of grp.keys){ const c=CONTROLS[k];
      // conditional visibility
      if(k==="doublerT" && !state.doubler) continue;
      if(k==="wallT" && state.concType!=="wall") continue;
      if((k==="notchMode"||k==="notchLen"||k==="notchDep"||k==="hp") && state.conn==="BB-FIN" && state.finPos==="outside") continue;
      if(c.group===G.FAR && !state.beam2) continue;                               // far-beam controls only when 2nd beam on
      if(k==="ts" && !state.farStiff && (state.conn==="BB-FIN"||state.conn==="BB-EP")) continue; // stiffener thk only when far stiffener on (BB-W has its own ts)
      if((k==="notchModeB"||k==="hpB") && state.conn==="BB-FIN" && state.finPosB==="outside") continue;  // outside far plate: no cope / auto depth
      if((k==="sa1"||k==="sa2")) {/* keep */}
      const f=el("div",{class:"fld"+(c.type==="section"?" full":"")},body);
      const lab=el("label",{},f); lab.textContent=c.label; if(c.hint){ const ic=el("span",{class:"ico",title:c.hint,text:" ⓘ"}); lab.appendChild(ic); }
      let ctl;
      if(c.type==="number") ctl=numField(k);
      else if(c.type==="enum") ctl=enumField(k);
      else if(c.type==="bool") ctl=boolField(k);
      else if(c.type==="section") ctl=sectionField(k);
      f.appendChild(ctl);
    }
  }
}
