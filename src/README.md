# `src/` — modular source

`steel_connection_tool.html` in the repo root is **generated** from these files
by [`../build.mjs`](../build.mjs). Edit here, never the built HTML.

```bash
npm run build   # rebuild ../steel_connection_tool.html
npm test        # headless check: all 10 connections render + validation probes
```

## Edit one connection

Each file in [`connections/`](connections) is self-contained: it attaches a pure
function to the shared registry and reads only helpers from `core/`. Editing one
connection cannot affect another.

```js
// connections/BB-FIN.js
GEO["BB-FIN"] = function (st) {
  const A = [], B = [];        // primitives for the two views, in real mm
  // …use finGeom(st), members(), Pr.*, label(), dims… from core/
  return { A, B };             // arrays of drawing primitives
};
```

## Add a new connection

1. Create `connections/<ID>.js` and attach `GEO["<ID>"] = function (st) { … }`.
2. Register it for the UI in `core/`:
   - add `<ID>` to a family in `FAMILIES` and give it a `CONN["<ID>"]` entry
     (`core/02-conn-meta.js`),
   - add its control list to `SCHEMA` (and any `DEFOVR` defaults) in
     `core/04-controls.js`.
3. `npm run build && npm test`.

The build auto-discovers every `connections/*.js`, so there's no manifest to
update. Load order among connections doesn't matter — they only register
functions; the shared `GEO` object and all helpers are defined in `core/` first.

## Shared "prerequisites" (`core/`)

Numbered by load order. `08-geometry.js` ends with `const GEO = {}` (the registry
the connections attach to); everything a connection needs — section data, bolt /
anchor tables, the mm→px renderer, dimension / weld / hatch primitives, notch and
plate helpers, the validation engine — lives in `core/` and is shared, not copied.
