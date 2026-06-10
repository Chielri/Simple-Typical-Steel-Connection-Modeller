/* ---------- §5.2 Bolt table ------------------------------------------- */
const BOLTS = {
  M12:{d:12,d0:14,washer:24,spanner:30},
  M16:{d:16,d0:18,washer:30,spanner:35},
  M20:{d:20,d0:22,washer:37,spanner:40},
  M24:{d:24,d0:26,washer:44,spanner:50},
  M30:{d:30,d0:33,washer:56,spanner:60},
};
const BOLT_SIZES = Object.keys(BOLTS);
const BOLT_GRADES = ["4.6","8.8","10.9"];

/* ---------- §5.5 Anchor sizes ----------------------------------------- */
const ANCHOR_SIZES = ["M12","M16","M20","M24","M30","M36"];
const ANCHOR_D = {M12:12,M16:16,M20:20,M24:24,M30:30,M36:36};
const ANCHOR_TYPES = [
  "cast-in headed","cast-in J/L-bolt","post-installed chemical",
  "post-installed mechanical","headed studs",
];
