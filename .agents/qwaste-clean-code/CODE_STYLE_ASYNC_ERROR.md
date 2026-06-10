# Qwaste Coding Style: Async, Error Handling, and Control Flow

Use this file whenever writing or reviewing TypeScript implementation code in Qwaste v2. It is intentionally concrete: follow these patterns unless the surrounding module has a stronger existing convention.

## Non-Negotiable Rules

- Use `async/await` for API, submit, delete, restore, dispatch, and mutation flows.
- Do not introduce `.then().catch()` chains in new code.
- If a function sets loading to `true`, it must clear loading in `finally`.
- Service methods should normally not catch errors.
- Page/component/hook/store layers catch errors because they own UI or state recovery.
- Do not swallow errors silently.
- Do not close a form/modal after a failed create/update/delete.
- Do not put toast, router, modal, React hooks, or Redux dispatch inside service files.
- Use early return for permission, missing id, invalid state, or disabled action checks.

## Async/Await Instead Of `.then().catch()`

### Correct

```ts
const fetchMachineData = async () => {
    try {
        setLoading(true);
        const machines = await MachineService.getAllMachines();
        setMachineData(machines);
    } catch (error) {
        handleError(error, { fallbackKey: 'machineManagement.fetchError' });
    } finally {
        setLoading(false);
    }
};
```

### Incorrect

```ts
const fetchMachineData = () => {
    setLoading(true);

    MachineService.getAllMachines()
        .then((machines) => {
            setMachineData(machines);
        })
        .catch((error) => {
            handleError(error, { fallbackKey: 'machineManagement.fetchError' });
        })
        .finally(() => {
            setLoading(false);
        });
};
```

Why:

- `async/await` keeps the control flow readable.
- `try/catch/finally` makes loading cleanup obvious.
- It avoids nested promise chains when a handler needs permission, confirmation, API call, toast, and refresh.

## No `.then()` After Dispatch

### Correct

```ts
const handleEditOrder = async (orderId: string) => {
    if (!checkPermission('update', 'order')) return;

    try {
        const result = await dispatch(orderActions.fetchOrderDetail(orderId));
        if (!result?.success) return;

        dispatch(orderActions.openOrderForm('edit', orderId));
    } catch (error) {
        handleError(error, { fallbackKey: 'orderManagement.form.fetchDetailError' });
    }
};
```

### Incorrect

```ts
const handleEditOrder = (orderId: string) => {
    dispatch(orderActions.fetchOrderDetail(orderId)).then(() => {
        dispatch(orderActions.openOrderForm('edit', orderId));
    });
};
```

Rules:

- If the next step depends on dispatch completion, `await dispatch(...)`.
- If dispatch returns `{ success, error }`, check it before continuing.
- Do not open edit modal before detail data is ready.

## Layer Responsibilities

### Service Layer

Service calls API and normalizes response. It does not own UI.

Correct:

```ts
export class MachineService {
    static async getMachineById(machineId: string): Promise<Machine> {
        const response = await NetworkService.requestJson<Machine>({
            method: 'GET',
            url: ENDPOINTS.MACHINE.DETAIL(machineId),
        });

        return response.result as Machine;
    }
}
```

Incorrect:

```ts
export class MachineService {
    static async getMachineById(machineId: string): Promise<Machine | null> {
        try {
            const response = await NetworkService.requestJson<Machine>({
                method: 'GET',
                url: ENDPOINTS.MACHINE.DETAIL(machineId),
            });

            toast.success('Loaded');
            return response.result as Machine;
        } catch (error) {
            toast.error('Failed');
            return null;
        }
    }
}
```

Service rules:

- No `toast`.
- No `router`.
- No React hooks.
- No Redux dispatch.
- No modal state.
- Usually no `try/catch`.
- Catch only when the service must normalize a special backend error, release a resource, or convert response shape.
- Return typed domain data, not raw `ApiResponse<T>`, unless caller needs metadata.

### Page/Component Layer

Page owns UI feedback, modal state, permission check, and loading.

Correct:

