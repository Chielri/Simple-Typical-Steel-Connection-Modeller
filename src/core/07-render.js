/* ---------- bounding box over primitives (mm) ---------- */
function bboxOf(prims){
  let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9; const A=(x,y)=>{if(x<mnx)mnx=x;if(y<mny)mny=y;if(x>mxx)mxx=x;if(y>mxy)mxy=y;};
  for(const p of prims){
    switch(p.t){
      case "l": A(p.a[0],p.a[1]);A(p.a[2],p.a[3]);break;
      case "r": A(p.x,p.y);A(p.x+p.w,p.y+p.h);break;
      case "c": A(p.cx-p.r,p.cy-p.r);A(p.cx+p.r,p.cy+p.r);break;
      case "p": case "h": p.pts.forEach(q=>A(q[0],q[1]));break;
      case "pa": p.segs.forEach(s=>{if(s[0]==="M"||s[0]==="L")A(s[1],s[2]);if(s[0]==="A")A(s[2],s[3]);});break;
      case "t": A(p.x,p.y);break;
      case "w": A(p.x,p.y);A(p.lx,p.ly);break;
      case "d":{ const o=p.off||0;
        if(p.dir==="h"){A(p.x1,p.y1);A(p.x2,p.y2);A(p.x1,p.y1+o);A(p.x2,p.y1+o);}
        else{A(p.x1,p.y1);A(p.x2,p.y2);A(p.x1+o,p.y1);A(p.x1+o,p.y2);} break;}
    }
  }
  if(mnx>mxx){mnx=0;mny=0;mxx=1;mxy=1;}
  return {minx:mnx,miny:mny,maxx:mxx,maxy:mxy,w:Math.max(mxx-mnx,1),h:Math.max(mxy-mny,1)};
}

function svgel(name,attrs,parent){
  const e=document.createElementNS(SVGNS,name);
  for(const k in attrs) if(attrs[k]!=null) e.setAttribute(k,attrs[k]);
  if(parent) parent.appendChild(e);
  return e;
}
function applyStyle(node,cls,o,redSet){
  const st=STY[cls]||STY.out; const red = o&&o.tag&&redSet&&redSet.has(o.tag);
  node.setAttribute("stroke", red?"var(--err)":st.s);
  node.setAttribute("stroke-width", (o&&o.w!=null?o.w:st.w));
  node.setAttribute("fill", o&&o.fill!=null?(red?"var(--err)":o.fill):st.f);
  const dash = o&&o.dash!=null?o.dash:st.dash;
  if(dash) node.setAttribute("stroke-dasharray",dash);
  node.setAttribute("vector-effect","non-scaling-stroke");
  return node;
}

/* hatch pattern defs (du space, tile-independent of transform) */
function ensureDefs(svg){
  let defs=svg.querySelector("defs"); if(defs) return defs;
  defs=svgel("defs",{},svg);
  const mk=(id,inner)=>{const p=svgel("pattern",{id,patternUnits:"userSpaceOnUse",width:inner.w,height:inner.h,patternTransform:inner.tr||""},defs);inner.draw(p);return p;};
  mk("hatchSteel",{w:7,h:7,tr:"rotate(0)",draw:p=>svgel("path",{d:"M0,7 L7,0",stroke:"var(--steel)","stroke-width":0.6},p)});
  mk("hatchConc",{w:14,h:14,draw:p=>{
     svgel("path",{d:"M0,14 L14,0 M-3,3 L3,-3 M11,17 L17,11",stroke:"var(--muted)","stroke-width":0.5},p);
     svgel("circle",{cx:4,cy:9,r:0.9,fill:"var(--muted)"},p);
     svgel("circle",{cx:10,cy:4,r:0.7,fill:"var(--muted)"},p);}});
  mk("hatchGrout",{w:9,h:9,draw:p=>{
     for(const c of [[2,2],[6,4],[3,7],[7,8],[5,1]]) svgel("circle",{cx:c[0],cy:c[1],r:0.6,fill:"var(--muted)"},p);}});
  // arrow marker not used (we draw filled triangles manually)
  return defs;
}

