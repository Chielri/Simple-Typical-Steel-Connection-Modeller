/* =====================================================================
   §5 / §8  Control registry — one descriptor per editable parameter.
   The UI builds inputs from this; geometry & validation read state[key].
   group: accordion section.  type: number|enum|section|bool.
   ===================================================================== */
const G = {MEM:"Members",PLATE:"Plate",BOLT:"Bolts",WELD:"Welds",ANC:"Anchors / Concrete",STIFF:"Stiffeners",GEOM:"Geometry",FAR:"Far beam (side 2)"};
const CONTROLS = {
  // ---- members ----
  secSec:{group:G.MEM,type:"section",def:"UKB533X210X92",label:"Supported member",kind:"beam"},
  primSec:{group:G.MEM,type:"section",def:"UKB610X229X125",label:"Supporting member",kind:"beam"},
  secCustom:{hidden:true,def:{h:533.1,b:209.3,tf:15.6,tw:10.1,r:12.7}},
  primCustom:{hidden:true,def:{h:612.2,b:229.0,tf:19.6,tw:11.9,r:12.7}},
  axis:{group:G.MEM,type:"enum",def:"major",opts:["major","minor"],label:"Column axis",hint:"major = to flange, minor = to web"},
  // ---- bolts ----
  bolt:{group:G.BOLT,type:"enum",def:"M20",opts:BOLT_SIZES,label:"Bolt size"},
  boltGrade:{group:G.BOLT,type:"enum",def:"8.8",opts:BOLT_GRADES,label:"Grade"},
  n1:{group:G.BOLT,type:"number",def:3,min:1,max:12,step:1,label:"Rows n₁ (vert)"},
  n2:{group:G.BOLT,type:"number",def:1,min:1,max:3,step:1,label:"Cols n₂ (horiz)"},
  p1:{group:G.BOLT,type:"number",def:70,min:20,max:400,step:5,label:"Pitch p₁ (vert c/c)"},
  p2:{group:G.BOLT,type:"number",def:70,min:20,max:400,step:5,label:"Gauge p₂ (horiz c/c)"},
  e1:{group:G.BOLT,type:"number",def:40,min:10,max:200,step:5,label:"End dist e₁ (plate)"},
  e2:{group:G.BOLT,type:"number",def:40,min:10,max:200,step:5,label:"Edge dist e₂ (plate)"},
  w:{group:G.BOLT,type:"number",def:90,min:50,max:300,step:5,label:"Cross-centres w (EP)"},
  hole:{group:G.BOLT,type:"enum",def:"standard",opts:["standard","oversize"],label:"Hole type"},
  // ---- plate ----
  tp:{group:G.PLATE,type:"number",def:10,min:6,max:25,step:1,label:"Fin plate thk tₚ"},
  hp:{group:G.PLATE,type:"number",def:0,min:0,max:2000,step:5,label:"Fin plate height hₚ",hint:"0 = auto"},
  bp:{group:G.PLATE,type:"number",def:0,min:0,max:600,step:5,label:"Fin plate width bₚ",hint:"0 = auto"},
  g:{group:G.PLATE,type:"number",def:10,min:0,max:30,step:1,label:"Gap g (end↔face)"},
  tep:{group:G.PLATE,type:"number",def:10,min:8,max:40,step:1,label:"End plate thk"},
  epMode:{group:G.PLATE,type:"enum",def:"flush",opts:["flush","extended"],label:"End plate type"},
  T:{group:G.PLATE,type:"number",def:25,min:12,max:60,step:1,label:"Base/embed plate T"},
  Bp:{group:G.PLATE,type:"number",def:0,min:0,max:1500,step:10,label:"Plate B (width)",hint:"0 = auto"},
  Lp:{group:G.PLATE,type:"number",def:0,min:0,max:1500,step:10,label:"Plate L (depth)",hint:"0 = auto"},
  grout:{group:G.PLATE,type:"number",def:30,min:0,max:75,step:5,label:"Grout thickness"},
  // ---- notch (BB) ----
  align:{group:G.GEOM,type:"enum",def:"top",opts:["top","centre","bottom"],label:"Beam alignment",hint:"top = tops flush (typical floor); centre = mid-aligned"},
  finPos:{group:G.GEOM,type:"enum",def:"between",opts:["between","outside"],label:"Fin plate position",hint:"between = secondary frames inside the supporting flanges (auto-cope); outside = extended fin plate cantilevers past the flange tip, secondary stays clear (no cope)"},
  beam2:{group:G.GEOM,type:"bool",def:false,label:"Beam on far side",hint:"adds an independent secondary beam + fin plate framing into the opposite face of the supporting web; View B becomes that beam's elevation"},
  farStiff:{group:G.GEOM,type:"bool",def:false,label:"Far-side stiffener plate",hint:"adds a stiffener / backing plate on the opposite web face, mirroring the fin plate"},
  notchMode:{group:G.GEOM,type:"enum",def:"auto",opts:["auto","none","single","double"],label:"Notch"},
  notchLen:{group:G.GEOM,type:"number",def:0,min:0,max:400,step:5,label:"Notch length",hint:"0 = auto"},
  notchDep:{group:G.GEOM,type:"number",def:0,min:0,max:300,step:5,label:"Notch depth",hint:"0 = auto"},
  // ---- far beam (side 2 of a double-sided BB-FIN; independent of the near beam) ----
  secSecB:{group:G.FAR,type:"section",def:"UKB406X178X60",label:"Far beam section",kind:"beam"},
  secCustomB:{hidden:true,def:{h:406.4,b:177.9,tf:12.8,tw:7.9,r:10.2}},
  alignB:{group:G.FAR,type:"enum",def:"top",opts:["top","centre","bottom"],label:"Far beam alignment"},
  finPosB:{group:G.FAR,type:"enum",def:"between",opts:["between","outside"],label:"Far fin plate position"},
  notchModeB:{group:G.FAR,type:"enum",def:"auto",opts:["auto","none","single","double"],label:"Far notch"},
  tpB:{group:G.FAR,type:"number",def:10,min:6,max:25,step:1,label:"Far plate thk tₚ"},
  hpB:{group:G.FAR,type:"number",def:0,min:0,max:2000,step:5,label:"Far plate height",hint:"0 = auto"},
  bpB:{group:G.FAR,type:"number",def:0,min:0,max:600,step:5,label:"Far plate width",hint:"0 = auto"},
  gB:{group:G.FAR,type:"number",def:10,min:0,max:30,step:1,label:"Far gap g"},
  boltB:{group:G.FAR,type:"enum",def:"M20",opts:BOLT_SIZES,label:"Far bolt size"},
  boltGradeB:{group:G.FAR,type:"enum",def:"8.8",opts:BOLT_GRADES,label:"Far grade"},
  n1B:{group:G.FAR,type:"number",def:3,min:1,max:12,step:1,label:"Far rows n₁"},
  n2B:{group:G.FAR,type:"number",def:1,min:1,max:3,step:1,label:"Far cols n₂"},
  p1B:{group:G.FAR,type:"number",def:70,min:20,max:400,step:5,label:"Far pitch p₁"},
  p2B:{group:G.FAR,type:"number",def:70,min:20,max:400,step:5,label:"Far gauge p₂"},
  e1B:{group:G.FAR,type:"number",def:40,min:10,max:200,step:5,label:"Far end dist e₁"},
  e2B:{group:G.FAR,type:"number",def:40,min:10,max:200,step:5,label:"Far edge dist e₂"},
  holeB:{group:G.FAR,type:"enum",def:"standard",opts:["standard","oversize"],label:"Far hole type"},
  weldTypeB:{group:G.FAR,type:"enum",def:"fillet",opts:["fillet","partial-pen butt","full-pen butt"],label:"Far weld type"},
  weldLegB:{group:G.FAR,type:"number",def:6,min:4,max:15,step:1,label:"Far fillet leg s"},
  // ---- welds ----
  weldType:{group:G.WELD,type:"enum",def:"fillet",opts:["fillet","partial-pen butt","full-pen butt"],label:"Weld type"},
  weldLeg:{group:G.WELD,type:"number",def:6,min:4,max:15,step:1,label:"Fillet leg s"},
  // ---- stiffeners ----
  ts:{group:G.STIFF,type:"number",def:10,min:6,max:25,step:1,label:"Stiffener thk tₛ"},
  stiffHeight:{group:G.STIFF,type:"number",def:0,min:0,max:1500,step:10,label:"Gusset height",hint:"0 = auto"},
  stiffLayout:{group:G.STIFF,type:"enum",def:"2",opts:["2","4"],label:"Gusset layout (sides)"},
  doubler:{group:G.STIFF,type:"bool",def:false,label:"Column web doubler"},
  doublerT:{group:G.STIFF,type:"number",def:8,min:6,max:20,step:1,label:"Doubler thk"},
  // ---- anchors / concrete ----
  anchorType:{group:G.ANC,type:"enum",def:"cast-in headed",opts:ANCHOR_TYPES,label:"Embedment type"},
  anchorSize:{group:G.ANC,type:"enum",def:"M20",opts:ANCHOR_SIZES,label:"Anchor size"},
  hef:{group:G.ANC,type:"number",def:0,min:50,max:600,step:10,label:"Embedment hₑf",hint:"0 = auto 12·d"},
  na1:{group:G.ANC,type:"number",def:2,min:1,max:6,step:1,label:"Anchor rows"},
  na2:{group:G.ANC,type:"number",def:2,min:1,max:6,step:1,label:"Anchor cols"},
  sa1:{group:G.ANC,type:"number",def:0,min:0,max:1200,step:5,label:"Anchor spacing s₁",hint:"0 = auto"},
  sa2:{group:G.ANC,type:"number",def:0,min:0,max:1200,step:5,label:"Anchor spacing s₂",hint:"0 = auto"},
  ca:{group:G.ANC,type:"number",def:50,min:20,max:300,step:5,label:"Edge dist c (plate)"},
  proj:{group:G.ANC,type:"number",def:60,min:20,max:200,step:5,label:"Projection above plate"},
  concType:{group:G.ANC,type:"enum",def:"pedestal",opts:["pedestal","wall"],label:"Concrete element"},
  concH:{group:G.ANC,type:"number",def:600,min:100,max:3000,step:50,label:"Pedestal/wall height"},
  wallT:{group:G.ANC,type:"number",def:300,min:100,max:1000,step:10,label:"Wall thickness"},
};

