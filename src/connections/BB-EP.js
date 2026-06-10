/* ---------------- BB-EP : Beam-to-beam bolted end plate ------------- */
GEO["BB-EP"] = function(st){
  const A=[], B=[], eg=epGeom(st), {sec,prim,b,hp,yc,ys,bpw,d0}=eg;
  const notch = notchAuto(st, sec, prim);
  const Lsec=Math.max(sec.h*1.0,360), tep=st.tep, g=st.g;
  const ftip=(prim.b-prim.tw)/2;

  /* View A : MAIN beam SECTION + supported beam ELEVATION (end plate edge-on) */
  const iP=iSectionPts(-prim.tw/2,0,prim.h,prim.b,prim.tf,prim.tw);
  A.push(Pr.hatch(iP,"steel",{edge:false})); A.push(Pr.poly(iP,"out"));
  label(A,-(prim.b+prim.tw)/2-6,0,prim.name+"  (main)",{anchor:"middle",rot:-90,weight:"bold"});
  // end plate edge-on, bolted to main web at x=g..g+tep, beam beyond
  A.push(Pr.r(g, yc-hp/2, tep, hp, "plate"));
  A.push(...beamElevNotched(g+tep, g+tep+Lsec, yc, sec.h, sec.tf, notch, "out"));
  for(const y of ys) A.push(Pr.l(0, y, g+tep, y, "hidden",{tag:"bolts"}));        // bolt shanks into web
  A.push(Pr.weld(g+tep, yc+sec.h/2-sec.tf, g+tep+70, yc+sec.h/2+30,{kind:st.weldType,size:st.weldLeg,both:true,text:"typ."}));
  chainV(A, g+tep, -((prim.b+prim.tw)/2+32+g+tep), [yc+hp/2].concat(ys).concat([yc-hp/2]).sort((p,q)=>q-p), "p1");
  dimV(A, g+tep+Lsec, yc-sec.h/2, yc+sec.h/2, 34, String(Math.round(sec.h)));
  label(A, g+tep+Lsec*0.5, yc+sec.h/2+30, sec.name+"  (supported)",{anchor:"middle",weight:"bold"});

  /* View B : MAIN beam ELEVATION + end plate FACE with 2 columns of bolts */
  const half=st.w/2, Lmain=Math.max(bpw+280, 440);
  B.push(...beamElevBreak(0,Lmain,0,prim.h,prim.tf,"out"));
  const iS=iSectionPts(0,yc,sec.h,sec.b,sec.tf,sec.tw); B.push(Pr.poly(iS,"hidden")); // supported beam behind plate
  B.push(Pr.r(-bpw/2, yc-hp/2, bpw, hp, "plate"));                                    // end plate face
  for(const y of ys){ for(const sx of [-half,half]){ B.push(Pr.c(sx,y,d0/2,"bolt",{tag:"bolts"}));
     B.push(Pr.l(sx-d0*0.35,y,sx+d0*0.35,y,"bolt",{w:0.8})); B.push(Pr.l(sx,y-d0*0.35,sx,y+d0*0.35,"bolt",{w:0.8})); } }
  dimH(B, yc+hp/2+20, -half, half, 16, String(st.w), "w");
  chainV(B, -bpw/2, -34, [yc+hp/2].concat(ys).concat([yc-hp/2]).sort((p,q)=>q-p), "p1");
  dimV(B, -Lmain/2-22, -prim.h/2, prim.h/2, -16, String(Math.round(prim.h)));
  label(B, 0, Math.max(yc+hp/2, prim.h/2)+40, [plCallout(tep,bpw,hp,st.grade), bCallout(2*st.n1,st.bolt,st.boltGrade,d0)],{lh:14,anchor:"middle"});
  label(B, 0, -prim.h/2-12, prim.name+"  (main)",{anchor:"middle",weight:"bold"});
  return {A,B};
};
