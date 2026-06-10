/* =====================================================================
   §6.2 derived geometry helpers (shared by geometry + validation)
   ===================================================================== */
// supported-beam centroid offset relative to main-beam centroid (y=0)
function alignYc(align, prim, sec){ if(align==="centre") return 0; const d=(prim.h-sec.h)/2; return align==="bottom"? -d : d; }
function notchAuto(st, sec, prim){
  const yc = alignYc(st.align||"top", prim, sec);
  const len = st.notchLen>0 ? st.notchLen : Math.ceil((prim.b/2 - prim.tw/2 + 10)/5)*5;
  const dep = st.notchDep>0 ? st.notchDep : Math.ceil((prim.tf + prim.r + 5)/5)*5;
  const N = {len, dep};
  let mode = st.notchMode;
  if(mode==="auto"){
    const pIn = prim.h/2 - prim.tf - prim.r;            // edge of main beam clear web zone
    const topClash = (yc + sec.h/2) > pIn + 1, botClash = (yc - sec.h/2) < -pIn - 1;
    if(topClash && botClash) return {top:N, bot:N, mode:"double", len, dep};
    if(topClash) return {top:N, bot:null, mode:"single", len, dep};
    if(botClash) return {top:null, bot:N, mode:"single", len, dep};
    return {top:null, bot:null, mode:"none", len:0, dep:0};
  }
  if(mode==="none") return {top:null, bot:null, mode, len:0, dep:0};
  if(mode==="single") return {top:N, bot:null, mode, len, dep};
  return {top:N, bot:N, mode:"double", len, dep};
}
function finGeom(st){
  const {sec,prim} = members(), b = boltProps();
  const la = st.bp>0 ? Math.max(st.bp - st.e2 - (st.n2-1)*st.p2, 20) : Math.max(50, 2*b.d);
  const bp = st.bp>0 ? st.bp : la + (st.n2-1)*st.p2 + st.e2;
  const hp = st.hp>0 ? st.hp : (st.n1-1)*st.p1 + 2*st.e1;
  const yc = alignYc(st.align||"top", prim, sec);      // supported-beam framing offset
  const ys=[], y0=(st.n1-1)*st.p1/2; for(let i=0;i<st.n1;i++) ys.push(yc + y0 - i*st.p1);
  const xs=[]; for(let j=0;j<st.n2;j++) xs.push(la + j*st.p2);
  return {sec, prim, b, la, bp, hp, yc, ys, xs, d0:holeDia()};
}
function epGeom(st){
  const {sec,prim}=members(), b=boltProps();
  const hp = st.hp>0 ? st.hp : (st.n1-1)*st.p1 + 2*st.e1;
  const yc = alignYc(st.align||"top", prim, sec);
  const ys=[], y0=(st.n1-1)*st.p1/2; for(let i=0;i<st.n1;i++) ys.push(yc + y0 - i*st.p1);
  const bpw = st.w + 2*Math.max(st.e2, 1.5*b.d);       // end-plate width
  return {sec, prim, b, hp, yc, ys, bpw, d0:holeDia()};
}

/* small builder utilities (mm) */
function chainV(arr, x, off, ys, tags){
  for(let i=0;i<ys.length-1;i++)
    arr.push(Pr.dim("v", x, ys[i], x, ys[i+1], off, String(Math.round(Math.abs(ys[i+1]-ys[i]))), tags?{tag:tags}:{}));
}
function chainH(arr, y, off, xs, tags){
  for(let i=0;i<xs.length-1;i++)
    arr.push(Pr.dim("h", xs[i], y, xs[i+1], y, off, String(Math.round(Math.abs(xs[i+1]-xs[i]))), tags?{tag:tags}:{}));
}
function dimV(arr,x,y1,y2,off,text,tag){ arr.push(Pr.dim("v",x,y1,x,y2,off,text!=null?text:String(Math.round(Math.abs(y2-y1))),tag?{tag}:{})); }
function dimH(arr,y,x1,x2,off,text,tag){ arr.push(Pr.dim("h",x1,y,x2,y,off,text!=null?text:String(Math.round(Math.abs(x2-x1))),tag?{tag}:{})); }
function label(arr,x,y,lines,o={}){
  lines=[].concat(lines);
  lines.forEach((s,i)=>arr.push(Pr.txt(x,y - i*(o.lh||13)/ (o.sc||1),s,Object.assign({size:o.size||11,anchor:o.anchor||"start",c:"label",weight:o.weight||"normal",rot:o.rot||0,mm:true},o.extra))));
}
function plCallout(t,L,H,grade){ return `PL ${Math.round(t)} × ${Math.round(L)} × ${Math.round(H)}, ${grade}`; }
function bCallout(n,size,grade,d0){ return `${n} No. ${size} Gr ${grade} in ${d0} dia holes`; }