```ts
const handleDeleteMachine = useCallback(
    (machine: Machine) => {
        if (!checkPermission('delete', 'machine')) return;

        setConfirmModalState({
            open: true,
            type: 'delete',
            pendingAction: async () => {
                try {
                    await MachineService.deleteMachine(machine.machineId);
                    toast.success(t('machineManagement.deleteSuccess'));
                    await fetchMachineData();
                } catch (error) {
                    handleError(error, { fallbackKey: 'machineManagement.deleteError' });
                    throw error;
                }
            },
        });
    },
    [checkPermission, fetchMachineData, handleError, t]
);
```

Page rules:

- Check permission at the start of user action handlers.
- Use early return for missing id or invalid status.
- Use `try/catch/finally` for direct API calls.
- Use `handleError(error, { fallbackKey })` or existing page fallback pattern.
- Show success toast after successful mutation.
- Refresh data after successful create/update/delete/restore.
- Rethrow inside modal pending actions when the modal/form needs to know failure happened.

### Hook Layer

Hooks can own reusable workflow state. They must still keep error/loading behavior explicit.

Correct:

```ts
export const useMachineList = () => {
    const { handleError } = useApiErrorHandler();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMachines = useCallback(async () => {
        try {
            setIsLoading(true);
            const nextMachines = await MachineService.getAllMachines();
            setMachines(nextMachines);
        } catch (error) {
            handleError(error, { fallbackKey: 'machineManagement.fetchError' });
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    return {
        machines,
        isLoading,
        fetchMachines,
    };
};
```

Hook rules:

- Return explicit state and handlers.
- Do not render JSX.
- Clean up listeners/subscriptions/timers in `useEffect`.
- Include complete dependencies.
- Prefer primitive dependencies.
- Use refs for transient values that should not re-render UI.

### Redux Store Layer

Redux actions may call services and update store state. UI decides toast/modal behavior.

Correct:

```ts
loadMachines: () => async (dispatch: AppDispatch) => {
    dispatch(slice.actions.setLoading(true));

    try {
        const machines = await MachineService.getAllMachines();
        dispatch(slice.actions.setMachines(machines));
        dispatch(slice.actions.setError(null));
        return { success: true };
    } catch (error) {
        const errorMessage = getApiErrorMessage(error, 'Failed to load machines');
        dispatch(slice.actions.setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(slice.actions.setLoading(false));
    }
};
```

Redux rules:

- Use `async/await`.
- Use `try/catch/finally`.
- Return `{ success, error }` when component flow depends on result.
- Do not toast in store actions unless the existing module has a clear app-wide notification pattern.
- Keep state serializable.

### TanStack Query Layer

TanStack Query handles async state for server data. Avoid wrapping query functions in manual `try/catch` unless normalizing errors.

Correct:

```ts
const machinesQuery = useQuery({
    queryKey: machineQueryKeys.list(spaceId),
    queryFn: () => MachineService.getAllMachinesInList(spaceId),
    enabled: Boolean(spaceId),
});
```

Mutation with async flow:

```ts
const deleteMachineMutation = useMutation({
    mutationFn: MachineService.deleteMachine,
    onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: machineQueryKeys.all });
    },
});

const handleDeleteMachine = async (machineId: string) => {
    if (!checkPermission('delete', 'machine')) return;

    try {
        await deleteMachineMutation.mutateAsync(machineId);
        toast.success(t('machineManagement.deleteSuccess'));
    } catch (error) {
        handleError(error, { fallbackKey: 'machineManagement.deleteError' });
    }
};
```

Rules:

- Query/mutation functions call service methods only.
- Use `mutateAsync` when handler needs `await`.
- Invalidate query keys after mutation success.
- Do not copy query data into Redux unless editing a draft workflow.

## Loading State Patterns

### One loading flag

Use for simple pages:

```ts
const [loading, setLoading] = useState(false);
```

### Separate loading flags

Use when fetch and submit can happen independently:

```ts
const [isLoading, setIsLoading] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

### Per-row loading

Use for table row actions:

```ts
const [deletingMachineIds, setDeletingMachineIds] = useState<Set<string>>(() => new Set());

