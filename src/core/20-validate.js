/* =====================================================================
   §6  VALIDATION engine  ->  [{level, code, msg, tags}]
   ===================================================================== */
function validate(st){
  const out=[], {sec,prim}=members(), conn=st.conn;
  const add=(level,code,msg,tags)=>out.push({level,code,msg,tags:tags||[]});
  const fin=conn.endsWith("FIN"), ep=conn.endsWith("EP"), bolted=fin||ep;
  const anchors=conn.startsWith("BCON")||conn.startsWith("CCON");
  if(bolted){
    const d0=holeDia(), bd=boltProps().d;
    const t = fin ? Math.min(st.tp, sec.tw) : Math.min(st.tep, prim.tw||st.tep);
    // §6.1 EC3-1-8 Table 3.3 minima (errors)
    if(st.e1 < 1.2*d0) add("error","E-E1MIN",`e₁ = ${st.e1} < 1.2·d₀ = ${(1.2*d0).toFixed(1)}`,["e1"]);
    if(fin && st.e2 < 1.2*d0) add("error","E-E2MIN",`e₂ = ${st.e2} < 1.2·d₀ = ${(1.2*d0).toFixed(1)}`,["e2"]);
    if(st.p1 < 2.2*d0) add("error","E-P1MIN",`p₁ = ${st.p1} < 2.2·d₀ = ${(2.2*d0).toFixed(1)}`,["p1"]);
    if(fin && st.n2>1 && st.p2 < 2.4*d0) add("error","E-P2MIN",`p₂ = ${st.p2} < 2.4·d₀ = ${(2.4*d0).toFixed(1)}`,["p2"]);
    if(ep && st.w < 2.4*d0) add("error","E-WMIN",`w = ${st.w} < 2.4·d₀ = ${(2.4*d0).toFixed(1)}`,["w"]);
    // §6.1 maxima (warn)
    const eMax=4*t+40, pMax=Math.min(14*t,200);
    if(st.e1>eMax) add("warn","W-E1MAX",`e₁ = ${st.e1} > 4t+40 = ${eMax}`,["e1"]);
    if(fin && st.e2>eMax) add("warn","W-E2MAX",`e₂ = ${st.e2} > 4t+40 = ${eMax}`,["e2"]);
    if(st.p1>pMax) add("warn","W-P1MAX",`p₁ = ${st.p1} > min(14t,200) = ${pMax}`,["p1"]);
    if(fin && st.n2>1 && st.p2>pMax) add("warn","W-P2MAX",`p₂ = ${st.p2} > min(14t,200) = ${pMax}`,["p2"]);
    // §6.2 fit-up: bolt group within clear web depth d of supported beam
    const dz=clearDepth(sec), grp=(st.n1-1)*st.p1 + 2*st.e1;
    if(grp > dz+1) add("error","E-FITDEPTH",`bolt group height ${Math.round(grp)} exceeds clear web depth d = ${Math.round(dz)} of ${sec.name}`,["bolts","p1"]);
    // §6.3 SSSS buildability (warn)
    if(fin && st.tp > 0.5*bd) add("warn","W-DUCT",`tₚ = ${st.tp} > 0.5·d_bolt = ${0.5*bd}; verify ductility per SSSS §2.1.3`,["tp"]);
    if(fin && st.weldLeg < 0.8*st.tp) add("warn","W-WELDLEG",`fin weld s = ${st.weldLeg} < 0.8·tₚ = ${(0.8*st.tp).toFixed(1)} (plate must yield first)`,["weld"]);
    if(fin && st.conn==="BB-FIN" && st.finPos==="outside"){
      const la = st.bp>0 ? Math.max(st.bp - st.e2 - (st.n2-1)*st.p2, 20) : Math.max(50, 2*bd);
      const lever = Math.round((prim.b-prim.tw)/2 + la + (st.n2-1)*st.p2/2);   // support face → bolt group
      add("warn","W-FINEXT",`outside (extended) fin plate: lever arm support → bolt group ≈ ${lever} mm — verify plate bending/LTB per SSSS (long fin plate)`,["tp","bp"]);
    }
    if(active("g") && st.g < 10) add("warn","W-GAPMIN",`gap g = ${st.g} < 10 mm recommended (SSSS)`,["gap"]);
    if(st.n1 < 2) add("warn","W-NMIN","minimum 2 bolt rows recommended",["bolts"]);
    if(ep){ const bpw=st.w+2*Math.max(st.e2,1.5*bd);
      if(prim.b && bpw>prim.b) add("warn","W-EPWIDTH",`end-plate width ${Math.round(bpw)} > supporting flange width ${prim.b}`,["w"]); }
  }
  if(anchors){
    const d=anchorDia();
    if(st.ca < 6*d) add("warn","W-ANCHEDGE",`anchor edge c = ${st.ca} < 6·d = ${6*d} (verify edge distance — placeholder)`,["anchor","c"]);
    if(hefVal() < 8*d) add("warn","W-HEFMIN",`hₑf = ${hefVal()} < 8·d = ${8*d} — shallow embedment`,["hef"]);
  }
  if(active("weldLeg") && st.weldLeg < 4) add("error","E-WELDMIN",`fillet leg ${st.weldLeg} < 4 mm`,["weld"]);
  if(!out.length) add("ok","OK","All detailing checks pass.",[]);
  return out;
}
