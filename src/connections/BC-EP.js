/* ---------------- BC-EP : Beam to column, end plate ----------------- */
GEO["BC-EP"] = function(st){
  const A=[], B=[], {sec,prim}=members(), b=boltProps(), d0=holeDia();
  const ext = st.epMode==="extended";
  const hp = st.hp>0 ? st.hp : (st.n1-1)*st.p1 + 2*st.e1 + (ext? st.p1*0.6:0);
  const ys=boltRowsY(st.n1,st.p1), g=st.g, Lsec=Math.max(sec.h*1.0,360);
  const tep=st.tep, colLen=Math.max(sec.h*1.9,sec.h+360), half=st.w/2;
  const bpw=st.w+2*Math.max(st.e2,1.5*b.d);
  const epTop = ext? sec.h/2+st.e1 : sec.h/2, epBot=-sec.h/2-( ext?0:0);
  const epH = epTop-(-(sec.h/2)); // simple: end plate roughly beam depth (+ext above)

  /* View A : elevation */
  A.push(...columnElev(0,prim.h,colLen,prim.tf,0));
  label(A,-prim.h-6,0,prim.name,{anchor:"middle",rot:-90,weight:"bold"});
  const plTop= ext? sec.h/2+st.e1 : sec.h/2, plBot=-sec.h/2;
  A.push(Pr.r(g, plBot, tep, plTop-plBot, "plate"));
  A.push(...beamElevH(g+tep,0,Lsec,sec.h,sec.tf,"out"));
  for(const y of ys) A.push(Pr.c(g+tep*0.5,y,d0/2,"hidden",{tag:"bolts"}));
  A.push(Pr.weld(g+tep, sec.h/2-sec.tf, g+tep+70, sec.h/2+30,{kind:st.weldType,size:st.weldLeg,both:true,text:"typ."}));
  chainV(A,g+tep,-(prim.h+40),[plTop].concat(ys).concat([plBot]).sort((p,q)=>q-p),"p1");
  dimV(A,g+tep+Lsec,-sec.h/2,sec.h/2,34,String(Math.round(sec.h)));
  dimV(A,g,plTop,plBot,-(prim.h+70),String(Math.round(plTop-plBot)));
  label(A,g+tep+Lsec*0.5,sec.h/2+30,sec.name+"  (beam)",{anchor:"middle",weight:"bold"});

  /* View B : plan */
  const iC=iSectionPtsH(-prim.h/2,0,prim.h,prim.b,prim.tf,prim.tw);
  B.push(Pr.hatch(iC,"steel",{edge:false})); B.push(Pr.poly(iC,"out"));
  B.push(Pr.r(0,-bpw/2,tep,bpw,"plate"));                     // end plate edge-on (plan)
  B.push(Pr.r(tep,-sec.b/2,Lsec,sec.b,"out"));                 // beam top-flange in plan
  B.push(Pr.l(tep,-sec.tw/2,tep+Lsec,-sec.tw/2,"out",{w:0.9})); B.push(Pr.l(tep,sec.tw/2,tep+Lsec,sec.tw/2,"out",{w:0.9}));
  for(const sx of [-half,half]) B.push(...boltSide(-prim.tf*0+ -10, sx, tep+prim.tf+10, "left", b.d, b.washer));
  dimV(B,-prim.h-20,-half,half,-16,String(st.w),"w");
  label(B,tep+Lsec*0.5,sec.b/2+18,sec.name+"  (beam)",{anchor:"middle",weight:"bold"});
  label(B,0,bpw/2+30,[plCallout(tep,bpw,Math.round(plTop-plBot),st.grade),bCallout(2*st.n1,st.bolt,st.boltGrade,d0)],{lh:14,anchor:"middle"});
  return {A,B};
};
