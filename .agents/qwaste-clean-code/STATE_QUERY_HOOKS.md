# Qwaste State, Query, and Custom Hook Rules

Use this file when a task touches shared state, Redux Toolkit, TanStack Query, server-state caching, reusable hooks, or page data orchestration.

## Decision Matrix

Choose the smallest state owner that fits the data:

| Data kind | Use | Do not use |
| --- | --- | --- |
| Local UI state used by one page/component | `useState`, `useReducer` | Redux |
| Derived UI values | `useMemo` during render | `useEffect` + extra state |
| Shared app/client state | Redux Toolkit in `src/stores` | New Zustand store |
| Server data that needs cache/refetch/invalidation | TanStack Query | Redux copy of query result |
| One reusable workflow for a page/domain | Custom hook | Large page component |
| Pure mapping/formatting/calculation | `src/utils` or route-local `utils` | Hook |

Project rule: do not create new Zustand stores for Qwaste modules. Existing Zustand files may remain if already used, but new shared state should use Redux Toolkit or another existing approved pattern.

## Redux Toolkit Rules

Use Redux when data is client-owned, shared across distant components, participates in a workflow, or already belongs to an existing store domain.

Existing pattern:

- Store setup: `src/stores/configureStore.ts`
- Typed hooks: `src/stores/hook.ts`
- Domain stores: `src/stores/*Store.ts`
- Provider: `src/provider/ReduxProvider.tsx`

Use these imports:

```ts
import { useAppDispatch, useAppSelector } from '@/stores/hook';
```

Do not import raw `useDispatch` or `useSelector` directly in feature code.

### Store Shape

Prefer explicit state:

```ts
interface ProductState {
    products: Product[];
    selectedProduct: Product | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
}
```

Rules:

- Boolean names should read clearly: `isLoading`, `isSubmitting`, `hasNext`, `canEdit`.
- Keep server response types in `src/types`, not inside store files.
- Keep store state serializable.
- Do not store functions, class instances, DOM nodes, Dates as mutable objects, AbortControllers, or complex non-serializable values.
- Do not duplicate server data into Redux when TanStack Query already owns it.

### Async Actions

Current stores use thunk-style action functions. Keep the local pattern unless refactoring the entire store.

Pattern:

```ts
loadProducts: () => async (dispatch: AppDispatch) => {
    dispatch(slice.actions.setLoading(true));

    try {
        const products = await ProductService.getAllProducts();
        dispatch(slice.actions.setProducts(products));
        dispatch(slice.actions.setError(null));
    } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to load products');
        dispatch(slice.actions.setError(message));
        return { success: false, error: message };
    } finally {
        dispatch(slice.actions.setLoading(false));
    }

    return { success: true };
};
```

Rules:

- Redux actions may call services.
- Redux actions should not show toast, except for existing app-wide notification patterns with a clear reason.
- Components decide whether to toast after dispatch result.
- If an action sets loading true, it must clear loading in `finally`.
- Return `{ success, error }` when the caller needs to decide UI flow.
- Do not chain `.then()` after dispatch in new code; use `await dispatch(...)`.

### Selectors

Prefer typed selectors:

```ts
const products = useAppSelector((state) => state.product.products);
const isLoading = useAppSelector((state) => state.product.isLoading);
```

Rules:

- Select only the fields the component needs.
- Avoid selecting a whole large slice if the component uses one boolean.
- Derive booleans with selectors or `useMemo` instead of storing duplicate state.
- Avoid creating new arrays/objects inside `useAppSelector` unless memoized.

## TanStack Query Rules

Use TanStack Query for server state that benefits from caching, refetching, invalidation, pagination, or background updates.

Existing provider:

```text
src/provider/ReactQueryProvider.tsx
```

Existing usage example:

```text
src/app/(dashboard)/admin/categories/spaceLevel/page.tsx
```

### Query Keys

Define stable query keys near the feature or in a route-local helper:

```ts
const productQueryKeys = {
    all: ['products'] as const,
    list: (filters: ProductFilters) => [...productQueryKeys.all, 'list', filters] as const,
    detail: (productId: number) => [...productQueryKeys.all, 'detail', productId] as const,
};
```

Rules:

- Query keys must be stable and descriptive.
- Include all parameters that affect the request.
- Prefer primitive key parts. If filters are objects, keep them stable or build keys from primitive fields.
- Do not use vague keys like `['data']`.

### useQuery

Pattern:

```ts
const productsQuery = useQuery({
    queryKey: productQueryKeys.list({ searchTerm }),
    queryFn: () => ProductService.getAllProducts(),
    staleTime: 60_000,
});
```

Rules:

- Query functions call service methods only.
- Use `enabled` for queries that require an id or filter.
- Do not call service in `useEffect` if `useQuery` is already managing the data.
- Do not copy `query.data` into Redux or local state unless the user is editing a draft.
- Use `select` for lightweight response shaping if it is specific to this query.
- Keep heavy mapping in service/helper or memoized selectors.

