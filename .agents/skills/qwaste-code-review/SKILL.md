---
name: qwaste-code-review
description: Use when reviewing Qwaste v2 code — a diff, a branch, a PR, or specific files — before telling the user a change is ready to merge. Checks layering (page -> service -> NetworkService -> apiClient -> /qwaste BFF -> backend), service/type/endpoint conventions, async/error/loading handling, permission wiring, i18n, table/column rules, state ownership, and cross-file blast radius. Trigger on "review", "review code", "review giúp mình", "soát lại code", "kiểm tra PR", "code review", or before finalizing any FE change touching src/services, src/types, src/constants/endpoints.ts, src/app, or src/components.
---

# Qwaste Code Review

Review Qwaste v2 FE code against the project's actual current architecture, not generic React/Next.js habits. Lead every finding with a file reference; don't narrate the whole checklist back if nothing in a section is wrong.

## Ground truth

`docs/content/en/{clean-code,architecture,structure,page-blueprint}.mdx` are the current, verified source for conventions — they match the real code (`src/constants/endpoints.ts`, `apiClient` baseURL `/qwaste`, proxy at `src/app/qwaste/[...path]/route.ts`). If a claim here ever looks off, re-check the actual file instead of trusting memory — conventions have drifted before (a prior version of this guidance pointed at `src/services/endpoints.ts` and `/api/bff`, both wrong).

## Step 1 — Scope the review

Identify exactly what changed: `git diff` / `git status` against the target branch, or the specific files the user named. Don't review untouched code just because it's nearby — note pre-existing issues separately from issues introduced by this diff.

## Step 2 — Layer-by-layer checklist

Check only what's relevant to the files in scope.

**API flow / layering**
- Page/component never imports `axios` or calls `apiClient` directly; always goes through a `{Domain}Service`.
- No backend URL hardcoded in a component; no manual `/qwaste` prefix (that's `apiClient`'s `baseURL`).
- Backend paths live in `ENDPOINTS` (`src/constants/endpoints.ts`), not inline strings, not duplicated across services.
- Export/download endpoints use `NetworkService.requestBlob`/`requestDownload`, not a raw fetch.

**Services (`src/services/{Domain}Service.ts`)**
- Methods are `static`, named `action+Domain` (`getAllMachines`, `createMachine`, `restoreMachine`), explicit return type.
- No `try/catch` in the service unless normalizing one specific backend error shape — errors should bubble to the caller.
- No `toast`, router, modal, React hook, or Redux dispatch imported into a service file.
- Returns `response.result`/`response.message`, not the raw `ApiResponse<T>`, unless the caller explicitly needs metadata.
- New export added to `src/services/index.ts` only if something actually imports from the barrel.

**Types (`src/types/{Domain}.ts`)**
- Follows whichever pattern the domain already uses — `{Domain}` + `{Domain}FormData` (simple CRUD) or `{Domain}Response`/`{Domain}SummaryResponse`/`{Domain}CreationRequest` (complex domains). Don't introduce the other pattern into an existing domain.
- No `any` on a payload whose shape is already known.
- No domain type duplicated inside a page file.
- A type used by only one feature belongs in `features/<feature>/types/`, not `src/types/` (see `clean-code.mdx` "features/<feature>/types/ vs src/types/").

**Async, error handling, loading**
- `async/await` with `try/catch/finally`; no new `.then().catch()` chains.
- Anything that sets `loading`/`isSubmitting` to `true` clears it in `finally`, including on the error path.
- A failed create/update/delete does not close its modal/drawer.
- No empty `catch` block, no `console.log` debug output left behind.
- Every user-facing catch has a fallback i18n key (`handleError(error, { fallbackKey: '...' })`), not a bare toast string.
- Early return over nested `if` for permission/missing-id/invalid-state guards.

