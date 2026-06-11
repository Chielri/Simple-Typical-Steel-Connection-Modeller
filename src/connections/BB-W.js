/* ---------------- BB-W : Beam-to-beam direct welded ----------------- */
// Direct-welded ELEVATION (supporting SECTION + supported beam welded in elevation),
// parameterised by `st` so it draws either the near beam or the independent far beam.
function wElevation(st, opts){
  opts = opts||{};
  const out=[], {sec,prim}=members(st);
  const notch=notchAuto(st,sec,prim), Lsec=Math.max(sec.h*1.0,360);
  const yc=alignYc(st.align||"top",prim,sec), fkind=st.weldType, top=yc+sec.h/2, bot=yc-sec.h/2;
  const ftip=(prim.b-prim.tw)/2, wleg=Math.max(st.weldLeg,4);
  const iP=iSectionPts(-prim.tw/2,0,prim.h,prim.b,prim.tf,prim.tw);
  out.push(Pr.hatch(iP,"steel",{edge:false})); out.push(Pr.poly(iP,"out"));
  label(out,-(prim.b+prim.tw)/2-6,0,prim.name+"  (main)",{anchor:"middle",rot:-90,weight:"bold"});
  if(opts.stiff) farStiffener(out, prim, st.ts, wleg);    // optional full-depth far-side stiffener
  out.push(...beamElevNotched(0, Lsec, yc, sec.h, sec.tf, notch, "out"));
  out.push(Pr.weld(0, top-sec.tf/2, ftip+40, top+34,{kind:fkind,size:st.weldLeg,both:false,text:"flange"}));
  out.push(Pr.weld(0, bot+sec.tf/2, ftip+40, bot-34,{kind:fkind,size:st.weldLeg,both:false,text:"flange"}));
  out.push(Pr.weld(0, yc, 90, yc+60,{kind:"fillet",size:st.weldLeg,both:true,text:"web"}));
  out.push(...weldRun(0,bot+sec.tf,0,top-sec.tf,wleg,1));
  dimV(out,Lsec,bot,top,34,String(Math.round(sec.h)));
  label(out,Lsec*0.5,top+30,sec.name+"  ("+(opts.tag||"welded")+")",{anchor:"middle",weight:"bold"});
  return out;
}

// Direct-welded SECTION (View B): main beam in elevation + supported beam cut + web stiffeners.
function wSection(st, opts){
  opts = opts||{};
  const out=[], {sec,prim}=members(st);
  const yc=alignYc(st.align||"top",prim,sec), fkind=st.weldType, top=yc+sec.h/2, bot=yc-sec.h/2;
  const scx=sec.tw/2, Lmain=Math.max(sec.b+320, 460);
  out.push(...beamElevBreak(scx,Lmain,0,prim.h,prim.tf,"out",{noFlange:true})); // no flange inner lines beside the cut section
  // transverse stiffeners on the main web aligned to the supported beam flanges (pair)
  if(st.ts>0){ for(const yy of [yc+sec.h/2-sec.tf/2, yc-sec.h/2+sec.tf/2])
      out.push(Pr.r(scx-Lmain*0.36, yy-st.ts/2, Lmain*0.72, st.ts, "plate"));
    label(out,scx-Lmain*0.36-6, yc, "stiff "+st.ts, {anchor:"middle",rot:-90,size:9}); }
  const iS=iSectionPts(scx,yc,sec.h,sec.b,sec.tf,sec.tw);
  out.push(Pr.poly(iS,"fillonly",{fill:"var(--paper)"}));
  out.push(Pr.poly(iS,"fillonly",{fill:"url(#hatchSteel)"}));
  out.push(Pr.poly(iS,"out",{w:1.9}));
  const wl=Math.max(st.weldLeg,4);
  out.push(...weldRun(0, bot, 0, top, wl, 1));                       // web weld
  out.push(...weldRun(scx-sec.b/2, top, scx+sec.b/2, top, wl, -1)); // top-flange weld
  out.push(...weldRun(scx-sec.b/2, bot, scx+sec.b/2, bot, wl, 1));  // bottom-flange weld
  out.push(Pr.weld(0, top-6, 70, top+30,{kind:fkind,size:st.weldLeg,both:true,allAround:true,text:"all round"}));
  dimV(out,scx+sec.b/2+30,bot,top,30,String(Math.round(sec.h)));
  dimV(out,scx-Lmain/2-22,-prim.h/2,prim.h/2,-16,String(Math.round(prim.h)));
  label(out,scx,prim.h/2+18,prim.name+"  (main)",{anchor:"middle",weight:"bold"});
  return out;
}

GEO["BB-W"] = function(st){ return bbDoubleSided(st, wElevation, wSection); };
