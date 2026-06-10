/* ---------------- BB-FIN : Beam-to-beam fin plate ------------------- */
GEO["BB-FIN"] = function(st){
  const A=[], B=[], fg=finGeom(st), {sec,prim,b,bp,yc,ys,xs,baseX,ftip,outside,plCy,plH,d0}=fg;
  const notch = notchAuto(st, sec, prim);            // "none" when outside (no cope)
  const g = st.g, Lsec = Math.max(sec.h*1.0, 360);
  const bgx = xs[0] + (st.n2-1)*st.p2/2;             // bolt group centre x
  const xb0 = baseX + g;                             // secondary beam end (gap g from support reference face:
                                                     // web for "between", flange tip for "outside")
  const wleg = Math.max(st.weldLeg, 4);
  const plTop = plCy + plH/2, plBot = plCy - plH/2;  // fin plate top / bottom edges

  /* ----- View A : MAIN beam SECTION + supported beam ELEVATION (bolts = holes) ----- */
  // main/supporting beam shown as a cut I-section, web right face at x=0
  const iP = iSectionPts(-prim.tw/2, 0, prim.h, prim.b, prim.tf, prim.tw);
  A.push(Pr.hatch(iP,"steel",{edge:false})); A.push(Pr.poly(iP,"out"));
  label(A, -(prim.b+prim.tw)/2-6, 0, prim.name+"  (main)", {anchor:"middle", rot:-90, weight:"bold"});
  // fin plate welded to main web; when "outside" it fills the depth between the flanges and
  // is fillet-welded all-around (web + both flange undersides), projecting past the flange tip.
  A.push(Pr.r(0, plBot, bp, plH, "plate"));
  A.push(...weldRun(0, plBot, 0, plTop, wleg, 1));                  // web weld (full plate height)
  if(outside){
    A.push(...weldRun(0, plTop, ftip, plTop, wleg, 1));            // top-flange weld
    A.push(...weldRun(0, plBot, ftip, plBot, wleg, -1));           // bottom-flange weld
  }
  A.push(Pr.weld(0, plTop-12, ftip+50, plTop+30, {kind:st.weldType, size:st.weldLeg, both:true, allAround:outside, text:outside?"all round":"typ."}));
  A.push(...beamElevNotched(xb0, xb0+Lsec, yc, sec.h, sec.tf, notch, "out"));
  const bg = boltGridElev(bgx, yc, st.n1, st.n2, st.p1, st.p2, d0, "bolts"); A.push(...bg.prims);
  // dimensions
  chainV(A, xs[0], -((prim.b+prim.tw)/2 + 32 + xs[0]), [plTop].concat(ys).concat([plBot]).sort((p,q)=>q-p), "p1");
  dimV(A, xb0+Lsec, yc-sec.h/2, yc+sec.h/2, 34, String(Math.round(sec.h)));
  dimH(A, yc-sec.h/2-26, baseX, baseX+g, -20, String(g), "gap");
  if(outside) dimH(A, plTop+22, 0, ftip, 18, String(Math.round(ftip)), "proj"); // plate cantilever over the flange
  if(st.n2>1) chainH(A, plTop+(outside?40:22), 18, xs, "p2");
  if(notch.top){ dimH(A, yc+sec.h/2+18, xb0, xb0+notch.top.len, 16, String(notch.top.len), "notch");
                 dimV(A, xb0+notch.top.len+8, yc+sec.h/2, yc+sec.h/2-notch.top.dep, 22, String(notch.top.dep), "notch"); }
  label(A, xb0+Lsec*0.5, yc+sec.h/2+30, sec.name+"  (supported)", {anchor:"middle", weight:"bold"});
  label(A, bp+12, plBot-6, [plCallout(st.tp,bp,plH,st.grade)+(outside?"  (welded all round)":""),
        bCallout(st.n1*st.n2, st.bolt, st.boltGrade, d0)], {lh:14});

  /* ----- View B : MAIN beam ELEVATION + supported beam SECTION + bolt side-views ----- */
  const scx = st.tp + sec.tw/2;
  const Lmain = Math.max(sec.b + 300, 440);
  B.push(...beamElevBreak(scx, Lmain, 0, prim.h, prim.tf, "out"));     // main beam in elevation (broken segment)
  // fin plate seen edge-on at main web near face (full depth + all-around weld when outside)
  B.push(Pr.hatch([[0,plBot],[st.tp,plBot],[st.tp,plTop],[0,plTop]],"steel",{edge:false}));
  B.push(Pr.r(0, plBot, st.tp, plH, "plate"));
  B.push(...weldRun(0, plBot, 0, plTop, wleg, 1));                  // web weld
  if(outside){
    B.push(...weldRun(0, plTop, st.tp, plTop, wleg, 1));           // top-flange weld (section)
    B.push(...weldRun(0, plBot, st.tp, plBot, wleg, -1));          // bottom-flange weld (section)
  }
  // supported beam SECTION (cut) — masks the main beam behind it, hatched, bold outline
  const iS = iSectionPts(scx, yc, sec.h, sec.b, sec.tf, sec.tw);
  B.push(Pr.poly(iS,"fillonly",{fill:"var(--paper)"}));      // white mask over main beam
  B.push(Pr.poly(iS,"fillonly",{fill:"url(#hatchSteel)"}));  // section hatch (on top of mask)
  B.push(Pr.poly(iS,"out",{w:1.9}));                         // bold cut outline
  for(const y of ys) B.push(...boltSide(0, y, st.tp+sec.tw, "left", b.d, b.washer));
  // dims
  if(st.n1>1) chainV(B, scx, sec.b/2+34, [plTop].concat(ys).concat([plBot]).sort((p,q)=>q-p), "p1");
  dimV(B, scx-Lmain/2-22, -prim.h/2, prim.h/2, -16, String(Math.round(prim.h)));
  B.push(Pr.weld(0, plBot+10, st.tp+60, plBot-30, {kind:st.weldType, size:st.weldLeg, both:true, allAround:outside, text:outside?"all round":"typ."}));
  label(B, scx, prim.h/2+34, prim.name+"  (main)", {anchor:"middle", weight:"bold"});
  label(B, scx, prim.h/2+16, sec.name+"  (supported)", {anchor:"middle", size:10});
  return {A,B};
};