### useMutation

Pattern:

```ts
const queryClient = useQueryClient();

const createProductMutation = useMutation({
    mutationFn: ProductService.createProduct,
    onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
    },
});
```

Rules:

- Mutations call service methods.
- Invalidate the smallest correct query key after create/update/delete/restore.
- Keep toast behavior in component callbacks or mutation handlers according to the local page pattern.
- Do not close modals on mutation failure.
- Use `mutateAsync` when the flow needs `await`, confirmation, or form modal control.

### TanStack Query vs Redux

Use TanStack Query when:

- Data comes from backend and should be refetched.
- Multiple components need the same server data cache.
- Mutation should invalidate list/detail data.
- Data has filters, pagination, detail views, or background refresh.

Use Redux when:

- State is client-owned workflow state.
- State must coordinate many UI components independent of server cache.
- Existing module already has a Redux workflow.
- You need explicit action history and predictable client transitions.

Do not use both for the same canonical server list unless there is a clear boundary, such as TanStack owning server data and Redux owning a draft/editing workflow.

## Custom Hook Rules

Use custom hooks to extract reusable behavior, not to hide simple code.

Good candidates:

- Reused API orchestration across components.
- Complex form workflow state.
- WebSocket subscriptions.
- Permission or route access checks.
- Kanban/drag workflow state.
- Debounced search/filter behavior.
- Modal workflow that is reused.

Poor candidates:

- A one-line `useMemo`.
- A single `useState`.
- Pure formatting or mapping. Put that in `utils`.
- UI markup. Use a component instead.

### Hook Location

Use these locations:

- Shared hook used across app: `src/hooks/useSomething.ts`
- Domain-specific route hook: `src/app/(dashboard)/.../_components` or route-local `hooks`
- Complex feature hook already colocated: follow existing `OrderForm/hooks` pattern
- Kanban/task hook: existing `src/hooks/kanban`

### Hook Naming

Rules:

- Hook name must start with `use`.
- Use domain + behavior: `useOrderPlanData`, `useOrderFormActions`, `useDrawingCodes`, `usePermissionCheck`.
- Return names should be explicit, not generic `data` when multiple domains are involved.

Pattern:

```ts
interface UseProductListResult {
    products: Product[];
    isLoading: boolean;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    refetchProducts: () => Promise<void>;
}

export const useProductList = (): UseProductListResult => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const refetchProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            const nextProducts = await ProductService.getAllProducts();
            setProducts(nextProducts);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        products,
        isLoading,
        searchTerm,
        setSearchTerm,
        refetchProducts,
    };
};
```

### Hook Dependency Rules

- Include all values used by `useEffect`, `useMemo`, and `useCallback`.
- Prefer primitive dependencies over whole objects.
- Memoize callbacks returned from hooks if consumers pass them into memoized children.
- Do not suppress dependency lint without a clear reason.
- Use refs for transient values that should not re-render UI.
- Clean up subscriptions, timers, listeners, and WebSocket handlers.

### Hook Responsibility

Hooks may:

- Call services.
- Use Redux hooks.
- Use TanStack Query.
- Own workflow state.
- Return handlers and derived values.

Hooks should not:

- Render JSX.
- Show global toast unless the hook is explicitly a UI workflow hook and existing code uses that pattern.
- Know route-specific translation text unless colocated with that route.
- Mix multiple unrelated domains.

## Page Orchestration With Hooks

When a page becomes too large:

- Keep route layout and JSX composition in `page.tsx`.
- Move data orchestration into a hook if it is reusable or materially reduces complexity.
- Move form-specific logic into form hooks.
- Move table columns into `Columns.tsx`.
- Move pure mappers/validators into `utils`.

Suggested split:

```text
page.tsx
_components/Columns.tsx
_components/productFormConfig.ts
hooks/useProductList.ts
utils/productMappers.ts
utils/productValidators.ts
```

Do not split prematurely. A simple CRUD page can stay in `page.tsx` plus columns/form config.

## Validation Checklist

For Redux changes:

- Store is registered in `configureStore.ts`.
- Uses `useAppDispatch` and `useAppSelector`.
- Loading clears in `finally`.
- Store state is serializable.
- No toast in store action unless existing pattern justifies it.

For TanStack Query changes:

- Query keys include all request params.
- Query function calls service only.
- Mutations invalidate correct query keys.
- Server data is not copied into Redux unnecessarily.
- `enabled` guards missing ids.

For custom hook changes:

- Hook name starts with `use`.
- Hook has clear domain responsibility.
- Effects have complete dependencies.
- Subscriptions/listeners/timers are cleaned up.
- Returned API is typed and explicit.