/* draw a dimension (chain segment) in du space; text/arrows fixed size */
function drawDim(g,p,T,redSet){
  const red = p.tag && redSet && redSet.has(p.tag);
  const col = red? "var(--err)" : "var(--dim)";
  const A=7, ext=0; // arrow length du
  const mkline=(x1,y1,x2,y2,w=0.7,dash)=>svgel("line",{x1,y1,x2,y2,stroke:col,"stroke-width":w,"stroke-dasharray":dash||null,"vector-effect":"non-scaling-stroke"},g);
  const arrow=(x,y,ax,ay)=>{ // arrowhead at (x,y) pointing along (ax,ay) unit
    const w=2.4; const bx=x-ax*A, by=y-ay*A, px=-ay, py=ax;
    svgel("polygon",{points:`${x},${y} ${bx+px*w},${by+py*w} ${bx-px*w},${by-py*w}`,fill:col,stroke:"none"},g);
  };
  if(p.dir==="h"){
    const yL=T.Y(p.y1+(p.off||0)), x1=T.X(p.x1), x2=T.X(p.x2), yb=T.Y(p.y1);
    mkline(x1,yb,x1,yL,0.5); mkline(x2,yb,x2,yL,0.5);              // extension lines
    mkline(x1,yL,x2,yL,0.7);                                       // dim line
    const dir=Math.sign(x2-x1)||1; arrow(x1,yL,-dir,0); arrow(x2,yL,dir,0);
    svgel("text",{x:(x1+x2)/2,y:yL-3,fill:col,"font-size":11,"text-anchor":"middle"},g).textContent=p.text;
  }else{
    const xL=T.X(p.x1+(p.off||0)), y1=T.Y(p.y1), y2=T.Y(p.y2), xb=T.X(p.x1);
    mkline(xb,y1,xL,y1,0.5); mkline(xb,y2,xL,y2,0.5);
    mkline(xL,y1,xL,y2,0.7);
    const dir=Math.sign(y2-y1)||1; arrow(xL,y1,0,-dir); arrow(xL,y2,0,dir);
    const ym=(y1+y2)/2; const tn=svgel("text",{x:xL-3,y:ym,fill:col,"font-size":11,"text-anchor":"middle",transform:`rotate(-90 ${xL-3} ${ym})`},g);
    tn.textContent=p.text;
  }
}

/* draw EN 22553-style weld symbol (schematic) in du space */
function drawWeld(g,p,T){
  const col="var(--weld)", x=T.X(p.x),y=T.Y(p.y), lx=T.X(p.lx)+(p._ox||0),ly=T.Y(p.ly)+(p._oy||0);
  const refLen=46, side=Math.sign(p.lx-p.x)||1;
  const ex=lx, ey=ly; // elbow
  const rx=ex+side*refLen;
  svgel("line",{x1:x,y1:y,x2:ex,y2:ey,stroke:col,"stroke-width":1,"vector-effect":"non-scaling-stroke"},g);
  svgel("line",{x1:ex,y1:ey,x2:rx,y2:ey,stroke:col,"stroke-width":1,"vector-effect":"non-scaling-stroke"},g);
  if(p.allAround) svgel("circle",{cx:ex,cy:ey,r:4.5,fill:"none",stroke:col,"stroke-width":1,"vector-effect":"non-scaling-stroke"},g); // weld-all-around flag
  const sym=ex+side*10;
  if(p.kind==="fillet"){
    svgel("polygon",{points:`${sym},${ey} ${sym+side*9},${ey} ${sym},${ey-9}`,fill:col},g); // arrow-side flag (above)
    if(p.both) svgel("polygon",{points:`${sym},${ey} ${sym+side*9},${ey} ${sym},${ey+9}`,fill:col},g);
    if(p.size) svgel("text",{x:sym-side*3,y:ey-2,fill:col,"font-size":10,"text-anchor":side>0?"end":"start"},g).textContent=p.size;
  }else{ // butt
    const lbl = p.kind==="full-pen butt"?"FPBW":"PPBW";
    svgel("path",{d:`M${sym},${ey-7} L${sym+side*7},${ey} L${sym},${ey+7}`,fill:"none",stroke:col,"stroke-width":1.2},g);
    svgel("text",{x:sym+side*11,y:ey-2,fill:col,"font-size":9,"text-anchor":side>0?"start":"end"},g).textContent=lbl;
  }
  // weld-all-around / typ note
  if(p.text) svgel("text",{x:rx+side*2,y:ey-2,fill:col,"font-size":9,"text-anchor":side>0?"start":"end"},g).textContent=p.text;
}