const handleDeleteMachine = async (machineId: string) => {
    setDeletingMachineIds((prev) => new Set(prev).add(machineId));

    try {
        await MachineService.deleteMachine(machineId);
        await fetchMachineData();
    } finally {
        setDeletingMachineIds((prev) => {
            const next = new Set(prev);
            next.delete(machineId);
            return next;
        });
    }
};
```

Rules:

- Use functional setState when next state depends on previous state.
- Do not mutate `Set`, `Map`, array, or object state in place.

## Error Handling Patterns

### UI error with fallback key

```ts
catch (error) {
    handleError(error, { fallbackKey: 'factoryManagement.fetchError' });
}
```

### Console error

Use `console.error` only when it adds debugging value. Do not commit `console.log` debug.

```ts
catch (error) {
    console.error('Error deleting factory:', error);
    handleError(error, { fallbackKey: 'factoryManagement.deleteError' });
}
```

### Rethrow for form/modal flow

If a modal or form component needs the promise to reject to keep itself open, rethrow.

```ts
try {
    await FactoryService.createFactory(data);
    toast.success(t('factoryManagement.form.createSuccess'));
    await fetchFactoryData();
} catch (error) {
    handleError(error, { fallbackKey: 'factoryManagement.form.createError' });
    throw error;
}
```

Do not rethrow when the caller does not need it.

## Confirmation Flow Pattern

Use this pattern when submit/delete requires confirmation.

```ts
const handleSubmit = async (data: ProductFormData, mode: 'create' | 'edit') => {
    setConfirmModalState({
        open: true,
        type: mode,
        pendingAction: () => executeSubmit(data, mode),
    });

    throw new Error('CONFIRMATION_PENDING');
};

const handleConfirmAction = async () => {
    if (!confirmModalState.pendingAction) return;

    try {
        setConfirmModalState((prev) => ({ ...prev, open: false }));
        await confirmModalState.pendingAction();
        setModalState((prev) => ({ ...prev, open: false }));
    } catch {
        // Error already handled in pending action.
    } finally {
        setConfirmModalState({ open: false, type: 'create', pendingAction: null });
    }
};
```

Rules:

- `handleSubmit` sets pending action and throws `CONFIRMATION_PENDING` only if `EntityFormModal` expects that pattern.
- `executeSubmit` owns actual API call and error handling.
- Do not close form modal until pending action succeeds.
- Reset confirm modal in `finally`.

## Early Return Style

Prefer early return over nested `if`.

Correct:

```ts
const handleRestoreMachine = async (machine: Machine) => {
    if (!checkPermission('restore', 'machine')) return;
    if (!machine.machineId) return;
    if (!machine.auditMetaData?.deleted) return;

    await MachineService.restoreMachine(machine.machineId);
};
```

Incorrect:

```ts
const handleRestoreMachine = async (machine: Machine) => {
    if (checkPermission('restore', 'machine')) {
        if (machine.machineId) {
            if (machine.auditMetaData?.deleted) {
                await MachineService.restoreMachine(machine.machineId);
            }
        }
    }
};
```

## Naming Rules

- Async data loaders: `fetchMachineData`, `loadOrderDetail`, `refetchProducts`.
- User actions: `handleCreateMachine`, `handleEditMachine`, `handleDeleteMachine`, `handleConfirmAction`.
- Actual submit implementation: `executeSubmit`, `executeDelete`, `executeRestore`.
- Boolean state: `isLoading`, `isSubmitting`, `isMobile`, `hasAnyAction`, `canCreateMachine`.
- Error state: `error`, `errorMessage`, `setError`.
- Modal state: `modalState`, `confirmModalState`, `viewModalState`.

Avoid vague names:

```ts
const data = await service.get();
const handleClick = async () => {};
const submit = false;
```

Prefer domain names:

```ts
const machines = await MachineService.getAllMachines();
const handleDeleteMachine = async () => {};
const isSubmitting = false;
```

## Common Review Findings

Flag these issues during review:

- New code uses `.then().catch()`.
- Loading can stay true after failure.
- Service catches error only to return `null`.
- Service shows toast or redirects.
- Page catches error but has no fallback translation key.
- Mutation closes modal even when API fails.
- Handler mutates data without permission check.
- Dispatch flow uses `.then()` instead of `await`.
- A catch block is empty.
- `console.log` debug remains.
- State is updated from stale closure instead of functional setState.
