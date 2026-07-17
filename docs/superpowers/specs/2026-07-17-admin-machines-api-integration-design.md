# Admin Machines Page — Real API Integration Design

**Date:** 2026-07-17
**Status:** Approved

## Problem

`/admin/machines` currently runs entirely on mock data. `USE_MOCK_FACTORY_OVERVIEW = true` in
`src/mockData/admin/factory/factoryOverview.ts` routes `MachineStore.fetchFactories()`,
`MachineStore.fetchMachines()`, and the industry-filter fetch in `page.tsx` through
`DemoFactoryOverviewService` instead of the real backend. Separately, even the "real" code path
that would run if the flag were flipped is broken: `MachineService.getMachinesWithLogs()` calls
`ENDPOINTS.MACHINE.WITH_LOGS` (`/api/machines/monitoring/v1/overview/byFilter`), a route that does
not exist on the backend (`MachineMonitoringController` only exposes
`overview/byCurrentShift/{machineId}`).

## Goal

Wire `/admin/machines` to real backend data, fixing the broken endpoint call in the process, and
remove the mock code paths that are no longer reachable.

## Non-goals / Out of scope

- `MachineDashboardSummary.tsx` / `MachineDurationSummaryTable.tsx` consume a **different** mock
  module, `src/mockData/admin/factory/machineDashboard.ts` (`MOCK_MACHINE_PLAN`), unrelated to the
  `USE_MOCK_FACTORY_OVERVIEW` flag. No backend endpoint for this data was found during API
  discovery. Left as mock; not touched by this change; flagged as a known follow-up.
- No new backend work. Every endpoint used here already exists and is already wired into a FE
  service (`SpaceService.getSpaceOverview`, `SpaceService.getAllSpacesTree`,
  `IndustryFilterService.getAllIndustryFilters`).
- No changes to `/topic/machines/status/{machineId}` — already correct, matches BE.

## Available APIs used

| API | Method + Path | FE call site (already exists) |
|---|---|---|
| Space tree | `GET /api/spaces/v1` (all spaces, tree) | `SpaceService.getAllSpacesTree()` |
| Space overview by filter | `GET /api/spaces/monitoring/v1/overview/byFilter?spaceId&filterId` | `SpaceService.getSpaceOverview(spaceId, filterId, shiftFilterId?)` |
| Industry filters | `GET /api/industryFilters/v1` | `IndustryFilterService.getAllIndustryFilters()` |
| Machine status (WS, unchanged) | `/topic/machines/status/{machineId}` | `page.tsx` WS subscription |

`SpaceService.getSpaceOverview()` returns a `SpaceOverview` tree; `MachineStore.ts` already has
`extractMachines()` (flattens `machineChildren` recursively) and `adaptMachine()` (maps
`MachineWithStatusLogsSummary` → `MachineOverview`) written against this exact shape — they were
built to mirror the mock service, so they can be reused unchanged for the real response.

## Changes

### 1. `src/stores/MachineStore.ts`

- `machineActions.fetchFactories()`: remove the `USE_MOCK_FACTORY_OVERVIEW` branch; always call
  `SpaceService.getAllSpacesTree()`.
- `machineActions.fetchMachines(spaceId, filterId)`: remove the mock branch; replace
  `MachineService.getMachinesWithLogs(spaceId, filterId)` with
  `SpaceService.getSpaceOverview(spaceId, filterId)`, then run the existing
  `extractMachines(overview).map(adaptMachine)` pipeline (same as the old mock branch).
- Remove `updateMachinesPower` reducer + `machineActions.updateMachinesPower`.
- Remove `setFullMachinesData` reducer + `machineActions.setFullMachinesData`.
- Remove the `import { DemoFactoryOverviewService, USE_MOCK_FACTORY_OVERVIEW } from '@/mockData/admin/factory'` import.

### 2. `src/app/(dashboard)/admin/machines/page.tsx`

- Remove the `USE_MOCK_FACTORY_OVERVIEW` branch in the industry-filter fetch effect; always call
  `IndustryFilterService.getAllIndustryFilters()`.
- Remove the `/topic/energy/zone/{selectedSpaceId}` WS subscription `useEffect` block entirely (no
  BE publisher exists for `MACHINES_CURRENT_POWER` / `MACHINES_FULL_POWER`; the field it feeds,
  `currentEnergyConsumption`, already always renders `0 kW` today since this topic never fires).
- Remove the now-unused `DemoFactoryOverviewService` / `USE_MOCK_FACTORY_OVERVIEW` import.

### 3. `src/services/MachineService.ts`

- Remove `getMachinesWithLogs()` (dead — no matching backend route).

### 4. `src/services/endpoints.ts`

- Remove `MACHINE.WITH_LOGS`.

### 5. Mock cleanup

- Delete `src/mockData/admin/factory/factoryOverview.ts`.
- Delete `src/mockData/admin/factory/DemoFactoryOverviewService.ts`.
- Update `src/mockData/admin/factory/index.ts` to only `export * from './machineDashboard'`
  (the other two re-exports are removed along with their source files; `machineDashboard.ts` stays,
  see Non-goals).

## Error handling

No new error handling needed — `fetchFactories`/`fetchMachines` already wrap calls in
try/catch and dispatch `setError`/toast on failure via existing `catch` blocks. Real network
failures (e.g. 500, network drop) now surface through this existing path instead of never
happening (mock calls couldn't fail).

## Testing (manual — UI/data integration, no new business logic)

1. Open `/admin/machines`, confirm the space tree and industry-filter dropdown populate from real
   data (Network tab shows `GET /api/spaces/v1` and `GET /api/industryFilters/v1`, not mock).
2. Select a space + time period, confirm `GET /api/spaces/monitoring/v1/overview/byFilter?spaceId=&filterId=`
   fires and the machine list / stats cards / dashboard summary render using its response.
3. Switch space and switch filter independently; confirm refetch happens each time with correct
   params.
4. Trigger a real machine status change (or simulate via BE) and confirm `MachineCard` /
   `MachineFocusView` still update live via `/topic/machines/status/{machineId}` — unaffected by
   this change.
5. Confirm no console errors/warnings from removed imports, and no remaining references to
   `USE_MOCK_FACTORY_OVERVIEW`, `DemoFactoryOverviewService`, `getMachinesWithLogs`,
   `ENDPOINTS.MACHINE.WITH_LOGS` anywhere in `src/`.
