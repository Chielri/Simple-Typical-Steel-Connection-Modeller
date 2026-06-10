/* ---------------- BC-FIN : Beam to column, fin plate ---------------- */
GEO["BC-FIN"] = function(st){
  const A=[], B=[], {sec,prim}=members(), b=boltProps(), d0=holeDia();
  const major = st.axis==="major";
  const la = st.bp>0 ? Math.max(st.bp-st.e2-(st.n2-1)*st.p2,20) : Math.max(50,2*b.d);
  const bp = st.bp>0 ? st.bp : la+(st.n2-1)*st.p2+st.e2;
  const hp = st.hp>0 ? st.hp : (st.n1-1)*st.p1+2*st.e1;
  const ys=boltRowsY(st.n1,st.p1), g=st.g, Lsec=Math.max(sec.h*1.0,360);
  const colLen=Math.max(sec.h*1.9, sec.h+360), bgx=la+(st.n2-1)*st.p2/2;

  /* View A : elevation */
  A.push(...columnElev(0, prim.h, colLen, prim.tf, 0));
  label(A,-prim.h-6,0,prim.name+(major?" (major)":" (minor)"),{anchor:"middle",rot:-90,weight:"bold"});
  A.push(Pr.r(0,-hp/2,bp,hp,"plate"));
  A.push(...beamElevH(g,0,Lsec,sec.h,sec.tf,"out"));
  const bg=boltGridElev(bgx,0,st.n1,st.n2,st.p1,st.p2,d0,"bolts"); A.push(...bg.prims);
  A.push(Pr.weld(0,hp/2-15,-prim.h-30,hp/2+40,{kind:st.weldType,size:st.weldLeg,both:true,text:"typ."}));
  A.push(...weldRun(0,-hp/2,0,hp/2,Math.max(st.weldLeg,4),1));
  chainV(A, la, -(la+prim.h+34), [hp/2].concat(ys).concat([-hp/2]).sort((p,q)=>q-p), "p1");
  dimV(A,g+Lsec,-sec.h/2,sec.h/2,34,String(Math.round(sec.h)));
  dimH(A,-sec.h/2-26,0,g,-20,String(g),"gap");
  if(st.n2>1) chainH(A,hp/2+22,18,bg.centres.slice(0,st.n2).map(c=>c[0]),"p2");
  label(A,g+Lsec*0.5,sec.h/2+30,sec.name+"  (beam)",{anchor:"middle",weight:"bold"});
  label(A,bp+12,-hp/2-6,[plCallout(st.tp,bp,hp,st.grade),bCallout(st.n1*st.n2,st.bolt,st.boltGrade,d0)],{lh:14});

  /* View B : plan (looking down) */
  if(major){
    const iC=iSectionPtsH(-prim.h/2,0,prim.h,prim.b,prim.tf,prim.tw);
    B.push(Pr.hatch(iC,"steel",{edge:false})); B.push(Pr.poly(iC,"out"));
  } else {
    const iC=iSectionPts(-prim.h/2,0,prim.h,prim.b,prim.tf,prim.tw); // web faces beam
    B.push(Pr.hatch(iC,"steel",{edge:false})); B.push(Pr.poly(iC,"out"));
  }
  // fin plate (plan: strip of thickness tp offset from beam web)
  B.push(Pr.hatch([[0,sec.tw/2],[bp,sec.tw/2],[bp,sec.tw/2+st.tp],[0,sec.tw/2+st.tp]],"steel",{edge:false}));
  B.push(Pr.r(0,sec.tw/2,bp,st.tp,"plate"));
  // beam in plan (top flange width b, web centreline)
  B.push(Pr.r(g,-sec.b/2,Lsec,sec.b,"out"));
  B.push(Pr.l(g,-sec.tw/2,g+Lsec,-sec.tw/2,"out",{w:0.9})); B.push(Pr.l(g,sec.tw/2,g+Lsec,sec.tw/2,"out",{w:0.9}));
  for(const cx of (st.n2>1?[la,la+(st.n2-1)*st.p2]:[la])) B.push(...boltSide(cx, sec.tw/2+st.tp, st.tp+sec.tw, "left", b.d, b.washer));
  B.push(...weldRun(0,sec.tw/2,bp,sec.tw/2,Math.max(st.weldLeg,4),-1));
  dimV(B,-prim.h-20,-prim.b/2,prim.b/2,-16,String(Math.round(prim.b)));
  dimH(B,-sec.b/2-22,0,g,-16,String(g),"gap");
  label(B,g+Lsec*0.5,sec.b/2+18,sec.name+"  (beam)",{anchor:"middle",weight:"bold"});
  label(B,-prim.h/2,prim.b/2+16,prim.name,{anchor:"middle",weight:"bold"});
  return {A,B};
};
