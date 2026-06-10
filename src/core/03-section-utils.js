/* =====================================================================
   §4 Custom section + section helpers
   ===================================================================== */
function secByName(name){
  if(name==="CUSTOM") return null;
  return SECTIONS.find(s=>s.name===name) || null;
}
// Resolve a member slot to the 5 numbers everything downstream consumes.
function resolveSec(name, custom){
  if(name==="CUSTOM"){
    const c = custom||{};
    return {name:"Custom I-section", type:"CUSTOM",
      h:+c.h||400, b:+c.b||180, tf:+c.tf||12, tw:+c.tw||8, r:+c.r||10,
      A_cm2:null, mass:null, custom:true};
  }
  const s = secByName(name);
  return s ? Object.assign({}, s) : resolveSec("CUSTOM", custom);
}
// Derived geometry §4
function clearDepth(s){ return s.h - 2*s.tf - 2*s.r; }        // d, flat web zone
function serialSize(s){ // for sorting: leading "DDDxWWW"
  const m = /(\d+)X(\d+)/i.exec(s.name||""); return m?[+m[1],+m[2]]:[0,0];
}
function sectionsByType(t){
  return SECTIONS.filter(s=>s.type===t).sort((a,b)=>{
    const [da,wa]=serialSize(a),[db,wb]=serialSize(b);
    return db-da || wb-wa || a.mass-b.mass;
  });
}