/* draw one primitive */
function drawPrim(g,p,T,redSet){
  switch(p.t){
    case "l":{const n=svgel("line",{x1:T.X(p.a[0]),y1:T.Y(p.a[1]),x2:T.X(p.a[2]),y2:T.Y(p.a[3])},g);applyStyle(n,p.c,p,redSet);break;}
    case "r":{const xL=Math.min(p.x,p.x+p.w),yT=Math.max(p.y,p.y+p.h);const n=svgel("rect",{x:T.X(xL),y:T.Y(yT),width:T.S(Math.abs(p.w)),height:T.S(Math.abs(p.h))},g);applyStyle(n,p.c,{tag:p.tag,fill:p.fill,dash:p.dash},redSet);break;}
    case "c":{const n=svgel("circle",{cx:T.X(p.cx),cy:T.Y(p.cy),r:T.S(p.r)},g);applyStyle(n,p.c,p,redSet);break;}
    case "p":{const pts=p.pts.map(q=>`${T.X(q[0])},${T.Y(q[1])}`).join(" ");const tag=p.close===false?"polyline":"polygon";const n=svgel(tag,{points:pts},g);applyStyle(n,p.c,p,redSet);break;}
    case "h":{const pts=p.pts.map(q=>`${T.X(q[0])},${T.Y(q[1])}`).join(" ");const id=p.kind==="concrete"?"hatchConc":p.kind==="grout"?"hatchGrout":"hatchSteel";const n=svgel("polygon",{points:pts,fill:`url(#${id})`,stroke:p.edge===false?"none":"var(--steel)","stroke-width":p.edge===false?0:1.0,"vector-effect":"non-scaling-stroke"},g);break;}
    case "pa":{let d="";for(const s of p.segs){if(s[0]==="M")d+=`M${T.X(s[1])},${T.Y(s[2])} `;else if(s[0]==="L")d+=`L${T.X(s[1])},${T.Y(s[2])} `;else if(s[0]==="A"){const r=T.S(s[1]);const sweep=s[4]?0:1;d+=`A${r},${r} 0 0 ${sweep} ${T.X(s[2])},${T.Y(s[3])} `;}else if(s[0]==="Z")d+="Z ";}const n=svgel("path",{d},g);applyStyle(n,p.c,p,redSet);break;}
    case "t":{const red=p.tag&&redSet&&redSet.has(p.tag);const X=T.X(p.x)+(p._ox||0),Y=T.Y(p.y)+(p._oy||0);const n=svgel("text",{x:X,y:Y,"font-size":p.size||11,"text-anchor":p.anchor||"middle",fill:red?"var(--err)":(p.c==="label"?"var(--ink)":STY[p.c]?STY[p.c].s:"var(--ink)"),"font-weight":p.weight||"normal"},g);if(p.dy)n.setAttribute("dy",p.dy);if(p.rot)n.setAttribute("transform",`rotate(${p.rot} ${X} ${Y})`);n.textContent=p.s;break;}
    case "d":drawDim(g,p,T,redSet);break;
    case "w":drawWeld(g,p,T);break;
  }
}

