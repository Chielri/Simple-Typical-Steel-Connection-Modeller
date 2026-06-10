#!/usr/bin/env node
/* =====================================================================
   verify.mjs — headless smoke test of the built single-file tool.

   The geometry functions are pure (state -> primitives, no DOM), so we can
   load the built <script> in a vm with tiny DOM stubs and actually run every
   connection's geometry + the validation engine. Catches a broken split,
   a missing connection, a load-order/TDZ slip, or a syntax error — without
   a browser or any dependency.

   Run:  node verify.mjs   (or `npm test`)
   ===================================================================== */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./steel_connection_tool.html", import.meta.url), "utf8");

const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("FAIL: no <script> block found in built HTML"); process.exit(1); }
let script = m[1];

// Minimal DOM/window stubs. readyState="loading" so init() never auto-runs
// (it registers a no-op DOMContentLoaded listener instead — keeps us in the
// pure geometry/validation paths). A test hook is appended in-scope so we can
// drive the same `state` binding the geometry functions read.
const stubEl = new Proxy({}, {
  get: (_t, k) => (k === "classList" ? { contains: () => false, toggle() {} }
    : k === "style" ? {} : typeof k === "string" ? () => stubEl : undefined),
});
const sandbox = {
  console,
  document: {
    readyState: "loading",
    body: { classList: { contains: () => false, toggle() {} } },
    documentElement: {},
    getElementById: () => stubEl,
    createElement: () => stubEl,
    createElementNS: () => stubEl,
    createDocumentFragment: () => stubEl,
    addEventListener() {},
  },
  window: { addEventListener() {} },
  getComputedStyle: () => ({ getPropertyValue: () => "" }),
};
sandbox.globalThis = sandbox;

script += `
;globalThis.__test = function () {
  const ids = Object.keys(CONN);
  const perId = {};
  for (const id of ids) {
    state = defaultState(id);                 // drive the shared state binding
    const g = GEO[state.conn](state);         // run real geometry
    const v = validate(state);                // run real validation
    perId[id] = {
      hasGeo: typeof GEO[id] === "function",
      aOk: Array.isArray(g.A) && g.A.length > 0,
      bOk: Array.isArray(g.B) && g.B.length > 0,
      errors: v.filter(x => x.level === "error").map(x => x.code),
    };
  }
  // spec §9 acceptance probes
  state = defaultState("BB-FIN");
  const cleanDefaults = validate(state).every(x => x.level !== "error");
  state = defaultState("BB-FIN"); state.p1 = 40;
  const p1Fires = validate(state).map(x => x.code).includes("E-P1MIN");
  return { ids, perId, cleanDefaults, p1Fires };
};`;

vm.createContext(sandbox);
try {
  vm.runInContext(script, sandbox, { filename: "steel_connection_tool.html#script" });
} catch (e) {
  console.error("FAIL: script threw on load:", e.message);
  process.exit(1);
}

const EXPECTED = [
  "BB-FIN", "BB-EP", "BB-W", "BC-FIN", "BC-EP", "BC-W",
  "BCON-FIN", "BCON-W", "CCON-BP", "CCON-BP-S",
];
const res = sandbox.__test();
const fails = [];

for (const id of EXPECTED) {
  const r = res.perId[id];
  if (!r) { fails.push(`${id}: not registered in CONN`); continue; }
  if (!r.hasGeo) fails.push(`${id}: no GEO[] geometry function`);
  if (!r.aOk) fails.push(`${id}: view A produced no primitives`);
  if (!r.bOk) fails.push(`${id}: view B produced no primitives`);
}
if (res.ids.length !== EXPECTED.length)
  fails.push(`expected ${EXPECTED.length} connections, found ${res.ids.length}: ${res.ids.join(",")}`);
if (!res.cleanDefaults) fails.push("BB-FIN defaults should have no validation errors");
if (!res.p1Fires) fails.push("BB-FIN with p1=40 should fire E-P1MIN");

if (fails.length) {
  console.error("FAIL:\n  " + fails.join("\n  "));
  process.exit(1);
}
console.log(
  `PASS: ${EXPECTED.length}/${EXPECTED.length} connections render ` +
    `(geometry + validation); BB-FIN defaults clean; E-P1MIN fires at p1=40.`
);