**Logic / control-flow correctness** — these are the bug class generic linters and typecheck miss entirely; read the actual runtime path, don't skim
- **Guard-return vs. guard-throw mismatch**: any handler called by a wrapper that decides success/failure by whether the call *threw* (e.g. `EntityFormModal.onSubmit` at `src/components/shared/FormModal/EntityFormModal.tsx` — `try { await handleFormSubmit(...); onOpenChange(false) } catch { /* stays open */ }`) must `throw`/reject on every failure branch, not `return` early. A silent `return` after a `toast.error(...)` reads as success to the wrapper — the modal closes, the form resets, and the user loses their input with no indication the action didn't happen. Grep the handler chain (`handleFormSubmit` → `handleCreateSubmit`/`handleEditSubmit`) for every early `return` and confirm each one is either unreachable (already blocked by a form-level required rule) or genuinely safe to treat as success.
- **Asymmetric sibling logic**: when create/update (or any two structurally parallel code paths — two branches of a mode switch, two tabs of the same form) enforce a business rule, check the *other* branch enforces the same one. A validation/permission/guard present in `handleCreateSubmit` but silently absent from `handleEditSubmit` for the same field is a real drift, even if currently masked by a form-level rule — don't dismiss it just because today's UI happens to prevent the bad input from reaching that branch.
- **Stale async overwrite / race**: an action (edit/view/select) that opens a modal optimistically with list-row data, then fires a detail fetch to refine it (`setModalState({ open: true, data: row }); const detail = await Service.getDetail(id); setModalState(prev => ({ ...prev, data: detail }))`) — confirm the response can't land after the user already closed the modal or switched to a different row and silently repopulate stale/wrong data. No cancellation token or "is this response still for the currently-open target" check is a red flag, not just a style nit.
- **Success feedback not actually gated on success**: a `toast.success(...)`, cache invalidation, or state transition to "done" that executes on a path that doesn't guarantee the mutation succeeded — e.g. placed before the awaited call, outside the mutation's `onSuccess`, or reachable from a branch that returns early without calling the service at all.
- **Permission/visibility flag bypassing the real check**: see `alwaysShowInMenu` under Permission below — the same shape (a flag that short-circuits a guard "for convenience") can show up elsewhere (e.g. a `skipPermissionCheck`-style prop, a hardcoded `return true` added "temporarily" during development).
- **Un-debounced or un-guarded double-submit**: a delete/create/update trigger outside `EntityFormModal` (e.g. a bare `Popconfirm` → `onConfirm={() => mutate(id)}`) that isn't disabled while its own mutation is `isPending` — rapid double-click fires it twice.
- **Sort/filter key mismatch**: a column's `dataIndex`/`key` used to build the `sort` string sent to the backend (`` `${sortField},${sortOrder}` ``) must match the backend's actual sortable field name — a column renamed on the FE without checking the backend contract silently breaks sorting instead of erroring.

**Permission**
- New CASL subject added to `caslAbility.ts` before being used in `Can`/`ability.can`.
- Route guarded in `routeAccess.ts` if it needs one; menu item added only if the route should appear in the sidebar.
- Every mutation handler checks permission at the top — a hidden/disabled button alone is not a permission check.
- Menu/visibility logic uses `ability.can`, never a hardcoded role name.
- Any new `PERMISSION_REGISTRY` entry with `alwaysShowInMenu: true` — this makes `canShow()` (`src/configs/navigation/menuItems.tsx`) skip the `ability.can(action, subject)` check entirely, so the menu item renders for every user regardless of permission. Confirm the entry's own route is also exempt from the real guard (e.g. in `PUBLIC_ROUTES`/`ROUTE_ACCESS`, like `profile:view`/Settings is) — if the page still self-checks permission on mount (`checkPermission('view', subject)` / `usePermissionCheck`) and 403s unauthorized users, `alwaysShowInMenu` has created a menu link that's visible to everyone but leads straight to an access-denied page for most of them. Don't wave this through just because an existing sibling domain (e.g. Department) already has the same flag — copying a pre-existing mismatch into a second domain doubles the blast radius instead of fixing it; flag it at Blocking severity and ask whether the intent was true-public visibility or a copy-paste default.

**i18n**
- All user-facing text goes through `t('...')`; nothing hardcoded in JSX.
- Keys added to **both `vi` and `en`** (`src/locales/{vi,en}/common.json`) — this project has no `ch` locale, don't add one.
- Domain-scoped key (`machineTypeManagement.table.headers.x`), not a vague flat key.
- No key deleted without a repo-wide check for remaining usage.

