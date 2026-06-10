/* ---------- §2 Connection matrix metadata ----------------------------- */
const FAMILIES = [
  {key:"BB", label:"Beam → Beam", ids:["BB-FIN","BB-EP","BB-W"]},
  {key:"BC", label:"Beam → Column", ids:["BC-FIN","BC-EP","BC-W"]},
  {key:"BCON", label:"Beam → Concrete", ids:["BCON-FIN","BCON-W"]},
  {key:"CCON", label:"Column → Concrete", ids:["CCON-BP","CCON-BP-S"]},
];
const CONN = {
  "BB-FIN":{name:"Fin plate", vA:"Elevation", vB:"Section"},
  "BB-EP":{name:"Bolted end plate", vA:"Elevation", vB:"Section"},
  "BB-W":{name:"Direct welded", vA:"Elevation", vB:"Section"},
  "BC-FIN":{name:"Fin plate to column", vA:"Elevation", vB:"Plan"},
  "BC-EP":{name:"End plate to column", vA:"Elevation", vB:"Plan"},
  "BC-W":{name:"Welded moment", vA:"Elevation", vB:"Plan"},
  "BCON-FIN":{name:"Embedded plate + fin", vA:"Elevation", vB:"Plan / plate face"},
  "BCON-W":{name:"Embedded plate + welded", vA:"Elevation", vB:"Plan / plate face"},
  "CCON-BP":{name:"Base plate", vA:"Elevation", vB:"Plan"},
  "CCON-BP-S":{name:"Base plate + gussets", vA:"Elevation", vB:"Plan"},
};

/* px<->mm print convention: 1 CSS px = 1/96 inch = 0.2645833 mm on paper.
   Drawing scale ratio n (1:n) = realMM / paperMM = 1 / (pxPerMM * 0.2645833) */
const MM_PER_PX = 25.4/96; // 0.2645833
