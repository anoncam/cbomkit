# CBOMkit Frontend — Vue 2.7 → Vue 3 Migration Plan

## Context

The CBOMkit frontend ships on Vue 2.7 with `@carbon/vue@2`, `@carbon/charts-vue@1`, and Vue CLI 5. All three are EOL or stale; `@carbon/vue` was never ported to Vue 3, and `@carbon/charts-vue@1` predates the current Carbon Charts release. The motivating goal is **a better visualizer UI** — richer, interactive, responsive charts — but committing to that work on top of an EOL stack would be technical debt by construction.

This branch (`vue3-migration` on the `anoncam/cbomkit` fork) migrates the frontend to a current, supported stack, then redesigns the visualizer on top of it.

## Target stack

| Concern | Current | Target |
|---|---|---|
| Framework | Vue 2.7 | **Vue 3.5+** with `<script setup>` |
| Language | JS (ES2015 via Babel) | **TypeScript 5+** |
| Build | Vue CLI 5 (Webpack 5) | **Vite 5+** |
| State | `reactive()` object in `model.js` | **Pinia** |
| Routing | None (state-flag switching) | **Vue Router 4** (browser back/forward + shareable scan URLs) |
| UI kit | `@carbon/vue@2` | **`@carbon/web-components`** (framework-agnostic, Carbon-supported) |
| Charts | `@carbon/charts-vue@1` | **`@carbon/charts`** core wrapped in thin Vue 3 components |
| Icons | `@carbon/icons-vue@10` | **`@carbon/icons`** (SVG) or `@carbon/web-components` icon component |
| Styles | SCSS + `@carbon/type` + `@carbon/themes` | **`@carbon/styles`** (current Carbon SCSS package) |
| Lint | ESLint 7 + `eslint-plugin-vue@8` | **ESLint 9 (flat config) + `eslint-plugin-vue@9` + Prettier 3** |
| Tests | None | **Vitest** + Vue Testing Library (smoke only, in later PR) |

Rationale notes:

- **Carbon Web Components over a different design system.** `@carbon/web-components` keeps the existing Carbon look-and-feel, is the IBM-supported successor to `@carbon/vue`, and works in any framework. The component prefix changes from `cv-*` to `cds-*` and the API is similar but not identical — see "Carbon component mapping" below.
- **Carbon Charts core over a swap to ECharts/D3.** `@carbon/charts` (the framework-agnostic core that `@carbon/charts-vue` wraps) is still actively maintained and Carbon-themed. We get treemap, sankey, network, and other chart types out of the box. Switching to ECharts would mean a separate design language for the visualizations — not worth the disruption for this migration. We can revisit per-chart if a Carbon Charts type proves insufficient.
- **Vue Router.** Currently the app switches views by toggling `model.showResults`. Introducing the router gives shareable URLs to scan results, real browser navigation, and clean code-splitting boundaries.
- **TypeScript.** The CBOM JSON schema and `policyCheckResult` shape are non-trivial; typing them catches a class of bugs at compile time and improves refactor safety.

## Approach: side-by-side, then swap

The migration runs in `frontend-next/` alongside the existing `frontend/`, so every PR leaves the running app intact. When `frontend-next/` reaches parity, a final PR renames it to `frontend/` and removes the legacy code.

Why side-by-side over in-place:

- Each PR is independently reviewable and demoable (`make production` keeps working from `frontend/`; new app runs locally from `frontend-next/`).
- The legacy code stays available as a behavioral reference during the port.
- Reverting is a one-PR operation.
- No "compat build" gymnastics — Vue 2 compat mode does not help us because `@carbon/vue@2` is incompatible with Vue 3 regardless of compat flags.

All migration PRs target the `vue3-migration` branch. The final cutover PR targets `main`.

## PR sequence

> Note: the original 4-PR plan was collapsed by one. PR #1 (this PR) now contains both the plan and the Vite/Vue 3 scaffold. PR #2 ports services/state. PR #3 is the visualizer redesign. PR #4 ports the home/scan flow and performs the cutover.

### PR #1 — Plan + Scaffold + design tokens + chart shell

Goal: a runnable Vue 3 + Vite + TS app at `frontend-next/` that loads Carbon styles, renders the header + footer + dark mode toggle, and shows one placeholder chart. **No feature parity yet.**

Deliverables:

