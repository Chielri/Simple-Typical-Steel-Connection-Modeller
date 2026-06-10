# SPEC — Parametric Steel Connection Detailing Tool (Single-File HTML)

**Handover target:** Claude Opus (build agent)
**Author context:** Structural engineer, Singapore practice. Design basis: SS EN 1993-1-8, SSSS *Design Guide for Buildable Steel Connections* (Liew, 2019), SCI P358/P363 conventions.
**Deliverable:** ONE self-contained `.html` file. No build step, no external network requests, no frameworks. Vanilla JS + inline SVG. Must work offline from a double-click on a corporate Windows laptop.

---

## 1. Purpose

A parametric **2D detailing/drawing tool** for typical structural steel connections. The engineer picks a connection type, picks member sections from an embedded UK section database, sets connection parameters (plate thickness, bolts, welds, anchors, stiffeners), and the tool renders **scaled, dimensioned 2D details (elevation + side/plan view)** suitable for marking up, screenshotting into calc reports, or handing to a drafter.

This is a **geometry + detailing-rule tool, not a capacity calculator.** Phase 1 performs *detailing validation only* (min/max pitch, edge distances, fit-up clashes, weld access). Capacity checks (bolt shear, plate bearing, weld resistance) are Phase 2 — stub the module boundary so it can be added later without restructuring.

---

## 2. Connection Matrix (the 10 configurations)

| ID | Joint | Variant | Primary views |
|----|-------|---------|---------------|
| BB-FIN | Beam → Beam | Fin plate (incl. extended fin plate, single/double-notched secondary beam) | Elevation (looking along secondary beam axis at primary web) + Section (side view of secondary beam) |
| BB-EP | Beam → Beam | Bolted end plate (flexible/partial-depth or full-depth, bolted to primary beam web) | Elevation + Section |
| BB-W | Beam → Beam | Direct welded (secondary beam web/flanges welded to primary web, with optional stiffeners) | Elevation + Section |
| BC-FIN | Beam → Column | Fin plate to column flange (major axis) or column web (minor axis) | Elevation + Plan |
| BC-EP | Beam → Column | Bolted end plate to column flange (flush or extended) | Elevation + Plan |
| BC-W | Beam → Column | Direct welded moment connection (flanges butt-welded, web fillet-welded, optional column stiffeners/doubler) | Elevation + Plan |
| BCON-FIN | Beam → Concrete (wall/RC column) | Anchored/embedded plate on concrete face + fin plate welded to it, beam bolted to fin plate | Elevation + Plan + anchor layout on plate face |
| BCON-W | Beam → Concrete | Anchored/embedded plate + beam end welded directly (or via stub) to plate | Elevation + Plan + anchor layout |
| CCON-BP | Column → Concrete (foundation) | Anchored base plate, column **welded** to base plate, anchors cast-in or post-installed | Elevation + Plan (base plate with anchor layout) |
| CCON-BP-S | Column → Concrete | Same as CCON-BP with gusset/stiffeners between column and base plate | Elevation + Plan |

> Note on the brief: "baseplate bolted" for beam-to-beam / beam-to-column is interpreted as **bolted end plate** (the plate shop-welded to the beam end, site-bolted to the support) — this is the standard SSSS/SCI nomenclature. If a literal seated base plate at a beam joint was intended, flag it back to the user; do not build it silently.

---

## 3. Architecture

```
single .html file
├── <style>            CSS — dark/light toggle optional, print-friendly white default
├── <svg id="viewA">   Primary view (elevation)
├── <svg id="viewB">   Secondary view (section/plan)
├── <script>
│   ├── SECTIONS       embedded JSON (see §4, file uk_sections.json supplied)
│   ├── BOLTS          embedded bolt table (see §5.2)
│   ├── ANCHORS        embedded anchor table (see §5.5)
│   ├── state          single source of truth, plain object
│   ├── geometry/*.js-style functions   one per connection ID, pure: state → primitives
│   ├── render()       primitives → SVG (no direct DOM writes from geometry fns)
│   ├── validate()     detailing rules → list of {level, code, msg}
│   └── exportSVG()/exportPNG()/exportJSON()/importJSON()
```

