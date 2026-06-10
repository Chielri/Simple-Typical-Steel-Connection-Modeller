/* ---------------- BB-FIN : Beam-to-beam fin plate ------------------- */
// Map the independent "far beam" controls (…B keys) onto a standard state so the
// shared fin-plate geometry can draw the second connection. Supporting member shared.
function farBeamState(st){
  return Object.assign({}, st, {
    secSec:st.secSecB, secCustom:st.secCustomB,
    align:st.alignB, finPos:st.finPosB, notchMode:st.notchModeB, notchLen:0, notchDep:0,
    tp:st.tpB, hp:st.hpB, bp:st.bpB, g:st.gB,
    bolt:st.boltB, boltGrade:st.boltGradeB, n1:st.n1B, n2:st.n2B,
    p1:st.p1B, p2:st.p2B, e1:st.e1B, e2:st.e2B, hole:st.holeB,
    weldType:st.weldTypeB, weldLeg:st.weldLegB,
  });
}

// One-sided fin-plate ELEVATION: supporting SECTION + supported beam in elevation (bolts as
// holes). Parameterised by `st`, so it draws either the near beam or the independent far beam.
// opts.stiff -> draw a stiffener plate on the opposite web face; opts.tag -> beam label suffix.
function finElevation(st, opts){
  opts = opts||{};
  const out=[], fg=finGeom(st), {sec,prim,bp,yc,ys,xs,baseX,ftip,outside,plCy,plH,d0}=fg;
  const notch = notchAuto(st, sec, prim);            // "none" when outside (no cope)
  const g = st.g, Lsec = Math.max(sec.h*1.0, 360);
  const bgx = xs[0] + (st.n2-1)*st.p2/2;             // bolt group centre x
  const xb0 = baseX + g;                             // secondary beam end (gap g from reference face)
  const wleg = Math.max(st.weldLeg, 4);
  const plTop = plCy + plH/2, plBot = plCy - plH/2;  // fin plate top / bottom edges

  // main/supporting beam shown as a cut I-section, web right face at x=0
  const iP = iSectionPts(-prim.tw/2, 0, prim.h, prim.b, prim.tf, prim.tw);
  out.push(Pr.hatch(iP,"steel",{edge:false})); out.push(Pr.poly(iP,"out"));
  label(out, -(prim.b+prim.tw)/2-6, 0, prim.name+"  (main)", {anchor:"middle", rot:-90, weight:"bold"});

  // optional stiffener / backing plate on the opposite (far) web face, mirroring the fin plate
  if(opts.stiff){
    const sw = bp;
    out.push(Pr.r(-prim.tw-sw, plBot, sw, plH, "plate"));
    out.push(...weldRun(-prim.tw, plBot, -prim.tw, plTop, wleg, -1));
    label(out, -prim.tw-sw, plTop+14, "stiffener PL "+Math.round(st.ts)+" thk", {anchor:"start", size:10});
  }

  // fin plate welded to main web (all-around web + both flanges when "outside"), projecting right
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
  chainV(out, xs[0], -((prim.b+prim.tw)/2 + 32 + xs[0]), [plTop].concat(ys).concat([plBot]).sort((p,q)=>q-p), "p1");
  dimV(out, xb0+Lsec, yc-sec.h/2, yc+sec.h/2, 34, String(Math.round(sec.h)));
  dimH(out, yc-sec.h/2-26, baseX, baseX+g, -20, String(g), "gap");
  if(outside) dimH(out, plTop+22, 0, ftip, 18, String(Math.round(ftip)), "proj"); // plate cantilever over the flange
  if(st.n2>1) chainH(out, plTop+(outside?40:22), 18, xs, "p2");
  if(notch.top){ dimH(out, yc+sec.h/2+18, xb0, xb0+notch.top.len, 16, String(notch.top.len), "notch");
                 dimV(out, xb0+notch.top.len+8, yc+sec.h/2, yc+sec.h/2-notch.top.dep, 22, String(notch.top.dep), "notch"); }
  label(out, xb0+Lsec*0.5, yc+sec.h/2+30, sec.name+"  ("+(opts.tag||"supported")+")", {anchor:"middle", weight:"bold"});
  label(out, bp+12, plBot-6, [plCallout(st.tp,bp,plH,st.grade)+(outside?"  (welded all round)":""),
        bCallout(st.n1*st.n2, st.bolt, st.boltGrade, d0)], {lh:14});
  return out;
}

// SECTION: supporting beam in elevation + supported beam cut as a cross-section + bolt side-views.
// opts.stiff -> show the stiffener plate (hidden, on the far web face).
function finSection(st, opts){
  opts = opts||{};
  const out=[], fg=finGeom(st), {sec,prim,b,yc,ys,outside,plCy,plH}=fg;
  const wleg = Math.max(st.weldLeg, 4);
  const plTop = plCy + plH/2, plBot = plCy - plH/2;
  const scx = st.tp + sec.tw/2;
  const Lmain = Math.max(sec.b + 300, 440);
  out.push(...beamElevBreak(scx, Lmain, 0, prim.h, prim.tf, "out"));     // main beam in elevation (broken segment)
  // optional stiffener on the far face (behind the web in this view)
  if(opts.stiff) out.push(Pr.r(-st.ts, plBot, st.ts, plH, "plate", {dash:"6,4"}));
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

GEO["BB-FIN"] = function(st){
  const stiff = st.farStiff ? {on:true} : null;
  // View A: the near-side connection elevation (+ stiffener on the far face if enabled)
  const A = finElevation(st, {stiff, tag: st.beam2 ? "near, side 1" : "supported"});
  // View B: the far beam's elevation (independent controls) when enabled, else the section
  const B = st.beam2 ? finElevation(farBeamState(st), {tag:"far, side 2"})
                     : finSection(st, {stiff});
  return {A, B};
};