1. **`frontend-next/` directory** scaffolded with:
   - `package.json` — Vue 3.5, Vite 5, TypeScript 5, Pinia 2, Vue Router 4, `@carbon/web-components`, `@carbon/charts`, `@carbon/styles`, `@carbon/icons`.
   - `vite.config.ts` — alias `@/* → src/*`, dev server on port 8002 (so it can run alongside legacy on 8001), proxy `/api` and `/v1/scan` to `http://localhost:8081`, env prefix `CBOMKIT_` (replaces `VUE_APP_`).
   - `tsconfig.json`, `tsconfig.node.json` — strict mode, Vue SFC support, path alias.
   - `index.html` at the project root (Vite convention) with env-substitution placeholders compatible with the existing nginx entrypoint pattern.
   - `eslint.config.js` (flat config) + `.prettierrc`.
2. **App shell**:
   - `src/main.ts` — bootstraps Pinia + Router, registers Carbon Web Components (custom elements are self-registering on import, no `Vue.use`).
   - `src/App.vue` — layout slot, theme class toggle.
   - `src/router/index.ts` — two initial routes: `/` (home placeholder) and `/results` (results placeholder).
   - `src/stores/app.ts` — Pinia store with `useDarkMode`, `theme` computed (`'g100' | 'white'`).
   - `src/components/layout/HeaderBar.vue` — port of `HeaderBar.vue` using `cds-header`/`cds-header-name`/`cds-header-global-action` web components and a Pinia-bound dark mode toggle.
   - `src/components/layout/FooterView.vue` — port of `FooterView.vue`.
3. **Styles**:
   - `src/styles/main.scss` importing `@carbon/styles` with the two theme classes (`make-the-carbon-theme-go-white`, `make-the-carbon-theme-go-dark`) preserved verbatim so the existing dark mode pattern carries over.
4. **Charts shell**:
   - `src/components/charts/CarbonChart.vue` — generic Vue 3 wrapper around `@carbon/charts` core that takes `:type`, `:data`, `:options` props, instantiates the chart class in `onMounted`, updates on prop change, and tears down in `onBeforeUnmount`.
   - `src/views/HomeView.vue` — renders a single placeholder donut via `CarbonChart` to prove the wrapper works end-to-end.
5. **Build + dev parity with legacy**:
   - `frontend-next/docker/Dockerfile` — Vite static build, nginx-unprivileged, same exposed port 8000 as today.
   - `frontend-next/docker/entrypoint.sh` — same sed-based runtime env-substitution mechanism, but rewritten for Vite's emitted asset filenames (still `assets/index-*.js`) and the new `CBOMKIT_*` env var names. The user-facing env vars on `docker-compose.yaml` stay the same (`VUE_APP_HTTP_API_BASE`, etc.) — entrypoint maps them to placeholders inside the built JS. This means **no docker-compose changes are required to swap apps**.
   - `frontend-next/docker/etc/nginx/conf.d/default.conf` — copied from legacy (SPA fallback).
6. **`Makefile` additions** (non-breaking):
   - `dev-frontend-next` — runs `npm run dev -- --port 8002` in `frontend-next/`.
   - `build-frontend-next-image` — builds the new image tagged `cbomkit-frontend-next:${VERSION}`.
   - The existing `frontend-*` targets and `docker-compose.yaml` are untouched.
7. **This `MIGRATION.md`** committed at `frontend/MIGRATION.md` so anyone landing on the legacy code finds the plan.

Out of scope for PR #1: porting any feature pages, charts, scan flow, results, modals, file upload, API helpers. Those land in PRs #2–#4.

### PR #2 — State, services, and types

- Port `helpers/api.js` → `src/services/api.ts` (typed fetch wrappers, error contract preserved).
- Port `helpers/scan.js` → `src/services/scan.ts` (typed WebSocket client; message-type discriminated union for `LABEL | ERROR | WARNING | DETECTION | CBOM | GITURL | BRANCH | FOLDER | SCANNED_FILE_COUNT | SCANNED_NUMBER_OF_LINES | SCANNED_DURATION | REVISION_HASH`).
- Port `helpers/cbom.js`, `compliance.js`, `compliance-local.js`, `info.js`, `general.js` → `src/lib/`.
- Migrate `model.js` → `src/stores/scan.ts`, `src/stores/cbom.ts`, `src/stores/errors.ts` (Pinia, split by responsibility). Theme state stays in `src/stores/app.ts`.
- Define TS types for the CBOM schema, policy check result, and WebSocket protocol in `src/types/`.
- Replace `app.config.js` with `src/config.ts` that composes URLs from `CBOMKIT_*` env vars.
- Copy `crypto-dictionary.json` into `src/data/` for the term-info helpers.
- Router gains real routes in PR #3 alongside the visualizer port; for now just the two existing placeholder routes remain.
- No UI rewrite yet — the legacy app still owns the user-facing experience.