Rules:
- Geometry functions are **pure** and return drawing primitives (`{type:'rect'|'line'|'circle'|'path'|'dim'|'weldSymbol'|'text', ...}` in **real mm coordinates**). A single renderer maps mm → screen with a computed scale. This keeps dimensions honest and makes PDF/print scale labels possible ("Scale 1:10 @ A4").
- One `redraw()` on any input change. Debounce 50 ms. No incremental DOM patching cleverness.
- State is fully serializable. `exportJSON()` must round-trip through `importJSON()` exactly.

---

## 4. Section Database

File `uk_sections.json` is supplied alongside this spec (extracted from CSI BSShapes2006, verified against SCI P363). **Embed it verbatim as a JS const.** 149 sections.

Schema (all mm unless noted):
```json
{ "name": "UKB457X191X67", "type": "UKB", "h": 453.4, "b": 189.9,
  "tf": 12.7, "tw": 8.5, "r": 10.2, "A_cm2": 85.5, "mass": 67.0 }
```
- `r` = root radius (derived as KDES − TF, spot-checked correct against P363).
- Dropdowns: group UKB (beams) and UKC (columns), sorted by serial size then mass. Beam pickers default to UKB list but allow UKC; column pickers default UKC.
- Also expose a **"Custom I-section"** entry: user types h, b, tf, tw, r directly. Everything downstream must consume only these 5 numbers, never the name.

Derived geometry used everywhere:
- Clear depth between fillets: `d = h − 2·tf − 2·r`
- Flat web zone available for fin plates / bolt rows: `d` (bolts must sit inside it)
- Notch geometry for BB connections (see §6.1).

---

## 5. Parameter Schema

### 5.1 Global
| Param | Type | Default | Range |
|---|---|---|---|
| Steel grade (members & plates) | enum S275 / S355 | S355 | display only in Phase 1 |
| Drawing scale | auto / 1:5 / 1:10 / 1:20 | auto | — |
| Units | mm fixed | mm | — |

### 5.2 Bolts (shared by all bolted variants)
Embed this table:

| Size | d (mm) | d₀ hole (mm) | Washer OD | Min spanner clearance* |
|---|---|---|---|---|
| M12 | 12 | 14 | 24 | 30 |
| M16 | 16 | 18 | 30 | 35 |
| M20 | 20 | 22 | 37 | 40 |
| M24 | 24 | 26 | 44 | 50 |
| M30 | 30 | 33 | 56 | 60 |

\* used for fit-up warnings only.

Bolt parameters per connection:
| Param | Default | Notes |
|---|---|---|
| Size | M20 | enum above |
| Grade | 8.8 | enum 4.6 / 8.8 / 10.9 (display + JSON only in Phase 1) |
| Rows `n1` (vertical) | 3 | 1–12 |
| Columns `n2` (horizontal) | 1 | 1–3 (fin plate), 2 fixed (end plate: one each side of web) |
| Pitch `p1` (vertical c/c) | 70 | user-set, validated |
| Gauge `p2` (horizontal c/c) | 70 | when n2 > 1 |
| End distance `e1` (plate, vertical to bolt) | 40 | validated |
| Edge distance `e2` (plate, horizontal) | 40 | validated |
| Beam-side end/edge distances `e1b`, `e2b` | derived + editable | distance from bolt to beam web end / notch |
| Cross-centres (end plate) `w` | 90 or 140 | typical SCI gauges |
| Hole type | standard / oversize | affects d₀ display |

