/* ---------------- BB-FIN : Beam-to-beam fin plate ------------------- */
// One-sided fin-plate ELEVATION: supporting SECTION + supported beam in elevation (bolts as
// holes). Parameterised by `st`, so it draws either the near beam or the independent far beam.
// opts.stiff -> add the full-depth far-side stiffener; opts.tag -> beam label suffix.
function finElevation(st, opts){
  opts = opts||{};
  const out=[], fg=finGeom(st), {sec,prim,bp,yc,ys,xs,baseX,ftip,outside,plCy,plH,d0}=fg;
  const notch = notchAuto(st, sec, prim);            // "none" when outside (no cope)
  const g = st.g, Lsec = Math.max(sec.h*1.0, 360);
  const bgx = xs[0] + (st.n2-1)*st.p2/2;             // bolt group centre x
  const xb0 = baseX + g;                             // secondary beam end (gap g from reference face)
  const wleg = Math.max(st.weldLeg, 4);
  const plTop = plCy + plH/2, plBot = plCy - plH/2;  // fin plate top / bottom edges
  // "outside" plate is full depth at the support but must be cropped where it overlaps the
  // supported beam, so it does not foul that beam's flange(s) (per SCI/detailing practice).
  const topU = yc + sec.h/2 - sec.tf, botU = yc - sec.h/2 + sec.tf;   // supported flange undersides
  const cropTop = outside ? Math.min(plTop, topU) : plTop;
  const cropBot = outside ? Math.max(plBot, botU) : plBot;
  const cropped = outside && (plTop-cropTop>0.5 || cropBot-plBot>0.5);

  // main/supporting beam shown as a cut I-section, web right face at x=0
  const iP = iSectionPts(-prim.tw/2, 0, prim.h, prim.b, prim.tf, prim.tw);
  out.push(Pr.hatch(iP,"steel",{edge:false})); out.push(Pr.poly(iP,"out"));
  label(out, -(prim.b+prim.tw)/2-6, 0, prim.name+"  (main)", {anchor:"middle", rot:-90, weight:"bold"});
  if(opts.stiff) farStiffener(out, prim, st.ts, wleg);   // optional full-depth far-side stiffener

  // fin plate welded to main web (all-around web + both flanges when "outside"), projecting right.
  // Full depth at the support; cropped past the beam end (x>=xb0) to clear the supported flange(s).
  if(cropped)
    out.push(Pr.poly([[0,plTop],[xb0,plTop],[xb0,cropTop],[bp,cropTop],[bp,cropBot],[xb0,cropBot],[xb0,plBot],[0,plBot]],"plate"));
  else
    out.push(Pr.r(0, plBot, bp, plH, "plate"));
  out.push(...weldRun(0, plBot, 0, plTop, wleg, 1));                  // web weld (full plate height)
  if(outside){
    out.push(...weldRun(0, plTop, ftip, plTop, wleg, 1));            // top-flange weld
    out.push(...weldRun(0, plBot, ftip, plBot, wleg, -1));           // bottom-flange weld
  }
  out.push(Pr.weld(0, plTop-12, ftip+50, plTop+30, {kind:st.weldType, size:st.weldLeg, both:true, allAround:outside, text:outside?"all round":"typ."}));
  out.push(...beamElevNotched(xb0, xb0+Lsec, yc, sec.h, sec.tf, notch, "out"));
  const bg = boltGridElev(bgx, yc, st.n1, st.n2, st.p1, st.p2, d0, "bolts"); out.push(...bg.prims);

  // dimensions
  chainV(out, xs[0], -((prim.b+prim.tw)/2 + 32 + xs[0]), [cropTop].concat(ys).concat([cropBot]).sort((p,q)=>q-p), "p1");
  dimV(out, xb0+Lsec, yc-sec.h/2, yc+sec.h/2, 34, String(Math.round(sec.h)));
  dimH(out, yc-sec.h/2-26, baseX, baseX+g, -20, String(g), "gap");
  if(outside) dimH(out, plTop+22, 0, ftip, 18, String(Math.round(ftip)), "proj"); // plate cantilever over the flange
  if(st.n2>1) chainH(out, plTop+(outside?40:22), 18, xs, "p2");
  if(notch.top){ dimH(out, yc+sec.h/2+18, xb0, xb0+notch.top.len, 16, String(notch.top.len), "notch");
                 dimV(out, xb0+notch.top.len+8, yc+sec.h/2, yc+sec.h/2-notch.top.dep, 22, String(notch.top.dep), "notch"); }
  label(out, xb0+Lsec*0.5, yc+sec.h/2+30, sec.name+"  ("+(opts.tag||"supported")+")", {anchor:"middle", weight:"bold"});
  label(out, bp+12, plBot-6, [plCallout(st.tp,bp,plH,st.grade)+(outside?(cropped?"  (welded all round; cropped to clear flange)":"  (welded all round)"):""),
        bCallout(st.n1*st.n2, st.bolt, st.boltGrade, d0)], {lh:14});
  return out;
}

