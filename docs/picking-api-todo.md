# Picking API fixes

Backend source: `D:/Github/ABE_BE` (checked 2026-11-03).

- [x] #1: Use operation type picking API in the mold form; add picking DTO, service, endpoint and separate query cache.
- [x] #2: Use operation type picking API in the machine form; remove the unused full-list dropdown method.
- [ ] #3: Use industry filter picking API for the machine page time-period dropdown.

Keep the full machine lookup used by production plans: the operation-type picking endpoint cannot replace this lookup.

For each item: typecheck, targeted tests, full Jest suite, review, and a separate commit. Record live-browser verification limitations explicitly.

## Validation

- #2: Typecheck passed; shared picking service tests 2/2 passed; full suite 4 passed / 4 failed, 33 tests passed / 1 failed (same baseline failures as #1). Machine-list route HTTP 200; interactive E2E unavailable. Review: no findings, 10/10 for scoped code; verified no remaining consumers of the removed method and CRUD invalidation still includes the picking cache.

- #1: Typecheck passed; service tests 2/2 passed; full suite 4 passed / 4 failed, 33 tests passed / 1 failed. A clean HEAD archive reproduces the same 4 failures: SpaceOverviewGrid, SpaceNode and DynamicSpaceFilter (Ant Design ESM), and planMappers (PARTIAL expected PAUSE, actual COMPLETE). No new failing suites. Mold route HTTP 200; interactive E2E unavailable because browser access host is unavailable. Review: no findings in this change; 10/10 for scoped code, live permission check still pending.