**Tables / columns (`_components/Columns.tsx` or `Column.tsx`)**
- Columns take callbacks (`onEdit`, `onDelete`) — they don't call a service or mutate page state themselves.
- No actions column rendered when no action is permitted for the current ability.
- Icon-only action buttons have a tooltip or `aria-label`.
- Table has a stable `rowKey` (real id, not array index), a `loading` prop, and pagination.

**State ownership**
- No new Zustand store added for a Qwaste module (existing ones are legacy, not a pattern to copy).
- Server list data isn't duplicated between Redux and TanStack Query — one owns it, the other reads from it if needed.
- Local-only state (modal open, selected row, one-page filters) isn't promoted to Redux.
- `useEffect` isn't used to compute simple derived state that could just be computed inline or via `useMemo`.

**React/Next performance**
- Independent requests use `Promise.all`, not sequential `await` (no accidental waterfalls).
- `useMemo`/`useCallback` deps are primitives or stable references, not new objects/arrays/functions created every render.
- Heavy chart/table components aren't pulled into the main bundle when a dynamic import fits.

**`lib/` vs `utils/` placement** (when new files are added)
- A third-party wrapper, or anything with a side effect (DOM, cookies, script injection, module-level singleton state), goes in `src/lib`, never `src/utils`.
- `src/utils` stays pure-function-only; `index.ts` barrel there shouldn't re-export a lib-style wrapper.

## Step 3 — Blast-radius check

Before approving a renamed/reshaped field, a changed method signature, or a removed export, confirm every real consumer was updated — this is the single most common source of regressions in this codebase (a backend `totals`/`runtimeByStatus` reshape once touched types, schemas, services, mocks, and components across the tree).

- Search the actual source: `grep -rln "<symbol>" src` for every renamed/removed/changed identifier.
- If `graft/` is present, it's faster for call-site tracing: grep the per-file cards under `graft/src/**` for the symbol, or use the `graft` CLI (`graft callers <symbol>`, `graft ask "<question>"`) to walk the call graph (`graft/.graph/wiring.json`) instead of eyeballing imports.
- Check test mocks too — a `jest.mock('...Service')` stub with a stale shape will pass typecheck and still be wrong; `grep -rl "jest.mock.*ServiceName" src`.

## Step 4 — Defer to the test gate

Don't re-derive test-running logic here. If the diff touches `.ts`/`.tsx` under `src/`, hand off to `.Codex/skills/qwaste-test-gate/SKILL.md` for typecheck → targeted test → full suite → baseline diff, and report its result alongside the review findings rather than skipping it because the code "looks right."

## Step 5 — Report

Lead with findings, each with a file reference (`path:line`). Group by severity if there are several:

- **Blocking** — breaks the architecture rules above, will cause a real bug, or hides a permission check.
- **Should fix** — convention drift, missing i18n fallback, missing test coverage for a mapper/permission parser.
- **Note** — pre-existing issue nearby, out of scope for this diff; mention it but don't fix it inline.

Call out explicitly:
- Any unrelated refactor or formatting churn riding along in the diff.
- Any place the diff's own stated intent doesn't match what the code does.

If nothing is wrong in a given checklist section, don't list it — silence on a category means it passed, not that it was skipped.

## Step 6 — Score

Every review ends with a numeric score, immediately after the findings list — don't wait to be asked.

1. Start at **10**.
2. Subtract per surviving finding (pre-existing `Note` items scoped out of this diff don't count against it):
   - Blocking: **−2** each
   - Should fix: **−1** each
3. Clamp to **[0, 10]**.
4. Override: if Step 4's test gate shows any real regression — a failing test or a typecheck error that isn't the known baseline (`SpaceOverviewGrid.test.tsx`, `SpaceNode.test.tsx`) — cap the score at **4/10** regardless of how clean everything else is. Broken tests/types outrank every style and convention finding combined; don't let a high architecture score paper over a red test gate.
5. Report it as one line directly under the findings, e.g. `**7/10** — 1 Blocking (menu permission bypass), 1 Should fix (asymmetric validation); tests green.` Don't compute or state a score before Step 2 and Step 4 have actually run — a score given ahead of the test gate is a guess, not a result.

A 10/10 should be rare and means exactly what it says: no Blocking, no Should fix, tests green, nothing papered over with a Note to avoid docking points.
