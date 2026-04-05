# ngx-param-control

An Angular 17+ library that syncs reactive form controls **and signals** with URL query parameters via Angular's Router.

## Core Behavior

- Two-way sync between `FormControl` (or `FormGroup`) values and URL query params. Changing the control updates the URL; navigating (back/forward, manual URL edits) updates the control.
- Uses `Router.navigate({ queryParams })` exclusively — no `Location` or `window.history` fallback.
- `replaceUrl` by default (no history pollution), with an opt-in for `pushState` per control.
- Default values are omitted from the URL. If a control's value matches its configured default, the corresponding query param is removed to keep URLs clean.
- Configurable debounce (default 300ms) when syncing control → URL, overridable per control. URL → control sync is immediate.

## Serialization

- Ships built-in serializers for `string`, `number`, `boolean`, and `JSON`. The user specifies one per param.
- A `ParamSerializer<T>` interface is exposed so users can provide custom serializers.

## Scope

- Supports individual `FormControl` binding to a single query param.
- Supports `FormGroup` binding, which maps each control in the group to its own query param.
- Supports individual `WritableSignal` binding to a single query param (signals API).
- Supports grouped signal binding, returning a plain record of `WritableSignal`s (signals API).

## API Surface

- `paramControl(paramName, options?)` — returns a `FormControl<T | null>` wired to the given query param.
- `paramGroup(config)` — returns a `FormGroup` with each control wired to its respective param.
- `paramSignal(paramName, options?)` — returns a `WritableSignal<T | null>` wired to the given query param.
- `paramSignalGroup(config)` — returns a plain object of `WritableSignal`s, each wired to its respective param.
- Options include: `defaultValue`, `serializer`, `debounceMs`, `pushState` (boolean).

## Constraints

- Angular 17+, standalone-first. No `NgModule` wrappers needed.
- Should work with SSR (`@angular/ssr`) — guard against `window` / `document` access.
- Clean up subscriptions on destroy (use `DestroyRef` / `takeUntilDestroyed`).

---

## Implementation Epics

| # | Epic | Status |
|---|------|--------|
| 1 | Core types: `ParamSerializer<T>`, `ParamControlOptions`, `ParamGroupConfig` | ✅ Done |
| 2 | Built-in serializers: `string`, `number`, `boolean`, `JSON` | ✅ Done |
| 3 | `paramControl()` factory — two-way sync, debounce, SSR guard | ✅ Done |
| 4 | `paramGroup()` factory | ✅ Done |
| 5 | Public API (`public-api.ts`), clean up stub files | ✅ Done |
| 6 | Unit tests for serializers, `paramControl`, `paramGroup` | ✅ Done |
| 7 | Build library and verify | ✅ Done |
| 8 | `paramSignal()` factory — two-way sync via `WritableSignal`, `toObservable`, SSR guard | ✅ Done |
| 9 | `paramSignalGroup()` factory | ✅ Done |
| 10 | Unit tests for `paramSignal`, `paramSignalGroup` | ⬜ Todo |

---

## Project Structure

```
projects/ngx-param-control/src/
  public-api.ts                   ← single entry point; re-exports everything below
  lib/
    types.ts                      ← ParamSerializer<T>, ParamControlOptions<T>,
                                     ParamGroupEntry<T>, ParamGroupConfig
    serializers.ts                ← STRING / NUMBER / BOOLEAN / JSON_SERIALIZER + SERIALIZERS map
    param-control.ts              ← paramControl() factory
    param-group.ts                ← paramGroup() factory
    param-signal.ts               ← paramSignal() factory (signals API)
    param-signal-group.ts         ← paramSignalGroup() factory (signals API)
    serializers.spec.ts           ← unit tests: serializers
    param-control.spec.ts         ← unit tests: paramControl (hydration, sync, SSR, cleanup)
    param-group.spec.ts           ← unit tests: paramGroup (structure, sync, cleanup)
    ngx-param-control.ts          ← scaffold stub (emptied; kept for CLI compatibility)
    ngx-param-control.spec.ts     ← scaffold stub (emptied; kept for CLI compatibility)

dist/ngx-param-control/          ← compiled output (ng build ngx-param-control)
```

---

## Common Commands

```bash
# Build the library
npx ng build ngx-param-control

# Type-check specs without running them (Chrome not available in sandbox)
npx tsc --noEmit --project projects/ngx-param-control/tsconfig.spec.json

# Run tests (requires Chrome / Chromium; use ChromeHeadless)
CHROME_BIN=$(which chromium) npx ng test ngx-param-control --watch=false --browsers=ChromeHeadless

# Build the demo app (src/)
npx ng build
```

> **Note on the sandbox environment:** The workspace's `node_modules` was originally installed on macOS (darwin-arm64). When running in the Linux sandbox you may see an esbuild platform mismatch error. Fix it once per session with:
> ```bash
> npm install --platform=linux --arch=arm64 @esbuild/linux-arm64
> ```
> Chrome/Chromium is also unavailable in the sandbox, so use `tsc --noEmit` for type-checking specs instead of `ng test`.

---

## Key Design Decisions

**Injection context requirement.** All four factories (`paramControl`, `paramGroup`, `paramSignal`, `paramSignalGroup`) call Angular's `inject()` internally, so they must be invoked inside an injection context — typically a component class field initializer or constructor. There is no service or `NgModule` to provide.

**URL → control uses `ActivatedRoute.queryParamMap`.** This covers both initial navigation and subsequent back/forward/external navigations. The setValue call uses `{ emitEvent: false }` to prevent the control→URL subscriber from re-triggering a navigation.

**Signal → URL uses `toObservable()`.** `paramSignal` bridges the signals world back to RxJS using `toObservable` from `@angular/core/rxjs-interop`. This allows reuse of the same `debounceTime` + `distinctUntilChanged` pipeline used by `paramControl`. The initial emission is skipped via `skip(1)` since the snapshot already reflects the URL state. Because `toObservable` relies on an effect internally, it must (and does) run in an injection context.

**URL → signal avoids redundant updates.** The `queryParamMap` subscriber compares the incoming value against the current signal value with `JSON.stringify` before calling `sig.set()`, preventing unnecessary effect re-runs in the component tree.

**Control → URL is skipped on SSR.** The factory checks `PLATFORM_ID` via `isPlatformBrowser`. On a server platform the subscription that calls `router.navigate()` is never set up, so no DOM-dependent code runs.

**Default value removes the param.** When the serialized value equals the serialized default, `null` is passed as the query param value to `Router.navigate()`, which causes Angular to drop it from the URL entirely.

**JSON equality for change detection.** Both the URL→control guard (`isSame` check) and the control→URL `distinctUntilChanged` use `JSON.stringify` comparison to handle object/array defaults gracefully without requiring reference equality.

---

## Potential Future Work

- `paramArray()` — bind a `FormArray` to a repeated query param (e.g. `?tag=a&tag=b`).
- Validators that are param-aware (e.g. clamp a numeric control to a valid range on hydration).
- `withParamControl()` provider function as an alternative to in-context factory calls (useful for deeply nested services).
- Publish to npm as `ngx-param-control`.