/* supported-beam side elevation with optional top/bottom copes (notch). */
function beamElevNotched(x0, x1, yc, h, tf, notch, cls="out"){
  const top=yc+h/2, bot=yc-h/2, r=10, z=Math.min(8,h*0.03), out=[];
  const tN=notch&&notch.top, bN=notch&&notch.bot, segs=[];
  segs.push(["M", x1, top]);                              // far-top (terminated by break line)
  if(tN){ segs.push(["L", x0+tN.len, top]); segs.push(["L", x0+tN.len, top-tN.dep+r]);
          segs.push(["A", r, x0+tN.len-r, top-tN.dep, false]); segs.push(["L", x0, top-tN.dep]); }
  else  { segs.push(["L", x0, top]); }
  if(bN){ segs.push(["L", x0, bot+bN.dep]); segs.push(["L", x0+bN.len-r, bot+bN.dep]);
          segs.push(["A", r, x0+bN.len, bot+bN.dep-r, false]); segs.push(["L", x0+bN.len, bot]); }
  else  { segs.push(["L", x0, bot]); }
  segs.push(["L", x1, bot]);                              // bottom edge to far end (open)
  out.push(Pr.path(segs, cls, {w:1.9}));                  // bold beam outline
  // far-end break (cut) line — shows the beam continues; makes the elevation read as a beam
  out.push(Pr.path([["M",x1,top],["L",x1,yc+h*0.16],["L",x1-z,yc+h*0.08],
                    ["L",x1+z,yc-h*0.08],["L",x1,yc-h*0.16],["L",x1,bot]],cls,{w:1.4}));
  const tfTop=top-tf, tfBot=bot+tf;                       // flange inner lines (=> 2 lines per flange)
  out.push(Pr.l(tN?x0+tN.len:x0, tfTop, x1, tfTop, cls, {w:1.2}));
  out.push(Pr.l(bN?x0+bN.len:x0, tfBot, x1, tfBot, cls, {w:1.2}));
  return out;
}

/* =====================================================================
   §3  GEOMETRY registry:  GEO[id](state) -> {A:[prims], B:[prims]}
   pure functions, real mm coords.
   ===================================================================== */

/* ---- column elevation helper (BC-*) ---- */
/* column shown in elevation: rectangle (depth × length) with flange inner lines */
function columnElev(xRight, depth, length, tf, yc, cls="out"){
  const x0=xRight-depth, out=[];
  out.push(Pr.r(x0, yc-length/2, depth, length, cls));
  out.push(Pr.l(xRight-tf, yc-length/2, xRight-tf, yc+length/2, cls,{w:0.9}));
  out.push(Pr.l(x0+tf, yc-length/2, x0+tf, yc+length/2, cls,{w:0.9}));
  out.push(Pr.l(xRight, yc-length/2, xRight, yc+length/2, cls,{w:1.8}));      // support face
  return out;
}
function boltRowsY(n1,p1){ const ys=[],y0=(n1-1)*p1/2; for(let i=0;i<n1;i++)ys.push(y0-i*p1); return ys; }

