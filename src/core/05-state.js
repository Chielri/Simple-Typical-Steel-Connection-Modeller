/* =====================================================================
   §3  STATE — single serialisable source of truth
   ===================================================================== */
function defaultState(conn){
  conn = conn||"BB-FIN";
  const st = {conn, grade:"S355", drawScale:"auto", view:"both",
              showParamTable:false, theme:document.body.classList.contains("dark")?"dark":"light"};
  // every control gets its default so JSON is complete & round-trips
  for(const k in CONTROLS){
    const c = CONTROLS[k];
    st[k] = (c.def && typeof c.def==="object") ? JSON.parse(JSON.stringify(c.def)) : c.def;
  }
  const ovr = DEFOVR[conn]||{};
  for(const k in ovr) st[k] = ovr[k];
  return st;
}
let state = defaultState("BB-FIN");

// Is a control part of the active connection's UI?
function active(key){ return (SCHEMA[state.conn]||[]).includes(key); }

/* resolve the two member slots for the active connection.
   `st` defaults to the global state but can be a derived state (e.g. the far-beam
   side of a double-sided BB-FIN) so geometry can be computed for either beam. */
function members(st=state){
  const sec = resolveSec(st.secSec, st.secCustom);
  const prim = resolveSec(st.primSec, st.primCustom);
  return {sec, prim};
}

/* bolt + anchor resolved props (accept a derived state, default global) */
function boltProps(st=state){ return BOLTS[st.bolt]||BOLTS.M20; }
function holeDia(st=state){ const b=boltProps(st); return st.hole==="oversize"? b.d+ (b.d>=24?8:6) : b.d0; }
function anchorDia(){ return ANCHOR_D[state.anchorSize]||20; }
function hefVal(){ return state.hef>0 ? state.hef : Math.round(12*anchorDia()/5)*5; }