// SECTION: supporting beam in elevation + supported beam cut as a cross-section + bolt side-views.
// opts.stiff -> show the far-side stiffener (hidden, behind the web).
function finSection(st, opts){
  opts = opts||{};
  const out=[], fg=finGeom(st), {sec,prim,b,yc,ys,outside,plCy,plH,pyHalf}=fg;
  const wleg = Math.max(st.weldLeg, 4);
  const plTop = plCy + plH/2, plBot = plCy - plH/2;
  const scx = st.tp + sec.tw/2;
  const Lmain = Math.max(sec.b + 300, 440);
  out.push(...beamElevBreak(scx, Lmain, 0, prim.h, prim.tf, "out"));     // main beam in elevation (broken segment)
  // optional full-depth stiffener on the far face (behind the web in this view), flange to flange
  if(opts.stiff) out.push(Pr.r(-st.ts, -pyHalf, st.ts, 2*pyHalf, "plate", {dash:"6,4"}));
  // fin plate seen edge-on at main web near face (full depth + all-around weld when outside)
  out.push(Pr.hatch([[0,plBot],[st.tp,plBot],[st.tp,plTop],[0,plTop]],"steel",{edge:false}));
  out.push(Pr.r(0, plBot, st.tp, plH, "plate"));
  out.push(...weldRun(0, plBot, 0, plTop, wleg, 1));                  // web weld
  if(outside){
    out.push(...weldRun(0, plTop, st.tp, plTop, wleg, 1));           // top-flange weld (section)
    out.push(...weldRun(0, plBot, st.tp, plBot, wleg, -1));          // bottom-flange weld (section)
  }
  // supported beam SECTION (cut) — masks the main beam behind it, hatched, bold outline
  const iS = iSectionPts(scx, yc, sec.h, sec.b, sec.tf, sec.tw);
  out.push(Pr.poly(iS,"fillonly",{fill:"var(--paper)"}));      // white mask over main beam
  out.push(Pr.poly(iS,"fillonly",{fill:"url(#hatchSteel)"}));  // section hatch (on top of mask)
  out.push(Pr.poly(iS,"out",{w:1.9}));                         // bold cut outline
  for(const y of ys) out.push(...boltSide(0, y, st.tp+sec.tw, "left", b.d, b.washer));
  // dims
  if(st.n1>1) chainV(out, scx, sec.b/2+34, [plTop].concat(ys).concat([plBot]).sort((p,q)=>q-p), "p1");
  dimV(out, scx-Lmain/2-22, -prim.h/2, prim.h/2, -16, String(Math.round(prim.h)));
  out.push(Pr.weld(0, plBot+10, st.tp+60, plBot-30, {kind:st.weldType, size:st.weldLeg, both:true, allAround:outside, text:outside?"all round":"typ."}));
  label(out, scx, prim.h/2+34, prim.name+"  (main)", {anchor:"middle", weight:"bold"});
  label(out, scx, prim.h/2+16, sec.name+"  (supported)", {anchor:"middle", size:10});
  return out;
}

GEO["BB-FIN"] = function(st){ return bbDoubleSided(st, finElevation, finSection); };