/* ---------- callout clash relaxation (du / screen space) ----------
   Free text labels and weld callouts overlap when geometry packs tight, so
   nudge them apart before drawing. Each gets a du-space offset (_ox,_oy)
   applied at draw time — anchor points and the underlying geometry never
   move (weld leaders simply stretch). Dimensions act as fixed obstacles. */
function estW(s,h,bold){ return (s?String(s).length:0)*h*(bold?0.60:0.54); }      // rough text width (px)
function bxPts(pts){ let b={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9}; for(const q of pts){ if(q[0]<b.x0)b.x0=q[0]; if(q[0]>b.x1)b.x1=q[0]; if(q[1]<b.y0)b.y0=q[1]; if(q[1]>b.y1)b.y1=q[1]; } return b; }
function bxUnion(a,b){ return b?{x0:Math.min(a.x0,b.x0),y0:Math.min(a.y0,b.y0),x1:Math.max(a.x1,b.x1),y1:Math.max(a.y1,b.y1)}:a; }
function aabbTxt(p,T){
  const ax=T.X(p.x)+(p._ox||0), ay=T.Y(p.y)+(p._oy||0), h=p.size||11, w=estW(p.s,h,p.weight==="bold");
  const lx=p.anchor==="middle"?-w/2:p.anchor==="end"?-w:0;
  let cs=[[lx,-0.80*h],[lx+w,-0.80*h],[lx+w,0.25*h],[lx,0.25*h]];
  if(p.rot){ const t=p.rot*Math.PI/180,c=Math.cos(t),s=Math.sin(t); cs=cs.map(q=>[q[0]*c-q[1]*s,q[0]*s+q[1]*c]); }
  return bxPts(cs.map(q=>[ax+q[0],ay+q[1]]));
}
function aabbWeld(p,T){   // box around the symbol + reference line + note (not the leader to the metal)
  const ex=T.X(p.lx)+(p._ox||0), ey=T.Y(p.ly)+(p._oy||0), sd=Math.sign(p.lx-p.x)||1, rx=ex+sd*46, tw=p.text?estW(p.text,9):0;
  const xs=[ex,ex+sd*12,rx,rx+sd*(tw+4)];
  return {x0:Math.min(...xs)-2,y0:ey-12,x1:Math.max(...xs)+2,y1:ey+12};
}
function aabbDim(p,T){    // box around the dimension's value text only
  if(p.dir==="h"){ const yL=T.Y(p.y1+(p.off||0)), cx=(T.X(p.x1)+T.X(p.x2))/2, w=estW(p.text,11); return {x0:cx-w/2-1,y0:yL-13,x1:cx+w/2+1,y1:yL}; }
  const xL=T.X(p.x1+(p.off||0)), cy=(T.Y(p.y1)+T.Y(p.y2))/2, w=estW(p.text,11); return {x0:xL-13,y0:cy-w/2-1,x1:xL,y1:cy+w/2+1};
}
function relaxCallouts(prims,T,W,H){
  for(const p of prims) if(p.t==="t"||p.t==="w"){ p._ox=0; p._oy=0; }       // idempotent: clear prior offsets
  const items=[], grp={};
  for(const p of prims){
    if(p.t==="t" && p.s!=null && String(p.s).trim()){                       // free label (multi-line blocks share p.grp)
      if(p.grp!=null && grp[p.grp]) grp[p.grp].prims.push(p);
      else { const it={prims:[p],kind:"t",mob:p.weight==="bold"?0.85:1,cap:78,dx:0,dy:0}; items.push(it); if(p.grp!=null) grp[p.grp]=it; }
    } else if(p.t==="w"){ items.push({prims:[p],kind:"w",mob:0.4,cap:46,dx:0,dy:0}); }   // weld callout (semi-anchored)
    else if(p.t==="d" && p.text!=null && String(p.text).trim()){ items.push({prims:[p],kind:"d",mob:0,cap:0,dx:0,dy:0}); } // dim: fixed obstacle
  }
  if(items.length<2) return;
  const boxOf=it=>{ let b=null; for(const p of it.prims) b=bxUnion(it.kind==="t"?aabbTxt(p,T):it.kind==="w"?aabbWeld(p,T):aabbDim(p,T),b); return b; };
  for(const it of items) it.box=boxOf(it);
  const PAD=3, move=(it,dx,dy)=>{ if(it.mob===0||(!dx&&!dy)) return;
    let nx=it.dx+dx, ny=it.dy+dy, m=Math.hypot(nx,ny); if(m>it.cap){ const s=it.cap/m; nx*=s; ny*=s; }
    const ax=nx-it.dx, ay=ny-it.dy; it.dx=nx; it.dy=ny; it.box={x0:it.box.x0+ax,y0:it.box.y0+ay,x1:it.box.x1+ax,y1:it.box.y1+ay}; };
  for(let k=0;k<20;k++){
    let any=false;
    for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++){
      const A=items[i], B=items[j]; if(A.mob+B.mob===0) continue;
      const ox=Math.min(A.box.x1,B.box.x1)-Math.max(A.box.x0,B.box.x0)+PAD;
      const oy=Math.min(A.box.y1,B.box.y1)-Math.max(A.box.y0,B.box.y0)+PAD;
      if(ox<=0||oy<=0) continue;                                            // not overlapping
      const adx=(A.box.x0+A.box.x1)-(B.box.x0+B.box.x1), ady=(A.box.y0+A.box.y1)-(B.box.y0+B.box.y1);
      let vx=0, vy=0; if(ox<oy){ vx=(adx<0?-1:1)*ox; } else { vy=(ady<0?-1:1)*oy; }   // separate along least penetration
      const sA=A.mob/(A.mob+B.mob);
      move(A, vx*sA, vy*sA); move(B, -vx*(1-sA), -vy*(1-sA)); any=true;
    }
    if(!any) break;
  }
  for(const it of items){ if(it.kind==="d") continue;                       // keep inside the frame, then commit
    const b=it.box; let cx=0,cy=0;
    if(b.x0<4) cx=4-b.x0; else if(b.x1>W-4) cx=W-4-b.x1;
    if(b.y0<4) cy=4-b.y0; else if(b.y1>H-4) cy=H-4-b.y1;
    for(const p of it.prims){ p._ox+=it.dx+cx; p._oy+=it.dy+cy; }
  }
}

