/* =====================================================================
   §3 / §7  Drawing engine
   Geometry fns return arrays of primitives in REAL mm coords (y-up).
   A single renderer maps mm -> drawing units (du≈px) at a uniform scale.
   ===================================================================== */
const SVGNS = "http://www.w3.org/2000/svg";
// ---- primitive constructors (short, geometry code stays terse) ----
const Pr = {
  l:(x1,y1,x2,y2,c="out",o={})=>({t:"l",a:[x1,y1,x2,y2],c,...o}),
  r:(x,y,w,h,c="plate",o={})=>({t:"r",x,y,w,h,c,...o}),
  c:(cx,cy,r,c="bolt",o={})=>({t:"c",cx,cy,r,c,...o}),
  poly:(pts,c="out",o={})=>({t:"p",pts,c,...o}),
  path:(segs,c="out",o={})=>({t:"pa",segs,c,...o}),
  hatch:(pts,kind="steel",o={})=>({t:"h",pts,kind,...o}),
  txt:(x,y,s,o={})=>({t:"t",x,y,s,size:11,anchor:"middle",c:"label",...o}),
  dim:(dir,x1,y1,x2,y2,off,text,o={})=>({t:"d",dir,x1,y1,x2,y2,off,text,...o}),
  weld:(x,y,lx,ly,o={})=>({t:"w",x,y,lx,ly,kind:"fillet",size:6,both:true,text:"",...o}),
};
// style table: stroke/width(du)/fill/dash per class
const STY = {
  out:   {s:"var(--steel)", w:1.7, f:"none"},
  plate: {s:"var(--plate)", w:1.3, f:"none"},
  bolt:  {s:"var(--bolt)",  w:1.0, f:"none"},
  weld:  {s:"var(--weld)",  w:1.0, f:"var(--weld)"},
  dim:   {s:"var(--dim)",   w:0.7, f:"var(--dim)"},
  hidden:{s:"var(--steel)", w:0.9, f:"none", dash:"6,4"},
  center:{s:"var(--dim)",   w:0.6, f:"none", dash:"9,3,2,3"},
  thin:  {s:"var(--muted)", w:0.6, f:"none"},
  fillonly:{s:"none",       w:0,   f:"none"},
  label: {s:"none",         w:0,   f:"var(--ink)"},
};

