/* ---------------- BB-W : Beam-to-beam direct welded ----------------- */
GEO["BB-W"] = function(st){
  const A=[], B=[], {sec,prim}=members();
  const notch=notchAuto(st,sec,prim), Lsec=Math.max(sec.h*1.0,360);
  const yc=alignYc(st.align||"top",prim,sec), fkind=st.weldType, top=yc+sec.h/2, bot=yc-sec.h/2;
  const ftip=(prim.b-prim.tw)/2;

  /* View A : MAIN beam SECTION + supported beam ELEVATION (welded) */
  const iP=iSectionPts(-prim.tw/2,0,prim.h,prim.b,prim.tf,prim.tw);
  A.push(Pr.hatch(iP,"steel",{edge:false})); A.push(Pr.poly(iP,"out"));
  label(A,-(prim.b+prim.tw)/2-6,0,prim.name+"  (main)",{anchor:"middle",rot:-90,weight:"bold"});
  A.push(...beamElevNotched(0, Lsec, yc, sec.h, sec.tf, notch, "out"));
  A.push(Pr.weld(0, top-sec.tf/2, ftip+40, top+34,{kind:fkind,size:st.weldLeg,both:false,text:"flange"}));
  A.push(Pr.weld(0, bot+sec.tf/2, ftip+40, bot-34,{kind:fkind,size:st.weldLeg,both:false,text:"flange"}));
  A.push(Pr.weld(0, yc, 90, yc+60,{kind:"fillet",size:st.weldLeg,both:true,text:"web"}));
  A.push(...weldRun(0,bot+sec.tf,0,top-sec.tf,Math.max(st.weldLeg,4),1));
  dimV(A,Lsec,bot,top,34,String(Math.round(sec.h)));
  label(A,Lsec*0.5,top+30,sec.name+"  (welded)",{anchor:"middle",weight:"bold"});

  /* View B : MAIN beam ELEVATION + supported beam SECTION + stiffeners */
  const scx=sec.tw/2, Lmain=Math.max(sec.b+320, 460);
  B.push(...beamElevBreak(scx,Lmain,0,prim.h,prim.tf,"out"));
  // stiffeners on the main web aligned to supported beam flanges (pair)
  if(st.ts>0){ for(const yy of [yc+sec.h/2-sec.tf/2, yc-sec.h/2+sec.tf/2])
      B.push(Pr.r(scx-Lmain*0.36, yy-st.ts/2, Lmain*0.72, st.ts, "plate"));
    label(B,scx-Lmain*0.36-6, yc, "stiff "+st.ts, {anchor:"middle",rot:-90,size:9}); }
  const iS=iSectionPts(scx,yc,sec.h,sec.b,sec.tf,sec.tw);
  B.push(Pr.poly(iS,"fillonly",{fill:"var(--paper)"}));
  B.push(Pr.poly(iS,"fillonly",{fill:"url(#hatchSteel)"}));
  B.push(Pr.poly(iS,"out",{w:1.9}));
  B.push(...weldRun(0, bot, 0, top, Math.max(st.weldLeg,4),1));
  B.push(Pr.weld(0, top-6, 70, top+30,{kind:fkind,size:st.weldLeg,both:true,text:"typ."}));
  dimV(B,scx+sec.b/2+30,bot,top,30,String(Math.round(sec.h)));
  dimV(B,scx-Lmain/2-22,-prim.h/2,prim.h/2,-16,String(Math.round(prim.h)));
  label(B,scx,prim.h/2+18,prim.name+"  (main)",{anchor:"middle",weight:"bold"});
  return {A,B};
};
