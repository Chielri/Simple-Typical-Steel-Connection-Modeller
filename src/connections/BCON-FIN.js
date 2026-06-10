GEO["BCON-FIN"] = function(st){
  const A=[], B=[], cc=bconCommon(st), {sec,d,hef,concT,Lp,Bp}=cc, bolt=boltProps(), d0=holeDia();
  const la=st.bp>0?Math.max(st.bp-st.e2-(st.n2-1)*st.p2,20):Math.max(50,2*bolt.d);
  const bp=st.bp>0?st.bp:la+(st.n2-1)*st.p2+st.e2, hp=st.hp>0?st.hp:(st.n1-1)*st.p1+2*st.e1;
  const ys=boltRowsY(st.n1,st.p1), g=st.g, Lsec=Math.max(sec.h*1.0,360), Hc=Math.max(st.concH,Lp+200);
  const T=st.T;
  /* View A : elevation */
  concreteBlock(A, -concT/2, Hc/2, concT, Hc);             // concrete to the left, face at x=0
  A.push(Pr.r(-T,-Lp/2,T,Lp,"plate"));                      // embedded plate (flush, body in concrete)
  // anchors/studs into concrete
  const aty=anchorPos(Lp,Math.max(2,st.na1),st.ca,st.sa1);
  for(const y of aty) anchorLeft(A, y, 0, T, hef, d, st.anchorType);
  A.push(Pr.r(0,-hp/2,bp,hp,"plate"));                      // fin plate
  A.push(...weldRun(0,-hp/2,0,hp/2,Math.max(st.weldLeg,4),1));
  A.push(...beamElevH(g,0,Lsec,sec.h,sec.tf,"out"));
  const bg=boltGridElev(la+(st.n2-1)*st.p2/2,0,st.n1,st.n2,st.p1,st.p2,d0,"bolts"); A.push(...bg.prims);
  chainV(A,la,-(la+T+40),[hp/2].concat(ys).concat([-hp/2]).sort((p,q)=>q-p),"p1");
  dimV(A,g+Lsec,-sec.h/2,sec.h/2,34,String(Math.round(sec.h)));
  dimH(A,-Lp/2-26,-T-hef,0,-18,"hₑf="+hef,"hef");
  label(A,g+Lsec*0.5,sec.h/2+30,sec.name+"  (beam)",{anchor:"middle",weight:"bold"});
  label(A,-concT/2,Hc/2+16,(st.concType==="wall"?"RC wall":"RC column"),{anchor:"middle",weight:"bold"});
  label(A,bp+12,-hp/2-6,[plCallout(st.tp,bp,hp,st.grade),bCallout(st.n1*st.n2,st.bolt,st.boltGrade,d0),
        anchorCallout(aty.length*Math.max(1,st.na2),st.anchorSize,st.anchorType,hef)],{lh:13});
  /* View B : embedded plate face (anchor layout + fin + bolt holes) */
  B.push(Pr.r(-Bp/2,-Lp/2,Bp,Lp,"plate"));
  const axs=anchorPos(Bp,Math.max(2,st.na2),st.ca,st.sa2), ays=anchorPos(Lp,Math.max(2,st.na1),st.ca,st.sa1);
  for(const ax of axs)for(const ay of ays){ B.push(Pr.c(ax,ay,d/2,"bolt",{tag:"anchor"})); B.push(Pr.c(ax,ay,d*0.9,"hidden")); }
  // fin plate outline on face + bolt holes
  B.push(Pr.r(-st.tp/2, -hp/2, st.tp, hp, "plate"));
  for(const y of ys) B.push(Pr.c(0,y,d0/2,"hidden",{tag:"bolts"}));
  if(axs.length>1) chainH(B,-Lp/2-20,-16,axs,"sa2"); if(ays.length>1) chainV(B,-Bp/2-20,-16,ays,"sa1");
  dimH(B,Lp/2+18,-Bp/2,Bp/2,16,String(Bp),"Bp"); dimV(B,Bp/2+18,-Lp/2,Lp/2,16,String(Lp),"Lp");
  label(B,0,Lp/2+52,plCallout(T,Bp,Lp,st.grade)+"  (embedded)",{anchor:"middle",weight:"bold"});
  return {A,B};
};