### PR #3 — Visualizer redesign *(the actual goal)*

This is where the chart UX improves. Built on the scaffolded `CarbonChart` wrapper:

- Replace `StatisticsView.vue`'s four fixed-height charts with a responsive grid; container-driven sizing via `ResizeObserver`.
- KPI strip at the top: quantum-vulnerable count, asset count, top primitive, top function.
- Drill-down: clicking a donut slice filters the asset DataTable below; clicking a circle-pack node opens the asset detail modal.
- Add one new chart: stacked-bar of compliance-by-asset-family, or treemap of primitives → algorithms (decision in PR description).
- Enable Carbon Charts' toolbar (zoom, export PNG/CSV).
- Dark-mode color refinement using Carbon's `g100` chart theme.
- Empty and loading states for every chart (currently the donuts render blank on empty data).
- Port `ResultsView.vue`, `ResultTitle.vue`, `RegulatorResults.vue`, `DataTable.vue`, `ComplianceIcon.vue`, `LoaderView.vue`, `ReturnButton.vue` and the four modal subcomponents.

### PR #4 — Home/scan/upload pages, tests, then cutover

- Port `HomeView.vue`, `SearchOrUploadView.vue`, `SearchBar.vue`, `FileUploader.vue`, `ListTable.vue`, `ExplainerView.vue`, `PluginExplainerView.vue`, `TrySampleButton.vue`, `NotificationsView.vue`, `DebugView.vue`.
- Wire the redesigned visualizer to the live scan flow.
- Add Vitest smoke tests for: API helpers, scan WebSocket message parsing, chart wrapper lifecycle.
- **Cutover step**:
  - `git mv frontend frontend-legacy` then `git mv frontend-next frontend`.
  - Update `Makefile` targets and `frontend/docker/Dockerfile` references.
  - Delete `frontend-legacy/` in the same PR (kept in git history).
- Merge `vue3-migration` → `main`.

## Carbon component mapping (PR #2–#4 reference)

| `@carbon/vue@2` (cv-*) | `@carbon/web-components` (cds-*) | Notes |
|---|---|---|
| `cv-button` (×34) | `cds-button` | `kind` prop renamed values in some cases; verify per use. |
| `cv-data-table` + row/cell/skeleton (×24) | `cds-table` + `cds-table-row`/`cds-table-cell`/`cds-table-skeleton` | Slot-based composition is different; expect non-trivial refactor of `DataTable.vue`. |
| `cv-tile` (×10) | `cds-tile` | Drop-in. |
| `cv-loading` (×9) | `cds-loading` | Drop-in. |
| `cv-structured-list*` (×24 across variants) | `cds-structured-list*` | Drop-in. |
| `cv-text-input` (×7) | `cds-text-input` | Validate `v-model` → `value` + `@input` pattern (web components don't speak `v-model` directly; we'll use a small wrapper or `useVModel`). |
| `cv-link` (×5) | `cds-link` | Drop-in. |
| `cv-icon-button` (×5) | `cds-icon-button` | Drop-in. |
| `cv-tooltip` (×4) | `cds-tooltip` | API shape changed; verify per use. |
| `cv-tag` (×4) | `cds-tag` | Drop-in. |
| `cv-tabs` + `cv-tab` (×6) | `cds-tabs` + `cds-tab` | Drop-in. |
| `cv-modal` (×4) | `cds-modal` | Drop-in. |
| `cv-inline-loading` (×4) | `cds-inline-loading` | Drop-in. |
| `cv-inline-notification` (×3) | `cds-inline-notification` | Drop-in. |
| `cv-file-uploader` (×3) | `cds-file-uploader` | Drop-in. |
| `cv-toast-notification` (×2) | `cds-toast-notification` | Drop-in. |
| `cv-skeleton-text` (×2) | `cds-skeleton-text` | Drop-in. |
| `cv-radio-group` + `cv-radio-button` (×4) | `cds-radio-button-group` + `cds-radio-button` | Name change on the group. |
| `cv-header*` (×6) | `cds-header*` | Drop-in. |
| `cv-search` (×1) | `cds-search` | Drop-in. |
| `cv-checkbox` (×1) | `cds-checkbox` | Drop-in. |
| `ccv-donut-chart` (×7) | `<CarbonChart :type="'donut'" …>` | Replaced by our wrapper around `@carbon/charts` core. |

