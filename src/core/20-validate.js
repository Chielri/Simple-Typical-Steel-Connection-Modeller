/* =====================================================================
   §6  VALIDATION engine  ->  [{level, code, msg, tags}]
   Detailing / buildability rules only — no capacity (see Capacity stub).
   Clause basis: hole positioning  EN 1993-1-8 §3.5 Table 3.3;
   weld ductility  EN 1993-1-8 §4.5.3 + Table 4.1;
   fit-up & buildability  SSSS (Liew 2019) / SCI P358.
   ===================================================================== */
function validate(st){
  const out=[], {sec,prim}=members(), conn=st.conn;
  const add=(level,code,msg,tags)=>out.push({level,code,msg,tags:tags||[]});
  const fin=conn.endsWith("FIN"), ep=conn.endsWith("EP"), bolted=fin||ep;
  const anchors=conn.startsWith("BCON")||conn.startsWith("CCON");
  if(bolted){
    const d0=holeDia(), bd=boltProps().d;
    const t = fin ? Math.min(st.tp, sec.tw) : Math.min(st.tep, prim.tw||st.tep);
    // Full-strength leg/tₚ for a double fillet to out-develop the plate's tension
    // yield (simplified method, EN 1993-1-8 §4.5.3.3 + β_w Table 4.1, fu per
    // EN 10025-2): S275 → 0.87, S355 → 1.04. A flat 0.8 is grade-blind and ~23 %
    // short on S355 (the default grade), so the weld can rupture before the plate yields.
    const kWeld = st.grade==="S355" ? 1.04 : 0.87;
    // §6.1 / EN 1993-1-8 §3.5 Table 3.3 — hole-positioning minima (errors)
    if(st.e1 < 1.2*d0) add("error","E-E1MIN",`e₁ = ${st.e1} < 1.2·d₀ = ${(1.2*d0).toFixed(1)}`,["e1"]);
    if(fin && st.e2 < 1.2*d0) add("error","E-E2MIN",`e₂ = ${st.e2} < 1.2·d₀ = ${(1.2*d0).toFixed(1)}`,["e2"]);
    if(st.p1 < 2.2*d0) add("error","E-P1MIN",`p₁ = ${st.p1} < 2.2·d₀ = ${(2.2*d0).toFixed(1)}`,["p1"]);
    if(fin && st.n2>1 && st.p2 < 2.4*d0) add("error","E-P2MIN",`p₂ = ${st.p2} < 2.4·d₀ = ${(2.4*d0).toFixed(1)}`,["p2"]);
    if(ep && st.w < 2.4*d0) add("error","E-WMIN",`w = ${st.w} < 2.4·d₀ = ${(2.4*d0).toFixed(1)}`,["w"]);
    // §6.1 / EN 1993-1-8 §3.5 Table 3.3 — maxima (warn)
    const eMax=4*t+40, pMax=Math.min(14*t,200);
    if(st.e1>eMax) add("warn","W-E1MAX",`e₁ = ${st.e1} > 4t+40 = ${eMax}`,["e1"]);
    if(fin && st.e2>eMax) add("warn","W-E2MAX",`e₂ = ${st.e2} > 4t+40 = ${eMax}`,["e2"]);
    if(st.p1>pMax) add("warn","W-P1MAX",`p₁ = ${st.p1} > min(14t,200) = ${pMax}`,["p1"]);
    if(fin && st.n2>1 && st.p2>pMax) add("warn","W-P2MAX",`p₂ = ${st.p2} > min(14t,200) = ${pMax}`,["p2"]);
    // §6.2 fit-up: bolt group within clear web depth d of supported beam
    //   (detailing convention — SCI P358 / SSSS, not a numbered EC3 clause)
    const dz=clearDepth(sec), grp=(st.n1-1)*st.p1 + 2*st.e1;
    if(grp > dz+1) add("error","E-FITDEPTH",`bolt group height ${Math.round(grp)} exceeds clear web depth d = ${Math.round(dz)} of ${sec.name}`,["bolts","p1"]);
    // §6.3 buildability / ductility (SSSS, SCI P358) (warn)
    if(fin && st.tp > 0.5*bd) add("warn","W-DUCT",`tₚ = ${st.tp} > 0.5·d_bolt = ${0.5*bd}; verify short-fin-plate ductility per SCI P358`,["tp"]);
    if(fin && st.weldLeg < kWeld*st.tp) add("warn","W-WELDLEG",`fin weld s = ${st.weldLeg} < ${kWeld}·tₚ = ${(kWeld*st.tp).toFixed(1)} (${st.grade}: plate must yield before weld)`,["weld"]);
    if(fin && st.conn==="BB-FIN" && st.finPos==="outside"){
      const la = st.bp>0 ? Math.max(st.bp - st.e2 - (st.n2-1)*st.p2, 20) : Math.max(50, 2*bd);
      const lever = Math.round((prim.b-prim.tw)/2 + la + (st.n2-1)*st.p2/2);   // support face → bolt group
      add("warn","W-FINEXT",`outside (extended) fin plate, welded all-round to web + both flanges: lever arm support → bolt group ≈ ${lever} mm — verify per SSSS (long fin plate)`,["tp","bp"]);
    }
    // far beam (side 2): EC3-1-8 §3.5 minima + fit-up on the independent far connection (BB-FIN/EP)
    if(st.beam2 && (st.conn==="BB-FIN"||st.conn==="BB-EP")){
      const stB=farBeamState(st), d0B=holeDia(stB), secB=members(stB).sec;
      if(st.e1B < 1.2*d0B) add("error","E-E1MIN-F",`far beam e₁ = ${st.e1B} < 1.2·d₀ = ${(1.2*d0B).toFixed(1)}`,["e1B"]);
      if(st.p1B < 2.2*d0B) add("error","E-P1MIN-F",`far beam p₁ = ${st.p1B} < 2.2·d₀ = ${(2.2*d0B).toFixed(1)}`,["p1B"]);
      if(fin && st.n2B>1 && st.p2B < 2.4*d0B) add("error","E-P2MIN-F",`far beam p₂ = ${st.p2B} < 2.4·d₀ = ${(2.4*d0B).toFixed(1)}`,["p2B"]);
      if(ep && st.wB < 2.4*d0B) add("error","E-WMIN-F",`far beam w = ${st.wB} < 2.4·d₀ = ${(2.4*d0B).toFixed(1)}`,["wB"]);
      const dzB=clearDepth(secB), grpB=(st.n1B-1)*st.p1B + 2*st.e1B;
      if(grpB > dzB+1) add("error","E-FITDEPTH-F",`far beam bolt group ${Math.round(grpB)} exceeds clear web depth ${Math.round(dzB)} of ${secB.name}`,["p1B"]);
      if(fin && st.weldLegB < kWeld*st.tpB) add("warn","W-WELDLEG-F",`far weld s = ${st.weldLegB} < ${kWeld}·tₚ = ${(kWeld*st.tpB).toFixed(1)} (${st.grade}: plate must yield before weld)`,["weldB"]);
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
  // A 4 mm fillet leg is a fabrication-practice floor — EN 1993-1-8 §4.5.2 sets a 3 mm
  // minimum throat, not a 4 mm leg — so this is a buildability warning, not a code error.
  if(active("weldLeg") && st.weldLeg < 4) add("warn","W-WELDMIN",`fillet leg ${st.weldLeg} < 4 mm fabrication-practice floor (EN 1993-1-8 §4.5.2: 3 mm min throat)`,["weld"]);
  if(st.conn.startsWith("BB") && st.beam2 && st.weldLegB < 4) add("warn","W-WELDMIN-F",`far weld leg ${st.weldLegB} < 4 mm fabrication-practice floor`,["weldB"]);
  if(!out.length) add("ok","OK","All detailing checks pass.",[]);
  return out;
}