/* render a view into an <svg>, returning the scale ratio used */
function renderView(svg, prims, unifiedScale){
  svg.innerHTML="";
  ensureDefs(svg);
  const W = svg.clientWidth || 880, H = 560;
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  const g = svgel("g",{},svg);
  if(!prims.length) return {scale:unifiedScale||1, fit:1};
  const bb=bboxOf(prims), pad=26;
  const fit=Math.min((W-2*pad)/bb.w,(H-2*pad)/bb.h);
  const scale=unifiedScale||fit;
  const offx=(W-bb.w*scale)/2 - bb.minx*scale;
  const offy=(H-bb.h*scale)/2 - bb.miny*scale;
  const T={scale, X:mm=>offx+mm*scale, Y:mm=>H-(offy+mm*scale), S:mm=>mm*scale};
  relaxCallouts(prims, T, W, H);                       // nudge overlapping labels / weld callouts apart
  // draw order: hatch, then lines/shapes, then bolts/welds, then dims, then text
  const order={h:0,r:1,p:1,pa:1,l:1,c:2,w:3,d:4,t:5};
  const sorted=prims.map((p,i)=>[p,i]).sort((a,b)=>(order[a[0].t]-order[b[0].t])|| (a[1]-b[1]));
  for(const [p] of sorted) drawPrim(g,p,T,RED);
  return {scale, fit};
}