### 5.3 Plates
| Param | Applies to | Default | Range |
|---|---|---|---|
| Fin plate thickness `tp` | *-FIN | 10 | 8–25 |
| Fin plate height `hp` | *-FIN | auto = (n1−1)·p1 + 2·e1 | editable, must fit beam |
| Fin plate width `bp` | *-FIN | auto = e2 + (n2−1)·p2 + gap-side projection | editable |
| Gap beam-end ↔ support face `g` | *-FIN, *-EP | 10 (fin) / 0 (EP lands on support) | 5–20 |
| End plate thickness | *-EP | 10 (flexible) / 20 (moment) | 8–40 |
| End plate height × width | *-EP | auto from bolt layout | editable |
| Base/embedded plate `T` | BCON-*, CCON-* | 25 | 12–60 |
| Base plate plan dims `B×L` | BCON-*, CCON-* | auto = section + 2×100 projection | editable |
| Grout thickness | CCON-* | 30 | 0–75, drawn hatched |
| Stiffener thickness `ts` | BB-W, BC-W, CCON-BP-S | 10 | 6–25, paired symmetric |
| Stiffener layout | CCON-BP-S | 2-sided / 4-sided gussets, height parameter | — |
| Doubler plate (column web) | BC-W | off | thickness 6–20 when on |

### 5.4 Welds
| Param | Default | Options |
|---|---|---|
| Type | fillet | fillet / partial-pen butt / full-pen butt |
| Fillet leg `s` | 6 | 4–15 mm, step 1 |
| Location/extent | both sides, full length | enum per joint: fin-plate-to-support (2-sided fillet always), flange welds (FPBW typical for BC-W), web weld, stiffener welds, column-to-baseplate perimeter |
| Weld symbol rendering | EN 22553 style | flag + reference line, leg size, "typ." notation |

Hard detailing rule: fin plate to support = **two-sided fillet, full height, leg ≥ 0.8·tp** (SSSS recommendation so the plate yields before the weld — render a warning if violated).

### 5.5 Anchors / Embedment (BCON-*, CCON-*)
| Param | Default | Options |
|---|---|---|
| Embedment type | cast-in headed | cast-in headed bolt / cast-in J/L-bolt / post-installed chemical / post-installed mechanical / headed studs (embedded plate, BCON only) |
| Anchor size | M20 | M12–M36 |
| Effective embedment `hef` | 12·d (cast-in), per-product placeholder (post-installed) | 50–600, user-set |
| Anchor count & layout | 4, rectangular | rows × cols on plate, edge distances `c1, c2`, spacing `s1, s2` |
| Projection above plate | 60 | thread + nut + washer drawn |
| Concrete outline | wall t / pedestal B×L×H | drawn with hatching, cover lines optional |

Draw anchors **through the plate into the concrete** with embedment length dimensioned; headed/hooked/adhesive-zone styling distinct per type (head plate square, J-hook curve, hatched bond zone for chemical).

---

## 6. Geometry & Detailing Rules (validation engine)

Every rule returns `{level: 'error'|'warn', code, msg}`. Errors render the offending entity red; the drawing still renders (never blank-screen on invalid input).

### 6.1 EC3-1-8 Table 3.3 detailing limits (errors)
- `e1, e2 ≥ 1.2·d0`
- `p1 ≥ 2.2·d0`, `p2 ≥ 2.4·d0`
- `e1, e2 ≤ 4t + 40` (t = thinner connected ply) — warn only
- `p1, p2 ≤ min(14t, 200)` — warn only

### 6.2 Fit-up (errors)
- Bolt group must fit in the flat web zone `d` of the supported beam (top row below root fillet, bottom row above).
- BB-FIN/BB-EP: if secondary beam top flange clashes with primary flange → auto-suggest **single notch**; if both flanges clash (secondary deeper or near-equal) → **double notch**. Notch length = primary `b/2 − tw/2 + 10` clearance, notch depth = primary `tf + r + 5` rounded up to 5 mm. Notch is parametric (user-editable) but auto-computed on section change. Draw notch radius 10 mm.
- End plate width ≤ supporting flange width (BC-EP, warn) and end plate must not foul column root fillets when on web (minor axis).
- Spanner clearance: bolt-to-adjacent-plate/flange face ≥ table §5.2 value (warn).
- Anchor edge distance vs concrete face (`c ≥ 6d` warn placeholder).

