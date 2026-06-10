# Qwaste React and Next.js Performance Rules

This reference adapts the Vercel React best-practice rule categories to Qwaste v2. Use it when writing, reviewing, or refactoring React components, Next.js App Router pages, dashboard views, forms, tables, charts, hooks, or data fetching.

## Priority Map

| Priority | Category | Prefix | Apply in Qwaste when |
| --- | --- | --- | --- |
| 1 | Eliminating Waterfalls | `async-*` | Pages load several API resources, dashboard panels, detail + lookup data, route handlers |
| 2 | Bundle Size | `bundle-*` | Imports from icons, Ant Design, charts, DnD, PDF/upload, large helpers |
| 3 | Server/Client Boundary | `server-*` | App Router pages, server components, BFF/API routes, client component props |
| 4 | Client Data Fetching | `client-*` | TanStack Query, WebSocket, event listeners, local/session storage |
| 5 | Re-render Optimization | `rerender-*` | Tables, filters, form builders, chart panels, columns, modal workflows |
| 6 | Rendering Performance | `rendering-*` | Long lists, chart-heavy pages, hydration-sensitive UI |
| 7 | JavaScript Hot Paths | `js-*` | Mapping/filtering large lists, tree builders, validators, chart data transforms |
| 8 | Advanced Hooks | `advanced-*` | Stable event handlers, one-time app init, latest callback refs |

## 1. Eliminating Waterfalls

### `async-parallel`

If calls are independent, start them together.

Prefer:

```ts
const [overview, machines, energy] = await Promise.all([
    FactoryService.getFactoryOverview(factoryId, datePeriod),
    MachineService.getMachinesWithLogs(spaceId, datePeriod),
    EnergyService.getEnergyOverview(datePeriod),
]);
```

Avoid:

```ts
const overview = await FactoryService.getFactoryOverview(factoryId, datePeriod);
const machines = await MachineService.getMachinesWithLogs(spaceId, datePeriod);
const energy = await EnergyService.getEnergyOverview(datePeriod);
```

Use in Qwaste for dashboard panels, lookup data, filter options, and detail side panels when each request does not depend on another response.

### `async-cheap-condition-before-await`

Check cheap conditions before async work.

Prefer:

```ts
if (!factoryId) return;
if (!checkPermissionSilent('view', 'factory_overview')) return;

const overview = await FactoryService.getFactoryOverview(factoryId, datePeriod);
```

Avoid awaiting data before checking required ids, permissions, selected filters, or modal open state.

### `async-defer-await`

Only await values in branches that need them.

Prefer:

```ts
if (mode === 'edit' && productId) {
    const product = await ProductService.getProductById(productId);
    setModalState({ open: true, mode, data: product });
    return;
}

setModalState({ open: true, mode: 'create', data: null });
```

Do not load detail data before knowing the user is opening edit/view mode.

### `async-api-routes`

In route handlers and BFF code, start independent reads early and await late. Keep auth/token checks early and cheap. Do not add per-request mutable module state.

## 2. Bundle Size

### `bundle-barrel-imports`

Avoid broad barrel imports when they pull in large libraries or many modules.

Qwaste-specific rules:

- Prefer direct service imports such as `@/services/MachineService` over importing many services from `@/services` in feature code.
- Prefer direct shared component paths when only one component is needed.
- Keep Ant Design imports consistent with existing pages, but do not import more components than used.
- For icons, import only used icons from `@ant-design/icons`.
- Do not add a new giant `index.ts` barrel for a route folder unless it reduces real duplication without broad imports.

### `bundle-dynamic-imports`

Use dynamic import for heavy client-only UI that is not needed immediately:

- PDF preview modals
- large chart panels below the fold
- drag-and-drop boards
- map components
- upload previews

Do not dynamically import small buttons, table columns, or simple forms.

### `bundle-conditional`

Load feature-specific code only when the feature is active. Example: do not load a manager review drawer or PDF preview until the drawer/modal can open.

### `bundle-analyzable-paths`

Keep imports statically analyzable. Do not build dynamic import paths from arbitrary strings.

## 3. Server and Client Boundary

### `server-serialization`

When passing data from Server Component to Client Component, pass only fields the client uses.

Qwaste currently has many client dashboard pages. If introducing a server component wrapper, avoid passing full backend objects into client widgets when only name/id/status is needed.

### `server-no-shared-module-state`

Do not keep request-specific state in module-level variables inside server components, route handlers, or BFF code.

Allowed:

- Static constants.
- Pure helper functions.
- Cache objects only when explicitly designed for cross-request caching.

Not allowed:

- Current user id.
- Token.
- Request filters.
- Per-request response data.

### `server-auth-actions`

Any server action or route handler that mutates data must authenticate and authorize. Do not assume UI permission checks are enough.

### `server-parallel-fetching`

If an App Router server page fetches multiple independent resources, parallelize them the same way as client dashboard fetches.

## 4. Client Data Fetching

### `client-query-dedup`

Qwaste uses TanStack Query, not SWR, for server-state caching. For repeated server data, prefer TanStack Query instead of duplicate `useEffect` service calls.

Rules:

- Query key includes every request parameter.
- Query function calls service only.
- Mutations invalidate exact affected query keys.
- Do not copy query data into Redux unless editing a draft workflow.

See `STATE_QUERY_HOOKS.md` for full query rules.

### `client-event-listeners`

Deduplicate global event listeners.

If several components need one browser or websocket event, prefer a provider/context/hook that subscribes once and distributes state.

Always clean up:

```ts
useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, [handleResize]);
```

### `client-passive-event-listeners`

For manual scroll/touch listeners, use passive listeners when you do not call `preventDefault`.

