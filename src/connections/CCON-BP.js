/* ---------------- CCON-BP : column base plate ----------------------- */
GEO["CCON-BP"] = GEO["CCON-BP-S"] = function(st){
  const A=[], B=[], {prim}=members(), d=anchorDia(), hef=hefVal();
  const stiff = st.conn==="CCON-BP-S";
  const Bp = st.Bp>0 ? st.Bp : Math.round(prim.h+2*100);     // along column depth
  const Lp = st.Lp>0 ? st.Lp : Math.round(prim.b+2*100);     // along column width
  const T=st.T, grout=st.grout, colLen=Math.max(Bp*1.1,520);
  const concB=Math.max(Bp+240,Bp*1.3), concL=Math.max(Lp+240,Lp*1.3);
  const xs=anchorPos(Bp, st.na2, st.ca, st.sa2);             // across B (elevation x)
  const ysP=anchorPos(Lp, st.na1, st.ca, st.sa1);            // across L (plan y)

  /* View A : elevation */
  // column (web-face rectangle on plate)
  A.push(Pr.r(-prim.h/2,0,prim.h,colLen,"out"));
  A.push(Pr.l(-prim.h/2+prim.tf,0,-prim.h/2+prim.tf,colLen,"out",{w:0.9}));
  A.push(Pr.l(prim.h/2-prim.tf,0,prim.h/2-prim.tf,colLen,"out",{w:0.9}));
  A.push(...weldRun(-prim.h/2,0,prim.h/2,0,Math.max(st.weldLeg,6),-1));
  A.push(Pr.weld(prim.h/2-6,0,prim.h/2+70,40,{kind:st.weldType,size:st.weldLeg,both:true,text:"typ."}));
  // base plate, grout, concrete
  A.push(Pr.hatch([[-Bp/2,0],[Bp/2,0],[Bp/2,-T],[-Bp/2,-T]],"steel",{edge:false}));
  A.push(Pr.r(-Bp/2,-T,Bp,T,"plate"));
  A.push(Pr.hatch([[-Bp/2,-T],[Bp/2,-T],[Bp/2,-T-grout],[-Bp/2,-T-grout]],"grout",{edge:false}));
  A.push(Pr.poly([[-Bp/2,-T],[Bp/2,-T],[Bp/2,-T-grout],[-Bp/2,-T-grout]],"thin"));
  concreteBlock(A, 0, -T-grout, concB, st.concH);
  // gussets (elevation: triangles on column faces)
  if(stiff){ const gh=st.stiffHeight>0?st.stiffHeight:Math.min(colLen*0.5,Bp*0.6);
    for(const sgn of [-1,1]){ const fx=sgn*prim.h/2;
      A.push(Pr.poly([[fx,0],[fx+sgn*(Bp/2-prim.h/2-20),0],[fx,gh]],"plate")); }
    label(A,prim.h/2+10,0,"gusset PL "+st.ts,{anchor:"start",size:9}); }
  // anchors
  let tipInfo=null;
  for(const ax of xs) tipInfo=anchorDown(A, ax, T, grout, hef, st.proj, d, st.anchorType);
  // dims
  dimH(A,0+18,-Bp/2,Bp/2,Math.max(colLen*0.6,60),String(Bp),"Bp");
  dimV(A,-Bp/2-30,0,-T,-18,"T"+T,"T");
  dimV(A,-Bp/2-30,-T,-T-grout,-18,String(grout),"grout");
  if(xs.length) dimV(A, xs[xs.length-1]+34, -T-grout, tipInfo.tip, 24, "hₑf="+hef, "hef");
  dimV(A, xs[0]-24, st.proj, 0, -16, String(st.proj),"proj");
  if(xs.length>1) chainH(A, -T-grout-st.concH-24, -16, xs, "sa");
  // callouts
  label(A,-concB/2,-T-grout-st.concH-30, anchorCallout(st.na1*st.na2,st.anchorSize,st.anchorType,hef),{weight:"bold"});
  label(A,0,colLen+18,prim.name+"  (column)",{anchor:"middle",weight:"bold"});
  label(A,Bp/2+8,-T/2,plCallout(T,Bp,Lp,st.grade),{anchor:"start"});

  /* View B : plan (base plate + column footprint + anchor layout) */
  B.push(Pr.r(-Bp/2,-Lp/2,Bp,Lp,"plate"));
  const iC=iSectionPtsH(0,0,prim.h,prim.b,prim.tf,prim.tw);
  B.push(Pr.poly(iC,"out"));
  for(const ax of xs) for(const ay of ysP){
    B.push(Pr.c(ax,ay,d/2,"bolt",{tag:"anchor"}));
    B.push(Pr.c(ax,ay,d*0.95,"hidden"));        // washer/head footprint
    B.push(Pr.l(ax-d*0.7,ay,ax+d*0.7,ay,"bolt",{w:0.7})); B.push(Pr.l(ax,ay-d*0.7,ax,ay+d*0.7,"bolt",{w:0.7}));
  }
  if(stiff){ const sl=st.stiffLayout==="4";
    for(const sgn of [-1,1]) B.push(Pr.r(sgn*prim.h/2, -st.ts/2, sgn*(Bp/2-prim.h/2-20), st.ts,"plate"));
    if(sl) for(const sgn of [-1,1]) B.push(Pr.r(-st.ts/2, sgn*prim.b/2, st.ts, sgn*(Lp/2-prim.b/2-20),"plate"));
  }
  if(xs.length>1) chainH(B, -Lp/2-22, -16, xs, "sa2");
  if(ysP.length>1) chainV(B, -Bp/2-22, -16, ysP, "sa1");
  dimH(B, Lp/2+20, -Bp/2, Bp/2, 16, String(Bp),"Bp");
  dimV(B, Bp/2+20, -Lp/2, Lp/2, 16, String(Lp),"Lp");
  dimH(B, -Lp/2-22, -Bp/2, xs[0], -34, String(st.ca),"c");
  label(B,0,Lp/2+58,plCallout(T,Bp,Lp,st.grade),{anchor:"middle",weight:"bold"});
  return {A,B};
};