### 6.3 SSSS buildability recommendations (warnings)
- Fin plate: `tp ≤ 0.5·d` of bolt (M20 → ≤10 mm "thin plate" ductility, else warn "verify ductility per SSSS §2.1.3")
- Supported beam end gap `g ≥ 10 mm` recommended.
- Min 2 bolt rows.
- Fin plate weld `s ≥ 0.8·tp` (see §5.4).

---

## 7. Drawing Requirements

- **Two synced views** side by side (stack on narrow screens). Real-mm coordinates, uniform auto scale, scale annotation printed under each view ("1:8.4 (fit)" or snapped 1:5/1:10/1:20 when print mode toggled).
- Line weights: member outlines 1.5 px equiv, plates 1.2, bolts/welds 1.0, dims 0.5, hidden lines dashed (e.g., far-side flange, bolts in side view, embedded anchor shanks in concrete).
- Hatching: concrete = standard aggregate/triplet hatch or 45° pair convention; grout = sand stipple; steel cut sections = 45° single hatch.
- **Bolts:** elevation = circle (hole d₀) + cross-tick centre; side view = bolt shank + head + nut + washer to scale, simplified hex.
- **Welds:** EN 22553 symbols with leader to the joint line + thickened weld line/triangle fill along the welded edge in the view where the weld face shows.
- **Dimensions:** chain dims for bolt pitches (e1 | p1×(n1−1) | e1), gauge dims, plate dims, gap `g`, embedment `hef`, projection, grout, stiffener positions. Arrowheads, extension lines, text 3 mm equiv. Dimensions update live.
- Labels: section names, plate callouts ("PL 10 × 100 × 230, S355"), bolt callout ("3 No. M20 Gr 8.8 in 22 dia holes"), anchor callout ("4 No. M20 cast-in, hef = 240").
- Title strip under views: connection ID + members + date, suitable for screenshot into reports.

---

## 8. UI

- Left panel (≈340 px, scrollable): connection-type selector (10 tiles grouped into 4 families), then accordion groups: Members / Plate / Bolts / Welds / Anchors-Concrete / Stiffeners. Only show groups relevant to the active connection.
- Numeric inputs: `<input type=number>` + step buttons; section pickers searchable `<select>`/datalist.
- Validation panel pinned at bottom of left panel: errors red, warnings amber, each with rule code.
- Top bar: connection title, view toggle (Elevation / Section / Both), buttons: Export SVG, Export PNG (2×), Save JSON, Load JSON, Print (CSS print stylesheet: white bg, both views, parameter table appended).
- "Parameter summary table" toggle: renders the full state as a clean table beneath the drawing (for inclusion in calc reports).

---

## 9. Phasing for the build agent

1. **Skeleton + renderer:** state, mm→px renderer, dims/hatch/weld-symbol primitives, one connection (BB-FIN) end-to-end.
2. **Remaining bolted:** BB-EP, BC-FIN, BC-EP (reuse bolt-group + plate primitives).
3. **Welded:** BB-W, BC-W incl. stiffeners/doubler.
4. **Concrete family:** anchor primitives + concrete hatching → BCON-FIN, BCON-W, CCON-BP, CCON-BP-S.
5. **Validation engine** (§6), export/import, print stylesheet.
6. Stub `capacity.js` boundary (empty functions returning `null`) for Phase-2 EC3 checks.

Acceptance checks (run before declaring done):
- UKB533×210×92 secondary into UKB610×229×125 primary, BB-FIN defaults → single notch auto-generated, 3×M20 fits, no errors.
- Set p1 = 40 with M20 → error E-P1MIN fires, drawing still renders, offending dims red.
- UKC254×254×89 on CCON-BP-S with 4 No. M24 cast-in, hef 300, grout 40, 4 gussets → plan shows anchor layout + gussets, elevation shows embedment dim through hatched concrete.
- Save JSON → reload page → Load JSON → identical drawing.
- Print preview at forced 1:10 → dimensions text legible, scale noted.

## 10. Out of scope (do not build)
3D, DXF export, capacity calcs, hollow sections, splices, bracing gussets, moment end-plate stiffener triangles beyond simple rectangular stiffeners, code clause citations in UI.
