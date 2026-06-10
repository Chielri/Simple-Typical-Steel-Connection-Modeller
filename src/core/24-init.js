/* ============================== init ================================ */
function init(){
  buildDatalists(); buildTiles(); buildPanel(); bindTopbar();
  window.addEventListener("resize", debounce(()=>{ if(state.drawScale==="auto") redraw(); },120));
  redraw();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
