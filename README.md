# Parametric Steel Connection Detailing Tool

A single self-contained HTML file that renders **scaled, dimensioned 2-D details**
(elevation + section/plan) for ten typical structural-steel connections, built to
the brief in [`CONNECTION_TOOL_SPEC.md`](CONNECTION_TOOL_SPEC.md).

Design basis: SS EN 1993-1-8, SSSS *Design Guide for Buildable Steel Connections*
(Liew 2019), SCI P358/P363 conventions. **Phase 1 = geometry + detailing-rule
validation only** (no capacity checks — that boundary is stubbed for Phase 2).

## Use it

Open **`steel_connection_tool.html`** by double-clicking. No build step, no
network, no dependencies — vanilla JS + inline SVG. Works offline.

1. Pick a connection from the 10 tiles (4 families).
2. Pick member sections from the embedded 149-section UK database (or "Custom
   I-section").
3. Set plate / bolt / weld / anchor / stiffener parameters in the accordion.
4. Read the live two-view detail, the live validation panel, and export.

Top bar: Elevation / Section / Both · Param table · Export SVG · Export PNG (2×) ·
Save JSON · Load JSON · Print (1:5/1:10/1:20) · dark/light toggle.

## Connection matrix

**Beam-to-beam view convention** (per standard detailing): the primary view shows
the **main/supporting beam as a cut cross-section** with the supported beam in
**elevation** (bolts as holes); the second view is the complement — main beam in
**elevation**, supported beam cut as a cross-section (bolts in side view). A
`Beam alignment` control (top / centre / bottom) drives the framing offset and the
auto-notch (top = tops flush → coped; centre = mid-aligned, no cope if it fits).

| Family | IDs |
|---|---|
| Beam → Beam | `BB-FIN` fin plate · `BB-EP` end plate · `BB-W` direct welded |
| Beam → Column | `BC-FIN` · `BC-EP` · `BC-W` (major/minor axis) |
| Beam → Concrete | `BCON-FIN` · `BCON-W` (embedded plate + anchors/studs) |
| Column → Concrete | `CCON-BP` base plate · `CCON-BP-S` + gussets |

## Architecture (per spec §3)

- `SECTIONS` / `BOLTS` / `ANCHOR_*` — embedded data tables.
- `state` — single serialisable source of truth; `exportJSON()` round-trips through
  `importJSON()` exactly.
- `GEO[id](state)` — **pure** geometry functions returning drawing primitives in
  real **mm** coordinates (`line/rect/circle/poly/path/hatch/dim/weld/text`).
- `renderView()` — one renderer maps mm → screen at a uniform auto scale (or a
  snapped 1:5/1:10/1:20 for print), draws hatching, EN 22553-style weld symbols and
  chain dimensions, and prints the scale under each view.
- `validate()` — EC3-1-8 Table 3.3 limits, fit-up checks, and SSSS buildability
  recommendations → `{level, code, msg}`; errors render the offending entity red.
- `Capacity` — empty Phase-2 stub (`boltShear`, `plateBearing`, `weldResistance`).

## Acceptance checks (spec §9) — all verified

- UKB533×210×92 into UKB610×229×125, `BB-FIN` defaults → single notch auto
  (120 × 40), 3×M20 fits, no errors.
- `p1 = 40` with M20 → `E-P1MIN` fires, drawing still renders, offending dims red.
- UKC254×254×89 `CCON-BP-S`, 4×M24 cast-in, hₑf 300, grout 40, 4-sided gussets →
  plan shows anchor layout + gussets, elevation dimensions embedment through hatched
  concrete.
- Save JSON → Load JSON → identical state.
- Forced 1:10 print scale is labelled and physically sized.

## Out of scope (spec §10)

3D, DXF, capacity calculations, hollow sections, splices, bracing gussets, code
clause citations in the UI.
