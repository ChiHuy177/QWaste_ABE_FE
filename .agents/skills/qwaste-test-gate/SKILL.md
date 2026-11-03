---
name: qwaste-test-gate
description: Use after implementing or modifying any feature, service, type, or component in Qwaste v2 — before telling the user the work is done. Verifies new unit tests pass AND no existing test regressed. Trigger on requests like "fix", "refactor", "implement", "sửa", "thêm tính năng", "viết test", or any code edit touching src/services, src/types, src/schemas, src/utils, or src/app.
---

# Qwaste Test Gate

A code change is not done until this gate passes. "I wrote the code" and "I ran `npm test`" are two different claims — only make the second one after actually running it in this turn, on the current diff. Never tell the user tests pass without showing the command output that proves it.

## Why this exists

Renaming or reshaping a field (a real example: backend's `totals: {runtime,idle,error,offline}` replacing the old `runtimeByStatus` map) touches far more call sites than the one file being edited — types, schemas, services, mock generators, and every component that reads the field. `tsc` catches most of those breaks, but silent ones (wrong JSON key inside an `any`-typed test mock, a stale assertion string) only surface by actually running the suite. Skipping this step is how a fix for bug A quietly reintroduces bug B in a file three folders away.

## The gate, in order

Run these for every turn that edits `.ts`/`.tsx` under `src/`, even if the user didn't explicitly ask for tests.

1. **Typecheck first — it's cheap and catches most breakage before jest does:**
   ```bash
   npx tsc --noEmit -p tsconfig.json
   ```
   Fix every error here before running jest. A type error usually means a consumer was missed, not that the type is wrong.

2. **Run the specific test file(s) for what you touched**, by path, with `--verbose` so you can read individual case names, not just the suite summary:
   ```bash
   npx jest src/services/test/XxxService.test.ts --verbose
   ```
   If you added new tests, this is where you confirm they actually exercise the new behavior — a new test that passes by accident (e.g. because a mock always returns the same stub regardless of input) is worse than no test.

3. **Run the full suite** — the specific file passing is not enough; changing a shared type or a shared util (`spaceStatsUtils.ts`, `types/Machine.ts`, anything under `schemas/`) can break tests in files you never opened:
   ```bash
   npx jest --coverage=false
   ```

4. **Diff the failures against the known baseline, don't just read the pass count.** As of this writing, exactly two suites fail for a reason unrelated to application code — a Jest `transformIgnorePatterns` gap on `@ant-design/icons` → `@ant-design/colors` (ESM `import` inside `node_modules`), pre-existing and not something a feature change fixes or should try to fix:
   - `src/features/dashboard/space-monitoring/__tests__/SpaceOverviewGrid.test.tsx`
   - `src/features/dashboard/space-monitoring/__tests__/SpaceNode.test.tsx`

   Before reporting "all tests pass," check that:
   - These two (if still present) are the *only* failing suites — anything else failing is a real regression from the current change, not baseline noise.
   - If a suite fails that isn't on this list, that's new. Fix it, don't wave it through.
   - If a fix to the Jest config or `transformIgnorePatterns` makes these two suites run again, update this list (or delete it) so it stays true — a stale baseline list is worse than none, because it teaches the next pass to ignore a real failure.

## What "existing tests must pass" actually means

- If an existing test fails **because the old behavior it asserted was wrong** (the thing you were fixing), update that test's expectation — but say so explicitly to the user ("updated test X because it asserted the old `runtimeByStatus` shape"). Don't silently edit assertions to force green.
- If an existing test fails and the old behavior it asserted was **still correct**, your change broke something unrelated — fix the change, not the test.
- Never reach for `.skip`, `.todo`, deleting the failing `it()`, or loosening an assertion (`toBeDefined()` instead of `toBe(specificValue)`) just to get to green. That's hiding the regression, not fixing it.
- A test file with `jest.mock(...)` stubs must still reflect the real contract — if you change a service's return shape, update its mocks in the same turn, in every test file that mocks it (`grep -rl "jest.mock.*ServiceName" src`).

## Writing new unit tests (when the task calls for them)

Follow the conventions already established in `src/services/test/*.test.ts` (see `SpaceService.test.ts`, `EnergyService.test.ts`, `WebSocketService.test.ts`):

- Service-layer tests live in `src/services/test/<ServiceName>.test.ts`; component tests live in `__tests__/` next to the component; small pure-function tests are co-located (`foo.ts` + `foo.test.ts`).
- Mock `NetworkService` (and any other service dependency) via `jest.mock`, with a `mockRequestJson = jest.fn()` declared *before* the `jest.mock` call that references it.
- Reset mocks and any module-level cache (e.g. a service's `private static xCache`) in `beforeEach` — reach into private statics the same way `WebSocketService.test.ts` does (`(Service as any).field = null`), since a cache that leaks across tests produces flaky, order-dependent results.
- Structure each `it()` as Arrange → Act → Assert, and name it as a Vietnamese sentence describing the behavior being locked in, not the implementation detail (`'filterId khớp SHIFT row -> fallback về PERIOD primary'`, not `'test case 3'`).
- Cover the branch that would silently regress if someone "simplified" the code later: fallback paths, cache-hit vs cache-miss, and any place two similar-looking functions deliberately behave differently (document *why* in the test, as the SpaceService/EnergyService tests do for the SHIFT-id disambiguation difference between them).

## Reporting back

State the gate result plainly: which command(s) you ran, the pass/fail counts, and — if any suite failed — whether it's the known baseline or a real regression you then fixed. If you could not run the suite at all (sandboxing, missing deps), say so explicitly rather than asserting tests pass.
