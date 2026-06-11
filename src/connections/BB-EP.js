/* ---------------- BB-EP : Beam-to-beam bolted end plate ------------- */
// End-plate ELEVATION (supporting SECTION + supported beam in elevation, end plate edge-on),
// parameterised by `st` so it draws either the near beam or the independent far beam.
function epElevation(st, opts){
  opts = opts||{};
  const out=[], eg=epGeom(st), {sec,prim,hp,yc,ys,bpw,d0}=eg;
  const notch = notchAuto(st, sec, prim);
  const Lsec=Math.max(sec.h*1.0,360), tep=st.tep, g=st.g, wleg=Math.max(st.weldLeg,4);
  const iP=iSectionPts(-prim.tw/2,0,prim.h,prim.b,prim.tf,prim.tw);
  out.push(Pr.hatch(iP,"steel",{edge:false})); out.push(Pr.poly(iP,"out"));
  label(out,-(prim.b+prim.tw)/2-6,0,prim.name+"  (main)",{anchor:"middle",rot:-90,weight:"bold"});
  if(opts.stiff) farStiffener(out, prim, st.ts, wleg);    // optional full-depth far-side stiffener
  // end plate edge-on, bolted to main web at x=g..g+tep, beam beyond
  out.push(Pr.r(g, yc-hp/2, tep, hp, "plate"));
  out.push(...beamElevNotched(g+tep, g+tep+Lsec, yc, sec.h, sec.tf, notch, "out"));
  for(const y of ys) out.push(Pr.l(0, y, g+tep, y, "hidden",{tag:"bolts"}));        // bolt shanks into web
  out.push(Pr.weld(g+tep, yc+sec.h/2-sec.tf, g+tep+70, yc+sec.h/2+30,{kind:st.weldType,size:st.weldLeg,both:true,text:"typ."}));
  chainV(out, g+tep, -((prim.b+prim.tw)/2+32+g+tep), [yc+hp/2].concat(ys).concat([yc-hp/2]).sort((p,q)=>q-p), "p1");
  dimV(out, g+tep+Lsec, yc-sec.h/2, yc+sec.h/2, 34, String(Math.round(sec.h)));
  label(out, g+tep+Lsec*0.5, yc+sec.h/2+30, sec.name+"  ("+(opts.tag||"supported")+")",{anchor:"middle",weight:"bold"});
  label(out, g+tep+8, yc-hp/2-8, [plCallout(tep,bpw,hp,st.grade), bCallout(2*st.n1,st.bolt,st.boltGrade,d0)],{lh:13});
  return out;
}

// End-plate FACE (View B): main beam in elevation + end plate face with two bolt columns.
function epSection(st, opts){
  opts = opts||{};
  const out=[], eg=epGeom(st), {sec,prim,hp,yc,ys,bpw,d0}=eg;
  const half=st.w/2, Lmain=Math.max(bpw+280, 440);
  out.push(...beamElevBreak(0,Lmain,0,prim.h,prim.tf,"out",{noFlange:true}));           // supporting beam (no flange inner lines beside the cut)
  if(opts.stiff) out.push(Pr.r(-st.ts, -(prim.h/2-prim.tf), st.ts, prim.h-2*prim.tf, "plate", {dash:"6,4"})); // far stiffener (hidden)
  // supported beam shown as a cut SECTION (hatched), matching BB-FIN / BB-W View B
  const iS=iSectionPts(0,yc,sec.h,sec.b,sec.tf,sec.tw);
  out.push(Pr.poly(iS,"fillonly",{fill:"var(--paper)"}));                               // white mask over the supporting beam behind
  out.push(Pr.poly(iS,"fillonly",{fill:"url(#hatchSteel)"}));                           // section hatch
  out.push(Pr.poly(iS,"out",{w:1.9}));                                                  // bold cut outline
  out.push(Pr.r(-bpw/2, yc-hp/2, bpw, hp, "plate", {fill:"var(--paper)"}));             // end plate face (opaque — clean bolt face over the beam)
  for(const y of ys){ for(const sx of [-half,half]){ out.push(Pr.c(sx,y,d0/2,"bolt",{tag:"bolts"}));
     out.push(Pr.l(sx-d0*0.35,y,sx+d0*0.35,y,"bolt",{w:0.8})); out.push(Pr.l(sx,y-d0*0.35,sx,y+d0*0.35,"bolt",{w:0.8})); } }
  dimH(out, yc+hp/2+20, -half, half, 16, String(st.w), "w");
  chainV(out, -bpw/2, -34, [yc+hp/2].concat(ys).concat([yc-hp/2]).sort((p,q)=>q-p), "p1");
  dimV(out, -Lmain/2-22, -prim.h/2, prim.h/2, -16, String(Math.round(prim.h)));
  label(out, 0, Math.max(yc+hp/2, prim.h/2)+40, [plCallout(st.tep,bpw,hp,st.grade), bCallout(2*st.n1,st.bolt,st.boltGrade,d0)],{lh:14,anchor:"middle"});
  label(out, 0, -prim.h/2-12, prim.name+"  (main)",{anchor:"middle",weight:"bold"});
  return out;
}

GEO["BB-EP"] = function(st){ return bbDoubleSided(st, epElevation, epSection); };