/* Per-connection UI: ordered list of control keys (grouped automatically). */
const SCHEMA = {
  "BB-FIN":["secSec","primSec","align","finPos","beam2","farStiff","notchMode","notchLen","notchDep","tp","hp","bp","g",
            "bolt","boltGrade","n1","n2","p1","p2","e1","e2","hole","weldType","weldLeg","ts",
            "secSecB","alignB","finPosB","notchModeB","tpB","hpB","bpB","gB",
            "boltB","boltGradeB","n1B","n2B","p1B","p2B","e1B","e2B","holeB","weldTypeB","weldLegB"],
  "BB-EP":["secSec","primSec","align","notchMode","notchLen","notchDep","tep","g",
           "bolt","boltGrade","n1","p1","e1","w","hole","weldType","weldLeg"],
  "BB-W":["secSec","primSec","align","notchMode","notchLen","notchDep","weldType","weldLeg","ts","stiffHeight"],
  "BC-FIN":["secSec","primSec","axis","tp","hp","bp","g",
            "bolt","boltGrade","n1","n2","p1","p2","e1","e2","hole","weldType","weldLeg"],
  "BC-EP":["secSec","primSec","axis","epMode","tep","g",
           "bolt","boltGrade","n1","p1","e1","w","hole","weldType","weldLeg"],
  "BC-W":["secSec","primSec","axis","weldType","weldLeg","ts","doubler","doublerT"],
  "BCON-FIN":["secSec","concType","wallT","concH","T","Bp","Lp","tp","hp","bp","g",
              "bolt","boltGrade","n1","n2","p1","p2","e1","e2","hole","weldType","weldLeg",
              "anchorType","anchorSize","hef","na1","na2","sa1","sa2","ca","proj"],
  "BCON-W":["secSec","concType","wallT","concH","T","Bp","Lp","g","weldType","weldLeg",
            "anchorType","anchorSize","hef","na1","na2","sa1","sa2","ca","proj"],
  "CCON-BP":["primSec","concType","concH","T","Bp","Lp","grout","weldType","weldLeg",
             "anchorType","anchorSize","hef","na1","na2","sa1","sa2","ca","proj"],
  "CCON-BP-S":["primSec","concType","concH","T","Bp","Lp","grout","ts","stiffLayout","stiffHeight",
               "weldType","weldLeg","anchorType","anchorSize","hef","na1","na2","sa1","sa2","ca","proj"],
};
// Connection-specific default overrides (applied on top of CONTROLS.def)
const DEFOVR = {
  "BB-EP":{tep:10,n1:4,p1:70},
  "BC-FIN":{primSec:"UKC305X305X137"},
  "BC-EP":{primSec:"UKC305X305X137",tep:15,n1:4,epMode:"extended"},
  "BC-W":{primSec:"UKC305X305X137",weldType:"full-pen butt",secSec:"UKB457X191X74"},
  "BB-W":{weldType:"fillet"},
  "BCON-FIN":{secSec:"UKB406X178X60",T:25},
  "BCON-W":{secSec:"UKB406X178X60",weldType:"full-pen butt",T:25},
  "CCON-BP":{primSec:"UKC254X254X89",T:30,Bp:0,Lp:0},
  "CCON-BP-S":{primSec:"UKC254X254X89",T:30,anchorSize:"M24",na1:2,na2:2,hef:300,grout:40,stiffLayout:"4"},
};

/* which member slots act as columns (for default picker grouping) */
function slotKind(conn, key){
  if(key==="primSec"){
    if(conn.startsWith("BC")||conn.startsWith("CCON")) return "col";
    return "beam";
  }
  if(key==="secSec") return "beam";
  return "beam";
}