### `client-localstorage-schema`

Minimize localStorage/sessionStorage. If storing structured preferences, version the shape and validate on read.

Do not store tokens, passwords, refresh tokens, or sensitive auth payloads in browser storage.

## 5. Re-render Optimization

### `rerender-derived-state-no-effect`

If a value can be computed from current props/state, derive it during render. Do not create extra state plus effect.

Prefer:

```ts
const filteredMachineData = useMemo(() => {
    if (!searchTerm.trim()) return machineData;

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return machineData.filter((machine) =>
        machine.machineName?.toLowerCase().includes(lowerSearchTerm)
    );
}, [machineData, searchTerm]);
```

Avoid:

```ts
const [filteredMachineData, setFilteredMachineData] = useState<Machine[]>([]);

useEffect(() => {
    setFilteredMachineData(machineData.filter(...));
}, [machineData, searchTerm]);
```

### `rerender-memo`

Use `useMemo` for expensive derived arrays/objects passed to large UI:

- Ant Design table columns
- filtered/sorted table data
- tree data
- chart datasets
- operator/machine lookup maps

Do not use `useMemo` for trivial primitive values.

### `rerender-dependencies`

Prefer primitive dependencies:

```ts
useEffect(() => {
    fetchMachineData(selectedSpaceId, datePeriod);
}, [selectedSpaceId, datePeriod, fetchMachineData]);
```

Avoid depending on unstable object literals.

### `rerender-functional-setstate`

When next state depends on previous state, use functional update:

```ts
setModalState((prev) => ({ ...prev, open }));
setSelectedRowKeys((prev) => prev.filter((key) => key !== removedKey));
```

This avoids stale closures and often removes unnecessary dependencies.

### `rerender-no-inline-components`

Do not define React components inside page/components. Move them to route `_components` or module scope and pass props.

Symptoms this prevents:

- input loses focus
- modal content remounts
- effects rerun every render
- table cell components lose local state

### `rerender-move-effect-to-event`

Do not use effects for interaction logic that belongs in a handler.

Prefer calling submit/delete/open-modal logic directly from `handle...` functions.

### `rerender-use-ref-transient-values`

Use refs for values that must persist but should not re-render UI:

- timeout ids
- WebSocket unsubscribe callbacks
- previous fetched id cache
- latest callback reference

### `rerender-transitions`

For expensive non-urgent UI updates such as large search/filter/tree changes, consider `startTransition` or `useDeferredValue`. Do not use it for simple CRUD forms unless typing becomes sluggish.

## 6. Rendering Performance

### `rendering-conditional-render`

Use explicit ternaries when the false value can be `0`, empty string, or a value that React could render accidentally.

Prefer:

```tsx
{items.length > 0 ? <Table dataSource={items} /> : <EmptyState />}
```

### `rendering-content-visibility`

For long below-the-fold dashboard sections, consider CSS `content-visibility` if rendering cost is high. Do not apply blindly to tables/modals where layout measurement matters.

### `rendering-hoist-jsx`

Hoist static JSX/config outside components when it does not need props, theme, translation, permission, or state.

### `rendering-hydration-no-flicker`

Avoid UI that changes from server to client immediately due to client-only values. If a value depends on `window`, time, or local storage, isolate it in client-only code with stable fallback.

## 7. JavaScript Hot Paths

### `js-index-maps`

When repeatedly looking up by id, build a `Map`.

Prefer:

```ts
const operatorById = useMemo(
    () => new Map(operators.map((operator) => [operator.userId, operator])),
    [operators]
);
```

Avoid repeated `find` calls inside table render, tree render, or chart mapping.

### `js-combine-iterations`

Avoid repeated passes over large arrays when one loop is clear enough.

This matters for:

- machine list filtering and grouping
- order plan tree building
- chart data transforms
- permission/role mapping

### `js-set-map-lookups`

Use `Set` for repeated existence checks:

```ts
const selectedMachineIds = useMemo(() => new Set(selectedMachines.map((m) => m.machineId)), [
    selectedMachines,
]);
```

### `js-hoist-regexp`

Hoist reusable regex constants outside loops/components when they are stable.

### `js-early-exit`

Prefer early returns in handlers and helpers. This matches Qwaste's permission and validation style:

```ts
if (!checkPermission('delete', 'machine')) return;
if (!machine.machineId) return;
```

## 8. Advanced Hook Patterns

### `advanced-use-latest`

When a subscription/timer needs the latest callback without resubscribing each render, keep the latest callback in a ref.

Use carefully in WebSocket hooks, timers, and document/window listeners.

### `advanced-event-handler-refs`

For long-lived event listeners, a stable handler that reads from refs can avoid unnecessary unsubscribe/subscribe churn. Prefer simple dependency-correct effects first.

### `advanced-init-once`

One-time app initialization should live in a provider or app-level hook, not in multiple pages.

Examples:

- global websocket setup
- auth/session event bridge
- theme bootstrap
- global error handlers

## Qwaste Review Checklist

When reviewing React/Next code, check:

- Independent API calls are sequential instead of parallel.
- Client component is used where server component would work.
- Large server data object is passed to a client component.
- Page imports a broad barrel or unused large library.
- Heavy modal/chart/map/pdf code loads before needed.
- Query data is copied into Redux or local state without draft workflow.
- Derived state is maintained with `useEffect`.
- Expensive table columns/filter/tree data are recreated every render.
- Callback uses stale state instead of functional update.
- Component is declared inside another component.
- Effects have object dependencies that change every render.
- Global listeners/subscriptions are not cleaned up.
- Repeated `find/filter/map` hot paths should be `Map`, `Set`, or combined pass.
