/* ---------------- BB-FIN : Beam-to-beam fin plate ------------------- */
GEO["BB-FIN"] = function(st){
  const A=[], B=[], fg=finGeom(st), {sec,prim,b,la,bp,hp,yc,ys,xs,d0}=fg;
  const notch = notchAuto(st, sec, prim);
  const g = st.g, Lsec = Math.max(sec.h*1.0, 360);
  const bgx = la + (st.n2-1)*st.p2/2;               // bolt group centre x
  const ftip = (prim.b - prim.tw)/2;                // main beam right flange tip (web right face at x=0)

  /* ----- View A : MAIN beam SECTION + supported beam ELEVATION (bolts = holes) ----- */
  // main/supporting beam shown as a cut I-section, web right face at x=0
  const iP = iSectionPts(-prim.tw/2, 0, prim.h, prim.b, prim.tf, prim.tw);
  A.push(Pr.hatch(iP,"steel",{edge:false})); A.push(Pr.poly(iP,"out"));
  label(A, -(prim.b+prim.tw)/2-6, 0, prim.name+"  (main)", {anchor:"middle", rot:-90, weight:"bold"});
  // fin plate welded to main web, projects right; supported beam frames in
  A.push(Pr.r(0, yc-hp/2, bp, hp, "plate"));
  A.push(...weldRun(0, yc-hp/2, 0, yc+hp/2, Math.max(st.weldLeg,4), 1));
  A.push(Pr.weld(0, yc-hp/2+10, ftip+50, yc-hp/2-44, {kind:st.weldType, size:st.weldLeg, both:true, text:"typ."}));
  A.push(...beamElevNotched(g, g+Lsec, yc, sec.h, sec.tf, notch, "out"));
  const bg = boltGridElev(bgx, yc, st.n1, st.n2, st.p1, st.p2, d0, "bolts"); A.push(...bg.prims);
  // dimensions
  chainV(A, la, -((prim.b+prim.tw)/2 + 32 + la), [yc+hp/2].concat(ys).concat([yc-hp/2]).sort((p,q)=>q-p), "p1");
  dimV(A, g+Lsec, yc-sec.h/2, yc+sec.h/2, 34, String(Math.round(sec.h)));
  dimH(A, yc-sec.h/2-26, 0, g, -20, String(g), "gap");
  if(st.n2>1) chainH(A, yc+hp/2+22, 18, xs, "p2");
  if(notch.top){ dimH(A, yc+sec.h/2+18, g, g+notch.top.len, 16, String(notch.top.len), "notch");
                 dimV(A, g+notch.top.len+8, yc+sec.h/2, yc+sec.h/2-notch.top.dep, 22, String(notch.top.dep), "notch"); }
  label(A, g+Lsec*0.5, yc+sec.h/2+30, sec.name+"  (supported)", {anchor:"middle", weight:"bold"});
  label(A, bp+12, yc-hp/2-6, [plCallout(st.tp,bp,hp,st.grade),
        bCallout(st.n1*st.n2, st.bolt, st.boltGrade, d0)], {lh:14});

  /* ----- View B : MAIN beam ELEVATION + supported beam SECTION + bolt side-views ----- */
  const scx = st.tp + sec.tw/2;
  const Lmain = Math.max(sec.b + 300, 440);
  B.push(...beamElevBreak(scx, Lmain, 0, prim.h, prim.tf, "out"));     // main beam in elevation (broken segment)
  // fin plate seen edge-on at main web near face
  B.push(Pr.hatch([[0,yc-hp/2],[st.tp,yc-hp/2],[st.tp,yc+hp/2],[0,yc+hp/2]],"steel",{edge:false}));
  B.push(Pr.r(0, yc-hp/2, st.tp, hp, "plate"));
  B.push(...weldRun(0, yc-hp/2, 0, yc+hp/2, Math.max(st.weldLeg,4), 1));
  // supported beam SECTION (cut) — masks the main beam behind it, hatched, bold outline
  const iS = iSectionPts(scx, yc, sec.h, sec.b, sec.tf, sec.tw);
  B.push(Pr.poly(iS,"fillonly",{fill:"var(--paper)"}));      // white mask over main beam
  B.push(Pr.poly(iS,"fillonly",{fill:"url(#hatchSteel)"}));  // section hatch (on top of mask)
  B.push(Pr.poly(iS,"out",{w:1.9}));                         // bold cut outline
  for(const y of ys) B.push(...boltSide(0, y, st.tp+sec.tw, "left", b.d, b.washer));
  // dims
  if(st.n1>1) chainV(B, scx, sec.b/2+34, [yc+hp/2].concat(ys).concat([yc-hp/2]).sort((p,q)=>q-p), "p1");
  dimV(B, scx-Lmain/2-22, -prim.h/2, prim.h/2, -16, String(Math.round(prim.h)));
  B.push(Pr.weld(0, yc-hp/2+10, st.tp+60, yc-hp/2-40, {kind:st.weldType, size:st.weldLeg, both:true, text:"typ."}));
  label(B, scx, prim.h/2+34, prim.name+"  (main)", {anchor:"middle", weight:"bold"});
  label(B, scx, prim.h/2+16, sec.name+"  (supported)", {anchor:"middle", size:10});
  return {A,B};
};