/* ---- anchors / concrete helpers (BCON-*, CCON-*) ---- */
/* ===================== Anchors / concrete (§5.5) ===================== */
function anchorCallout(n,size,type,hef){ return `${n} No. ${size} ${type}, hₑf = ${hef}`; }
// anchor positions across a span given count, edge distance, optional fixed spacing
function anchorPos(span, n, c, fixed){
  if(n<=1) return [0];
  const s = fixed>0 ? fixed : (span-2*c)/(n-1);
  const tot=s*(n-1), out=[]; for(let i=0;i<n;i++) out.push(-tot/2 + i*s); return out;
}
// vertical anchor (base plate) tip pointing down
function anchorDown(arr, x, T, grout, hef, proj, d, type){
  const cTop=-T-grout, tip=cTop-hef, r=d/2;
  arr.push(Pr.l(x-r, proj, x-r, cTop, "bolt")); arr.push(Pr.l(x+r, proj, x+r, cTop, "bolt"));
  arr.push(Pr.l(x-r, cTop, x-r, tip, "hidden")); arr.push(Pr.l(x+r, cTop, x+r, tip, "hidden"));
  // nut + washer at top of plate
  arr.push(Pr.l(x-d*0.9, 2, x+d*0.9, 2, "bolt",{w:1.0}));
  arr.push(Pr.r(x-d*0.7, 2, d*1.4, d*0.7, "bolt"));
  if(type==="cast-in headed"||type==="headed studs"){
    arr.push(Pr.r(x-d*0.95, tip, d*1.9, d*0.5, "hidden"));            // head plate
  } else if(type==="cast-in J/L-bolt"){
    arr.push(Pr.path([["M",x-r,tip+d],["L",x-r,tip+r],["A",r+ d*0.0+ r, x+r, tip+r,false],["L",x+r,tip+d]],"hidden"));
  } else if(type==="post-installed chemical"){
    arr.push(Pr.hatch([[x-d,cTop],[x+d,cTop],[x+d,tip],[x-d,tip]],"grout",{edge:false}));   // bond zone
  } else if(type==="post-installed mechanical"){
    arr.push(Pr.l(x-r,tip+d,x-d,tip,"hidden")); arr.push(Pr.l(x+r,tip+d,x+d,tip,"hidden"));   // sleeve
  }
  return {tip,cTop};
}
// horizontal anchor/stud (embedded plate) pointing -x into concrete
function anchorLeft(arr, y, faceX, T, hef, d, type){
  const back=faceX-T, tip=back-hef, r=d/2;
  arr.push(Pr.l(faceX, y-r, back, y-r, "bolt")); arr.push(Pr.l(faceX, y+r, back, y+r, "bolt"));
  arr.push(Pr.l(back, y-r, tip, y-r, "hidden")); arr.push(Pr.l(back, y+r, tip, y+r, "hidden"));
  if(type==="headed studs"||type==="cast-in headed"){ arr.push(Pr.r(tip, y-d*0.95, d*0.5*( -1), d*1.9, "hidden")); arr.push(Pr.r(tip,y-d*0.95,-d*0.5,d*1.9,"hidden")); }
  else if(type==="post-installed chemical"){ arr.push(Pr.hatch([[back,y-d],[tip,y-d],[tip,y+d],[back,y+d]],"grout",{edge:false})); }
  return tip;
}
function concreteBlock(arr, cx, topY, W, H){
  arr.push(Pr.hatch([[cx-W/2,topY],[cx+W/2,topY],[cx+W/2,topY-H],[cx-W/2,topY-H]],"concrete",{edge:false}));
  arr.push(Pr.poly([[cx-W/2,topY],[cx+W/2,topY],[cx+W/2,topY-H],[cx-W/2,topY-H]],"out",{w:1.2}));
}

/* ---- beam-to-concrete shared setup (BCON-*) ---- */
/* ---------------- BCON-FIN / BCON-W : beam to concrete -------------- */
function bconCommon(st){
  const {sec}=members(), d=anchorDia(), hef=hefVal();
  const concT = st.concType==="wall"? st.wallT : Math.max(st.wallT,400);
  const Lp = st.Lp>0 ? st.Lp : Math.round(sec.h+120);
  const Bp = st.Bp>0 ? st.Bp : Math.round(sec.b+120);
  return {sec,d,hef,concT,Lp,Bp};
}

/* =====================================================================
   GEOMETRY registry.  Each connection file attaches GEO[id] = fn(state).
   ===================================================================== */
const GEO = {};
