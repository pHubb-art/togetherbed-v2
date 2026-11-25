# TogetherBed v2 (concept)

A proposed rebuild that lives beside the existing pages. Nothing outside this
folder is changed, so the live site (`index.html`, `compare/`) is unaffected.

## Folders

| Folder | What it holds |
| --- | --- |
| `css/` | Design tokens (colors, type, spacing), base styles, components |
| `img/` | Logo, favicon, squircle mask |
| `data/` | Content the site reads: beds, products, stores. Maps one-to-one onto CMS fields. Prices and stores are samples. |
| `index.html` | Homepage. Generated from `data/copy.json` by `npm run build`; do not edit by hand |
| `fit/` | Sleep Fit page |
| `models/` | Optimized 3D models for the first view (3.4 MB, down from the originals on Sirv) |
| `js/home/` | Homepage story: bed poses per chapter, scroll tracking, 3D scene |
| `js/fit/` | Sleep Fit logic, one small file per job |
| `js/fit-page/` | Sleep Fit screens and flow |
| `tools/` | The script that writes `index.html` from the copy |
| `tests/` | Automated checks |

## Sleep Fit logic (`js/fit/`)

| File | Job |
| --- | --- |
| `constants.js` | Every tuning number, in one place |
| `sleeper.js` | Reads height, weight and pain from a sleeper profile |
| `pressure.js` | How far each body zone sinks into the bed |
| `alignment.js` | Rates how straight the spine sits |
| `pillow.js` | Picks the pillow height |
| `recommend.js` | Recommends comfort and support for each zone |
| `quick-path.js` | Turns three quick answers into a sleeper profile |
| `bed-lines.js` | Picks the closest pre-build and the product line |

The logic is copied from the existing `index.html` without changing any number.
`tests/fit-engine.test.mjs` runs the original and the v2 logic side by side on
10,368 sleepers and fails if a single answer differs.

## Run the checks

```
cd v2
npm test
```

Needs Node 20 or newer. There is nothing to install.
