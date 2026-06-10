/* ---------------- BC-W : Beam to column, welded moment -------------- */
GEO["BC-W"] = function(st){
  const A=[], B=[], {sec,prim}=members(), Lsec=Math.max(sec.h*1.0,380);
  const colLen=Math.max(sec.h*2.0,sec.h+420);
  /* View A : elevation */
  A.push(...columnElev(0,prim.h,colLen,prim.tf,0));
  label(A,-prim.h-6,0,prim.name,{anchor:"middle",rot:-90,weight:"bold"});
  A.push(...beamElevH(2,0,Lsec,sec.h,sec.tf,"out"));
  const top=sec.h/2, bot=-sec.h/2;
  A.push(Pr.weld(2,top-sec.tf/2,-prim.h-30,top+34,{kind:st.weldType,size:st.weldLeg,both:false,text:"flange FPBW"}));
  A.push(Pr.weld(2,bot+sec.tf/2,-prim.h-30,bot-34,{kind:st.weldType,size:st.weldLeg,both:false,text:"flange FPBW"}));
  A.push(Pr.weld(2,0,2+90,60,{kind:"fillet",size:st.weldLeg,both:true,text:"web"}));
  // column stiffeners opposite beam flanges (continuity plates) - shown as hidden behind flange
  for(const yy of [top-sec.tf/2,bot+sec.tf/2]) A.push(Pr.l(-prim.h+prim.tf,yy,-prim.tf,yy,"hidden"));
  dimV(A,2+Lsec,bot,top,34,String(Math.round(sec.h)));
  label(A,2+Lsec*0.5,top+30,sec.name+"  (beam)",{anchor:"middle",weight:"bold"});

  /* View B : plan */
  const iC=iSectionPtsH(-prim.h/2,0,prim.h,prim.b,prim.tf,prim.tw);
  B.push(Pr.hatch(iC,"steel",{edge:false})); B.push(Pr.poly(iC,"out"));
  // continuity stiffeners (pair) inside column aligned to beam flanges
  if(st.ts>0){
    B.push(Pr.r(-prim.h/2+prim.tf, -sec.b/2, prim.h-2*prim.tf, st.ts,"plate"));
    label(B,-prim.h/2,sec.b/2+14,"continuity PL "+st.ts,{anchor:"middle",size:9});
  }
  // doubler plate on column web
  if(st.doubler){ B.push(Pr.r(-st.doublerT-prim.tw/2,-sec.b/2*0.8,st.doublerT,sec.b*0.8,"plate"));
    label(B,-prim.h/2-14,0,"doubler "+st.doublerT,{anchor:"middle",rot:-90,size:9}); }
  B.push(Pr.r(0,-sec.b/2,Lsec,sec.b,"out"));
  B.push(Pr.l(0,-sec.tw/2,Lsec,-sec.tw/2,"out",{w:0.9})); B.push(Pr.l(0,sec.tw/2,Lsec,sec.tw/2,"out",{w:0.9}));
  B.push(Pr.weld(0,sec.b/2-2,70,sec.b/2+30,{kind:st.weldType,size:st.weldLeg,both:false,text:"FPBW"}));
  dimV(B,-prim.h-20,-prim.b/2,prim.b/2,-16,String(Math.round(prim.b)));
  label(B,Lsec*0.5,sec.b/2+18,sec.name+"  (beam)",{anchor:"middle",weight:"bold"});
  return {A,B};
};