`@carbon/icons-vue` icons (18 unique) become `<svg>` imports from `@carbon/icons/lib/<name>` or `cds-icon-*` web components — chosen per usage during PR #2.

## Risk register

| Risk | Mitigation |
|---|---|
| `v-model` doesn't compose with custom elements out of the box. | Thin Vue wrapper components for inputs (`<TextInput>` → wraps `cds-text-input`, exposes Vue-native v-model). |
| `cds-table` composition diverges from `cv-data-table` slots → `DataTable.vue` (467 LOC, the largest component) gets gnarly. | Schedule it first in PR #3; consider replacing with a hand-rolled Vue 3 table component using Carbon styles if the web component composition fights us. |
| Runtime env substitution targets `app.b1473943.js`-style filenames; Vite emits hashed `assets/index-<hash>.js`. | Entrypoint script rewritten to glob `assets/*.js`; we also use unique placeholder strings (e.g. `__CBOMKIT_HTTP_API_BASE__`) that can't collide with real code. |
| Dark mode theme swap currently mutates `document.body.style` from a Vue 2 watcher. | Move to a `watchEffect` on the Pinia theme store; toggle a class on `<html>` so CSS handles all surface changes. |
| Carbon Charts core API changed between v1.11 (current) and current v1.x. | Verify each chart options object during port; keep one chart on the wrapper before porting the rest. |
| No tests exist, so behavioral regressions are easy to miss. | Add Vitest smoke tests in PR #4 (API parsing, scan socket messages, chart wrapper mount/unmount). Manual QA checklist per PR (see Verification). |
| The `make production` flow points at `ghcr.io/cbomkit/cbomkit-frontend:${VERSION}` — published images we don't control. | New image published as `cbomkit-frontend-next` until cutover; cutover PR points the existing image name at the new build. Local `make build-frontend-image` then produces the Vue 3 build. |

## Verification

End-to-end manual checks per PR:

- **PR #1**: `cd frontend-next && npm i && npm run dev` → loads at http://localhost:8002, header renders with Carbon styling, dark mode toggle flips theme, placeholder donut renders, no console errors. `make build-frontend-next-image && docker run -p 8001:8000 cbomkit-frontend-next:<VERSION>` serves the build. Legacy `make production` still works unchanged.
- **PR #2**: Unit tests pass (Vitest scaffolded). No UI changes visible — sanity check that types compile and the new services can be called from the dev console.
- **PR #3**: Drag the example CBOMs in `example/` onto the new visualizer; every chart renders with at least one data point; clicking a donut slice filters the table; KPI strip matches the donut totals; dark mode looks correct.
- **PR #4**: Full scan against `https://github.com/keycloak/keycloak` end-to-end on the new frontend; results match the legacy frontend's output; WebSocket reconnect on backend restart works; both `make production` and `make coeus` profiles work after the cutover.

## Out of scope

- Backend (Quarkus) changes.
- The OPA / external compliance path.
- Helm chart and `frontend/docker/` k8s changes beyond updating image names at cutover.
- A redesign of the scan or upload flows — they get ported faithfully; UX improvements there are a follow-up.
- Internationalization, accessibility audit beyond what Carbon Web Components give us by default.

## Files touched in PR #1

New (in `frontend-next/`):

- `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `.gitignore`, `.prettierrc`, `eslint.config.js`
- `src/main.ts`, `src/App.vue`
- `src/router/index.ts`
- `src/stores/app.ts`
- `src/components/layout/HeaderBar.vue`
- `src/components/layout/FooterView.vue`
- `src/components/charts/CarbonChart.vue`
- `src/views/HomeView.vue`, `src/views/ResultsView.vue` (placeholder)
- `src/styles/main.scss`
- `src/types/env.d.ts`, `src/types/carbon-charts.d.ts` (shims as needed)
- `docker/Dockerfile`, `docker/entrypoint.sh`, `docker/etc/nginx/conf.d/default.conf`

Modified:

- `Makefile` (additive targets only)
- `frontend/MIGRATION.md` (this file)
