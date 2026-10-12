# Workiva AI for Sustainability — explainer

React + three.js build of the Claude Design prototype
`project/Workiva AI for Sustainability.dc.html` (customer-facing edition).

```sh
npm install
npm run dev      # local dev server
npm run build    # -> dist/index.html, a single self-contained file
```

`dist/index.html` inlines all JS, CSS, the logo and the grain texture, so it can
be published as one artifact. Only the Figtree web font loads from Google Fonts.

## Layout

- `src/content.js` — all copy (edit text here)
- `src/sections/` — one file per chapter, plus intro and closing
- `src/three/` — the three.js scenes ported from `wk-three.js`
  (`Field` background drift, `HeroObject` chapter objects, `Layers` clickable stack)
- `src/styles/tokens/` — Workiva design-system tokens, copied verbatim
- `src/styles/app.css` — layout and component styles
- `src/assets/` — DS logo (flattened to one SVG), the six DS icons used, grain texture

## Notes on fidelity

Matches the prototype's rendered output at desktop width. Two places where the
prototype's inline styles never took effect in its own runtime; this build follows
what actually rendered:

- The capability layer stack has no white card behind it, and takes the height of the list.
- The DS icons ("three places it shows up", governance checkmarks) render in the
  surrounding text color, not the per-icon accent colors.

Narrow-viewport breakpoints (≤1080px, ≤720px) are new. The prototype had none.
