GEO["BCON-W"] = function(st){
  const A=[], B=[], cc=bconCommon(st), {sec,d,hef,concT,Lp,Bp}=cc, g=st.g, T=st.T;
  const Lsec=Math.max(sec.h*1.0,360), Hc=Math.max(st.concH,Lp+200);
  concreteBlock(A,-concT/2,Hc/2,concT,Hc);
  A.push(Pr.r(-T,-Lp/2,T,Lp,"plate"));
  const aty=anchorPos(Lp,Math.max(2,st.na1),st.ca,st.sa1);
  for(const y of aty) anchorLeft(A,y,0,T,hef,d,st.anchorType);
  A.push(...beamElevH(g,0,Lsec,sec.h,sec.tf,"out"));
  // beam welded directly to plate face
  A.push(...weldRun(0,-sec.h/2,0,sec.h/2,Math.max(st.weldLeg,5),1));
  A.push(Pr.weld(0,sec.h/2-sec.tf,0+80,sec.h/2+30,{kind:st.weldType,size:st.weldLeg,both:false,text:"FPBW"}));
  dimV(A,g+Lsec,-sec.h/2,sec.h/2,34,String(Math.round(sec.h)));
  dimH(A,-Lp/2-26,-T-hef,0,-18,"hₑf="+hef,"hef");
  label(A,g+Lsec*0.5,sec.h/2+30,sec.name+"  (beam, welded)",{anchor:"middle",weight:"bold"});
  label(A,-concT/2,Hc/2+16,(st.concType==="wall"?"RC wall":"RC column"),{anchor:"middle",weight:"bold"});
  /* View B : plate face */
  B.push(Pr.r(-Bp/2,-Lp/2,Bp,Lp,"plate"));
  const axs=anchorPos(Bp,Math.max(2,st.na2),st.ca,st.sa2), ays=anchorPos(Lp,Math.max(2,st.na1),st.ca,st.sa1);
  for(const ax of axs)for(const ay of ays){ B.push(Pr.c(ax,ay,d/2,"bolt",{tag:"anchor"})); B.push(Pr.c(ax,ay,d*0.9,"hidden")); }
  // beam footprint (I) on plate
  B.push(Pr.poly(iSectionPts(0,0,sec.h,sec.b,sec.tf,sec.tw),"out"));
  if(axs.length>1) chainH(B,-Lp/2-20,-16,axs,"sa2"); if(ays.length>1) chainV(B,-Bp/2-20,-16,ays,"sa1");
  dimH(B,Lp/2+18,-Bp/2,Bp/2,16,String(Bp),"Bp"); dimV(B,Bp/2+18,-Lp/2,Lp/2,16,String(Lp),"Lp");
  label(B,0,Lp/2+52,plCallout(T,Bp,Lp,st.grade)+"  (embedded)",{anchor:"middle",weight:"bold"});
  return {A,B};
};