/* ---- shape helpers: return arrays of primitives in mm (y-up) ---- */
// I cross-section outline (square inner corners), centred at (cx,cy). web vertical.
function iSectionPts(cx,cy,h,b,tf,tw){
  const X=v=>cx+v, Y=v=>cy+v, hh=h/2, hb=b/2, ww=tw/2, wi=hh-tf;
  return [
    [X(-hb),Y(hh)],[X(hb),Y(hh)],[X(hb),Y(wi)],[X(ww),Y(wi)],
    [X(ww),Y(-wi)],[X(hb),Y(-wi)],[X(hb),Y(-hh)],[X(-hb),Y(-hh)],
    [X(-hb),Y(-wi)],[X(-ww),Y(-wi)],[X(-ww),Y(wi)],[X(-hb),Y(wi)],
  ];
}
// I-section, web HORIZONTAL (flanges vertical) — used when a beam axis is horizontal in plan
function iSectionPtsH(cx,cy,h,b,tf,tw){
  // rotate the vertical one 90°: swap roles
  const X=v=>cx+v, Y=v=>cy+v, hh=h/2, hb=b/2, ww=tw/2, wi=hh-tf;
  return [
    [X(hh),Y(-hb)],[X(hh),Y(hb)],[X(wi),Y(hb)],[X(wi),Y(ww)],
    [X(-wi),Y(ww)],[X(-wi),Y(hb)],[X(-hh),Y(hb)],[X(-hh),Y(-hb)],
    [X(-wi),Y(-hb)],[X(-wi),Y(-ww)],[X(wi),Y(-ww)],[X(wi),Y(-hb)],
  ];
}
// Beam in side elevation (web face to viewer): outer rect + 2 inner flange lines.
// origin = (x0,yc) left end at mid-height; runs +x by len, depth h.
function beamElevH(x0,yc,len,h,tf,cls="out"){
  const t=h/2, x1=x0+len, top=yc+t, bot=yc-t, z=Math.min(8,h*0.03), out=[];
  out.push(Pr.l(x0,top,x1,top,cls,{w:1.9}));        // top flange outer
  out.push(Pr.l(x0,bot,x1,bot,cls,{w:1.9}));        // bottom flange outer
  out.push(Pr.l(x0,top,x0,bot,cls,{w:1.9}));        // near end face
  out.push(Pr.l(x0,top-tf,x1,top-tf,cls,{w:1.2}));  // top flange inner
  out.push(Pr.l(x0,bot+tf,x1,bot+tf,cls,{w:1.2}));  // bottom flange inner
  out.push(Pr.path([["M",x1,top],["L",x1,yc+h*0.16],["L",x1-z,yc+h*0.08],
                    ["L",x1+z,yc-h*0.08],["L",x1,yc-h*0.16],["L",x1,bot]],cls,{w:1.4})); // far-end break
  return out;
}
// Beam in elevation shown as a finite SEGMENT with break (cut) lines at both ends —
// reads as a continuous UB/UC: top flange = 2 lines, bottom flange = 2 lines, broken ends.
function beamElevBreak(xc,len,yc,h,tf,cls="out"){
  const x0=xc-len/2, x1=xc+len/2, t=h/2, top=yc+t, bot=yc-t, z=Math.min(8,h*0.03), out=[];
  out.push(Pr.l(x0,top,x1,top,cls));            // top flange outer
  out.push(Pr.l(x0,top-tf,x1,top-tf,cls,{w:1.0}));// top flange inner
  out.push(Pr.l(x0,bot+tf,x1,bot+tf,cls,{w:1.0}));// bottom flange inner
  out.push(Pr.l(x0,bot,x1,bot,cls));            // bottom flange outer
  for(const xe of [x0,x1])                       // break line (zig) at each cut end
    out.push(Pr.path([["M",xe,top],["L",xe,yc+h*0.16],["L",xe-z,yc+h*0.08],
                      ["L",xe+z,yc-h*0.08],["L",xe,yc-h*0.16],["L",xe,bot]],cls,{w:1.0}));
  return out;
}
// bolt holes in elevation: grid n1(rows,vert) x n2(cols,horiz) centred at (cx,cy)
function boltGridElev(cx,cy,n1,n2,p1,p2,d0,tag){
  const out=[], cts=[]; const rr=d0/2;
  const y0 = cy + (n1-1)*p1/2, x0 = cx - (n2-1)*p2/2;
  for(let i=0;i<n1;i++)for(let j=0;j<n2;j++){
    const x=x0+j*p2, y=y0-i*p1; cts.push([x,y]);
    out.push(Pr.c(x,y,rr,"bolt",tag?{tag}:{}));
    const k=rr*0.55;
    out.push(Pr.l(x-k,y,x+k,y,"bolt",{w:0.8}));
    out.push(Pr.l(x,y-k,x,y+k,"bolt",{w:0.8}));
  }
  return {prims:out, centres:cts};
}
// bolt in side/section view passing horizontally through plies of total thickness g
// head on -x side (support) optional, nut+washer on +x. drawn to scale, simplified hex.
function boltSide(x, y, gripL, headSide, d, washer, opts={}){
  const out=[], dh=d*0.6, hw=washer*0.5, hL=d*0.8, nL=d*0.8, wL=d*0.18;
  // shank across grip
  const x0 = headSide==="left" ? x : x-gripL;
  out.push(Pr.l(x0, y-d/2, x0+gripL, y-d/2, "bolt"));
  out.push(Pr.l(x0, y+d/2, x0+gripL, y+d/2, "bolt"));
  // head end (left) & nut end (right) — place outside grip
  const headX = (headSide==="left") ? x0 : x0+gripL;
  const dir = (headSide==="left") ? -1 : 1;
  // washer
  out.push(Pr.r(headX, y-hw, dir*wL, 2*hw, "bolt"));
  // head/nut block (hex simplified as rect with chamfer lines)
  const hx = headX + dir*wL;
  out.push(Pr.r(hx, y-hw, dir*hL, 2*hw, "bolt"));
  // far end (nut) on the opposite side
  const farX = (headSide==="left") ? x0+gripL : x0;
  const fdir = -dir;
  out.push(Pr.r(farX, y-hw, fdir*wL, 2*hw, "bolt"));
  out.push(Pr.r(farX+fdir*wL, y-hw, fdir*nL, 2*hw, "bolt"));
  return out;
}
// small filled fillet-weld triangles along an edge (x1,y1)->(x2,y2), leg, side(+1/-1 normal)
function weldRun(x1,y1,x2,y2,leg,side=1,c="weld"){
  const out=[], dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy); if(L<1) return out;
  const ux=dx/L, uy=dy/L, nx=-uy*side, ny=ux*side;
  const step=Math.max(leg*1.6, L/Math.max(2,Math.round(L/(leg*1.8))));
  for(let s=0;s+leg*0.1<=L+0.1;s+=step){
    const bx=x1+ux*s, by=y1+uy*s;
    const p2=[bx+ux*leg, by+uy*leg], p3=[bx+nx*leg, by+ny*leg];
    out.push(Pr.poly([[bx,by],p2,p3],c,{close:true})); // fill from STY[c] (var(--weld))
  }
  return out;
}
