# Qwaste v2 - Rule cho thực tập sinh

Tài liệu này là quy tắc làm việc khi tham gia project Qwaste v2. Đọc trước khi code, và dùng như checklist trước khi gửi pull request.

## 1. Tổng quan project

- Project là ứng dụng Next.js App Router, TypeScript, React 18.
- UI chính dùng Ant Design, icon dùng `@ant-design/icons` hoặc `lucide-react` nếu khu vực đang dùng lucide.
- State dùng Redux Toolkit trong `src/stores`, một số phần UI/local preference dùng Zustand, một số phần dùng context hoặc hook riêng.
- API đi qua BFF route `/api/bff`, không gọi backend thật trực tiếp từ component.
- Phân quyền dùng CASL qua `AbilityContext`, `PERMISSION_REGISTRY`, `routeAccess`.
- Đa ngôn ngữ dùng `react-i18next`, file dịch nằm trong `src/locales/{vi,en,ch}/common.json`.

## 2. Cấu trúc thư mục cần nắm

- `src/app`: route theo Next.js App Router.
  - `src/app/(auth)`: trang login/register.
  - `src/app/(dashboard)`: dashboard admin/operator, đã có layout kiểm tra đăng nhập và route access.
  - `src/app/api/bff`: proxy API qua BFF.
- `src/components`: component dùng lại toàn app.
- `src/components/shared`: component dùng chung như header, modal, filter, form modal, empty state.
- `src/services`: service gọi API. Mỗi domain nên có service riêng.
- `src/types`: type/interface theo domain.
- `src/configs`: cấu hình theme, permission, navigation, mock data.
- `src/hooks`: hook dùng lại.
- `src/contexts`: provider/context như auth, error, ability, websocket.
- `src/utils`: helper thuần, dễ test.

## 3. Quy tắc làm việc hằng ngày

- Luôn chạy project bằng `npm run dev` khi phát triển UI.
- Trước khi gửi PR, chạy ít nhất:
  - `npm run lint:check`
  - `npm test`
  - `npm run build` nếu thay đổi route, config, API, auth, permission hoặc code dùng server/client boundary.
- Không sửa file không liên quan tới task.
- Không commit `.env`, `.next`, `node_modules`, coverage hoặc file build output.
- Không tự đổi kiến trúc lớn nếu task chỉ yêu cầu sửa nhỏ.

## 4. TypeScript và coding style

- Dùng TypeScript rõ ràng. Ưu tiên type trong `src/types` thay vì tự khai báo lặp lại trong component.
- Import bằng alias `@/...` hoặc alias đã có trong `tsconfig.json`.
- Format theo `.prettierrc.json`:
  - 4 spaces
  - single quote
  - semicolon
  - print width 100
- Không dùng `var`.
- Hạn chế `any`. ESLint đang cho phép `any`, nhưng chỉ dùng khi API chưa ổn định hoặc type bên ngoài quá khó kiểm soát.
- Nếu có biến chưa dùng nhưng cần giữ, đặt prefix `_`.
- Comment chỉ viết khi logic khó hiểu; không comment lại điều code đã nói rõ.

## 5. Code convention bắt buộc

Đây là phần intern cần làm đúng khi viết code hằng ngày. Nếu code review thấy khác convention này, phải sửa trước khi merge.

### Async/await thay vì `.then`

- Dùng `async/await` với `try/catch/finally` cho API call, submit form, delete, restore, fetch data.
- Không dùng chuỗi `.then().catch()` trong component/service mới.
- `finally` dùng để tắt loading, dù API thành công hay thất bại.
- Trong codebase có vài đoạn cũ còn dùng `.then()` sau `dispatch`. Không copy pattern đó cho code mới.

Đúng:

```ts
const fetchMachineTypeData = async () => {
    try {
        setLoading(true);
        const response = await MachineTypeService.getAllMachineTypes();
        setMachineTypeData(response);
    } catch (error) {
        console.error('Error fetching machine type data:', error);
        toast.error(t('machineTypeManagement.fetchError'));
    } finally {
        setLoading(false);
    }
};
```

Sai:

```ts
MachineTypeService.getAllMachineTypes()
    .then((response) => {
        setMachineTypeData(response);
    })
    .catch((error) => {
        toast.error('Fetch error');
    });
```

### Không dùng `.then` sau `dispatch`

- Nếu cần chờ Redux async action chạy xong, dùng `await dispatch(...)`.
- Handler có `await` thì function phải là `async`.
- Nếu cần mở modal sau khi load detail, chờ load xong bằng `await`.

Đúng:

```ts
const handleEditOrder = async (order: OrderSummaryResponse) => {
    if (!canEditOrder) return;
    if (order.orderStatus !== 'REVIEWING') return;

    try {
        await dispatch(orderActions.fetchOrderDetail(order.orderId));
        dispatch(orderActions.openOrderForm('edit', order.orderId));
    } catch (error) {
        console.error('Error preparing order edit:', error);
        toast.error(t('orderManagement.form.fetchDetailError'));
    }
};
```

Sai:

```ts
const handleEditOrder = (order: OrderSummaryResponse) => {
    dispatch(orderActions.fetchOrderDetail(order.orderId)).then(() => {
        dispatch(orderActions.openOrderForm('edit', order.orderId));
    });
};
```

### Try/catch theo từng layer

Mỗi layer xử lý lỗi khác nhau. Không phải chỗ nào cũng catch giống nhau.

**Service layer**

- Service thường không cần `try/catch`.
- Service để lỗi tự throw lên component/store.
- Service chỉ `try/catch` nếu cần normalize lỗi đặc biệt, cleanup tài nguyên, hoặc đổi format response.
- Service không toast, không setState, không dispatch.

Đúng:

```ts
static async getOrderById(orderId: string): Promise<OrderResponse> {
    const response = await NetworkService.requestJson<OrderResponse>({
        method: 'GET',
        url: ENDPOINTS.ORDERS.DETAIL(orderId),
    });

    return response.result as OrderResponse;
}
```

Sai:

```ts
static async getOrderById(orderId: string): Promise<OrderResponse | null> {
    try {
        const response = await axios.get(`/orders/${orderId}`);
        toast.success('Loaded');
        return response.data;
    } catch (error) {
        toast.error('Failed');
        return null;
    }
}
```

**Component/page layer**

- Component bắt lỗi để hiển thị toast/modal hoặc giữ UI state.
- Component không tự parse response backend nếu service đã làm.
- Component phải dùng fallback translation key.

Đúng:

```ts
const handleDeleteMachineType = async (machineType: MachineType) => {
    if (!checkPermission('delete', 'machine_type')) return;

    try {
        await MachineTypeService.deleteMachineType(machineType.machineTypeId);
        toast.success(t('machineTypeManagement.deleteSuccess'));
        await fetchMachineTypeData();
    } catch (error) {
        console.error('Error deleting machine type:', error);
        toast.error(getApiErrorMessage(error, t('machineTypeManagement.deleteError')));
    }
};
```

**Redux action layer**

- Redux async action bắt lỗi để dispatch `setError`.
- Action có loading thì set loading trong `try/finally`.
- Action create/update/delete có thể return `{ success, error }` hoặc `boolean` nếu component cần biết kết quả.
- Không toast trong Redux action, trừ module realtime/notification đã có lý do UI-wide rõ ràng.

Đúng:

```ts
updateOrder: (payload: OrderUpdationRequest) => async (dispatch: Dispatch) => {
    dispatch(slice.actions.setSubmitting(true));

    try {
        await OrderService.updateOrder(payload);
        dispatch(orderActions.fetchOrders());
        dispatch(orderActions.fetchOrderDetail(payload.orderId));
        return { success: true };
    } catch (error) {
        const errorMessage = getApiErrorMessage(error, 'Failed to update order');
        dispatch(slice.actions.setError(errorMessage));
        return { success: false, error: errorMessage };
    } finally {
        dispatch(slice.actions.setSubmitting(false));
    }
};
```

### Naming phải theo domain + action

- Tên biến/function phải nói rõ domain đang xử lý.
- Không dùng tên quá chung nếu trong file có nhiều domain.
- Với CRUD, đặt tên theo `{action}{Domain}`.

Nên dùng:

```ts
const fetchMachineTypeData = async () => {};
const handleCreateMachineType = async () => {};
const handleEditMachineType = (machineType: MachineType) => {};
const handleDeleteMachineType = async (machineType: MachineType) => {};
const filteredMachineTypeData = useMemo(() => [], []);
```

Không nên dùng:

```ts
const fetchData = async () => {};
const handleCreate = async () => {};
const handleEdit = (item: any) => {};
const filteredData = [];
```

Ngoại lệ: trong component rất nhỏ chỉ có một domain, có thể dùng `handleSubmit`, `handleCancel`, `loading`.

### Đặt tên boolean

- Boolean phải đọc như câu hỏi đúng/sai.
- Dùng `is...`, `has...`, `can...`, `should...`.

Đúng:

```ts
const isMobile = !screens.md;
const isSubmitting = false;
const hasAnyAction = canView || canUpdate || canDelete;
const canCreateOrder = checkPermissionSilent('create', 'order');
const shouldShowAuditInfo = isEditMode && auditMetaData;
```

Sai:

```ts
const mobile = !screens.md;
const submit = false;
const action = canView || canUpdate || canDelete;
const createOrder = checkPermissionSilent('create', 'order');
```

### Đặt tên state modal/form

- Nếu modal chỉ có open/close đơn giản, dùng `is{Name}Open`.
- Nếu modal có nhiều state như mode/data/loading, gom thành `{name}State`.
- State object nên có shape rõ ràng và initial value đầy đủ.

Đúng:

```ts
const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: MachineType | null;
}>({
    open: false,
    mode: 'create',
    data: null,
});

const [viewModalState, setViewModalState] = useState<{
    open: boolean;
    loading: boolean;
    data: MachineType | null;
}>({
    open: false,
    loading: false,
    data: null,
});
```

Sai:

```ts
const [open, setOpen] = useState(false);
const [mode, setMode] = useState('create');
const [data, setData] = useState<any>(null);
const [loading, setLoading] = useState(false);
```

Nếu trong page có nhiều modal, cách sai bên trên rất dễ gây nhầm `open`/`loading` thuộc modal nào.

### Đặt tên response/data

- Trong service, `response` là response từ `NetworkService`.
- Trong component, đặt tên theo domain, không giữ tên `response` nếu nó là dữ liệu đã normalize.

Đúng:

```ts
const machineTypes = await MachineTypeService.getAllMachineTypes();
setMachineTypeData(machineTypes);
```

Sai:

```ts
const response = await MachineTypeService.getAllMachineTypes();
setData(response);
```

### Thứ tự code trong page/component

Page/component nên tổ chức theo thứ tự này để reviewer dễ đọc:

1. Hook hệ thống: `useTranslation`, `usePageTitle`, router, breakpoint.
2. Auth/permission: `useAuth`, `useAbility`, `usePermissionCheck`.
3. Redux/local state.
4. Derived values: `isMobile`, `canCreate`, `canEdit`, stats.
5. Data loading function: `fetch...`, `load...`.
6. `useEffect`.
7. Handlers: `handle...`.
8. `useMemo` cho columns/filter nếu phụ thuộc handler.
9. Render helper nhỏ nếu cần.
10. JSX return.

Ví dụ skeleton:

```tsx
const MachineTypeListPage = () => {
    const { t } = useTranslation();
    usePageTitle(t('pageTitle.machineTypeList'));

    const { checkPermission, checkPermissionSilent } = usePermissionCheck();
    const ability = useAbility();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [loading, setLoading] = useState(true);
    const [machineTypeData, setMachineTypeData] = useState<MachineType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMachineTypeData = useCallback(async () => {
        try {
            setLoading(true);
            const machineTypes = await MachineTypeService.getAllMachineTypes();
            setMachineTypeData(machineTypes);
        } catch (error) {
            toast.error(getApiErrorMessage(error, t('machineTypeManagement.fetchError')));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchMachineTypeData();
    }, [fetchMachineTypeData]);

    const handleCreateMachineType = () => {
        if (!checkPermission('create', 'machine_type')) return;
        // open modal
    };

    const filteredMachineTypeData = useMemo(() => {
        // filter data
    }, [machineTypeData, searchTerm]);

    return <>{/* JSX */}</>;
};
```

### Handler convention

- Handler user action luôn bắt đầu bằng `handle`.
- Handler phải tự check permission nếu action có quyền.
- Handler không nên chứa JSX lớn.
- Handler async phải có `try/catch` nếu gọi API trực tiếp.
- Nếu handler chỉ dispatch Redux action đã tự xử lý lỗi, vẫn nên `await` nếu flow phụ thuộc kết quả.

Đúng:

```ts
const handleRestoreOrder = async (orderId: string) => {
    if (!canRestoreOrder) return;

    const success = await dispatch(orderActions.restoreOrder(orderId));
    if (!success) return;

    toast.success(t('orderManagement.list.messages.restoreSuccess'));
};
```

### Function return convention

- Function kiểm tra điều kiện trả về boolean nên đặt `is/has/can/should`.
- Function format trả về string nên đặt `format...`.
- Function map/normalize trả về object mới nên đặt `map...` hoặc `normalize...`.
- Function fetch/load trả về Promise và có side effect set state/store.

Ví dụ:

```ts
const isOrderEditable = (order: OrderSummaryResponse) => order.orderStatus === 'REVIEWING';
const formatOrderDate = (date: string) => dayjs(date).format('DD/MM/YYYY');
const normalizeNotification = (item: NotificationApiItem): Notification => ({ ... });
const fetchOrders = async () => {};
```

### Không trộn business logic vào JSX

- Logic dài nên đưa ra biến/helper trước `return`.
- JSX chỉ nên mô tả UI.

Đúng:

```ts
const isDeleted =
    order.softDeleteMetaData?.isDeleted || (order.softDeleteMetaData as any)?.deleted;
const canShowRestore = isDeleted && canRestoreOrder;
```

```tsx
{canShowRestore && (
    <Button icon={<UndoOutlined />} onClick={() => handleRestoreOrder(order.orderId)} />
)}
```

Sai:

```tsx
{(order.softDeleteMetaData?.isDeleted || (order.softDeleteMetaData as any)?.deleted) &&
    canRestoreOrder &&
    order.orderStatus !== 'COMPLETED' &&
    order.orderStatus !== 'CANCELLED' && (
        <Button onClick={() => dispatch(orderActions.restoreOrder(order.orderId))} />
    )}
```

### Early return thay vì nested `if`

- Ưu tiên return sớm để code dễ đọc.
- Không bọc logic chính trong quá nhiều lớp `if`.

Đúng:

```ts
const handleEditMachineType = (machineType: MachineType) => {
    if (!checkPermission('update', 'machine_type')) return;

    setModalState({
        open: true,
        mode: 'edit',
        data: machineType,
    });
};
```

Sai:

```ts
const handleEditMachineType = (machineType: MachineType) => {
    if (checkPermission('update', 'machine_type')) {
        setModalState({
            open: true,
            mode: 'edit',
            data: machineType,
        });
    }
};
```

### Loading state phải có `finally`

- Bất kỳ function nào `setLoading(true)` phải có `finally` để `setLoading(false)`.
- Không set loading false ở cả `try` và `catch` riêng lẻ.

Đúng:

```ts
try {
    setLoading(true);
    await OrderService.confirmOrder(orderId);
    toast.success(t('orderManagement.confirmSuccess'));
} catch (error) {
    toast.error(getApiErrorMessage(error, t('orderManagement.confirmError')));
} finally {
    setLoading(false);
}
```

Sai:

```ts
setLoading(true);
try {
    await OrderService.confirmOrder(orderId);
    setLoading(false);
} catch (error) {
    setLoading(false);
}
```

### Handler phải bắt đầu bằng `handle`

- Function xử lý event/user action đặt tên `handle...`.
- Function gọi API để load data đặt tên `fetch...` hoặc `load...`.
- Function chuyển đổi dữ liệu đặt tên `map...`, `normalize...`, `format...`.

Ví dụ:

```ts
const fetchOrderData = async () => {};
const handleCreateOrder = async () => {};
const handleCancelConfirm = () => {};
const normalizeNotification = (item: NotificationApiItem) => {};
const formatDateTime = (value: string) => {};
```

### Service không hiển thị toast

- Service chỉ gọi API, map dữ liệu và throw error tự nhiên.
- Toast, modal, redirect, setState nằm ở component/hook.
- Không import `toast`, `router`, React hook vào service.

Đúng:

```ts
export class MachineTypeService {
    static async deleteMachineType(machineTypeId: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.MACHINE_TYPES.DETAIL(machineTypeId),
        });

        return response.result;
    }
}
```

Sai:

```ts
export class MachineTypeService {
    static async deleteMachineType(machineTypeId: number): Promise<void> {
        await NetworkService.requestJson({ method: 'DELETE', url: `/api/machineTypes/${machineTypeId}` });
        toast.success('Deleted');
    }
}
```

### Component không gọi axios trực tiếp

- Không import `axios` hoặc `apiClient` trong page/component.
- Page/component chỉ gọi service.
- Service gọi `NetworkService`.
- `NetworkService` gọi `apiClient`.

Đúng:

```ts
const machines = await MachineService.getAllMachines();
```

Sai:

```ts
const machines = await axios.get('/api/bff/api/machines/v1');
```

### Error message phải có fallback

- Khi hiển thị lỗi API, dùng `getApiErrorMessage(error, fallback)`.
- Fallback phải lấy từ i18n nếu là text user nhìn thấy.

Đúng:

```ts
toast.error(getApiErrorMessage(error, t('machineTypeManagement.deleteError')));
```

Sai:

```ts
toast.error(error.message);
toast.error('Delete failed');
```

### Không hardcode text trong JSX

- Text hiển thị cho user phải dùng `t('...')`.
- Chỉ được hardcode text kỹ thuật không hiển thị, ví dụ key, enum, console error phục vụ debug.

Đúng:

```tsx
<Button>{t('common.save')}</Button>
```

Sai:

```tsx
<Button>Save</Button>
```

### JSX condition convention

- Dùng early return cho màn hình loading/empty lớn.
- Dùng `&&` cho render có/không đơn giản.
- Dùng ternary khi có đúng 2 nhánh UI rõ ràng.
- Nếu JSX condition quá dài, tách thành biến hoặc component nhỏ.

Đúng:

```tsx
if (loading) {
    return <FullPageLoader message={t('common.loading')} />;
}

return (
    <>
        {canCreate && <Button icon={<PlusOutlined />}>{t('common.create')}</Button>}
        {data.length > 0 ? <Table dataSource={data} /> : <EmptyState />}
    </>
);
```

Sai:

```tsx
return loading ? (
    <FullPageLoader message="Loading..." />
) : data.length > 0 ? (
    canCreate ? (
        <Table dataSource={data} />
    ) : (
        <div>No permission</div>
    )
) : (
    <div>No data</div>
);
```

### Hook dependency phải đầy đủ

- `useEffect`, `useMemo`, `useCallback` phải khai báo dependency đầy đủ.
- Nếu function dùng trong dependency nhiều nơi, bọc bằng `useCallback`.
- Không bỏ dependency chỉ để tránh chạy lại nếu chưa hiểu nguyên nhân.

Đúng:

```ts
const handleDelete = useCallback(
    async (machineType: MachineType) => {
        if (!checkPermission('delete', 'machine_type')) return;
        await MachineTypeService.deleteMachineType(machineType.machineTypeId);
        await fetchMachineTypeData();
    },
    [checkPermission, fetchMachineTypeData]
);
```

Sai:

```ts
const handleDelete = useCallback(async (machineType: MachineType) => {
    await MachineTypeService.deleteMachineType(machineType.machineTypeId);
}, []);
```

### Không mutate state trực tiếp

- Khi cập nhật array/object trong state, luôn tạo object/array mới.

Đúng:

```ts
setNotifications((prev) =>
    prev.map((item) =>
        item.notificationId === notificationId ? { ...item, isRead: true } : item
    )
);
```

Sai:

```ts
notifications[0].isRead = true;
setNotifications(notifications);
```

### Derived data dùng `useMemo`

- Dữ liệu filter/sort/search từ state nên dùng `useMemo`.
- Không filter/sort trực tiếp nhiều lần trong JSX.

Đúng:

```ts
const filteredMachineTypeData = useMemo(() => {
    if (!searchTerm.trim()) return machineTypeData;

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return machineTypeData.filter((machineType) =>
        machineType.machineTypeName.toLowerCase().includes(lowerSearchTerm)
    );
}, [machineTypeData, searchTerm]);
```

Sai:

```tsx
<Table
    dataSource={machineTypeData.filter((item) =>
        item.machineTypeName.toLowerCase().includes(searchTerm.toLowerCase())
    )}
/>
```

### Form submit convention

- Submit form phải là `async`.
- Validate ở form config/schema trước, không validate toàn bộ trong submit nếu field-level rule làm được.
- Submit thành công thì toast success, refresh data, đóng modal.
- Submit thất bại thì toast error, throw lại error nếu modal cần giữ trạng thái.

Đúng:

```ts
const executeSubmit = async (data: MachineTypeFormData, mode: 'create' | 'edit') => {
    try {
        if (mode === 'create') {
            await MachineTypeService.createMachineType(data);
            toast.success(t('machineTypeManagement.form.createSuccess'));
        } else {
            await MachineTypeService.updateMachineType(data);
            toast.success(t('machineTypeManagement.updateSuccess'));
        }

        await fetchMachineTypeData();
    } catch (error) {
        toast.error(getApiErrorMessage(error, t('machineTypeManagement.updateError')));
        throw error;
    }
};
```

### Table column convention

- Columns nên tách ra file riêng nếu table có action/render phức tạp.
- Column factory nhận `props` gồm handler, `t`, `ability`.
- Action column chỉ hiện nếu có ít nhất một quyền.
- Date render bằng `dayjs`, có fallback `-`.
- Text dài dùng `Tooltip` + ellipsis.

Đúng:

```ts
export const getMachineTypeTableColumns = (
    props: MachineTypeTableColumnProps
): ColumnsType<MachineType> => {
    const { t, ability } = props;
    const canUpdate = ability?.can('update', 'machine_type') ?? false;

    return [
        {
            title: () => t('machineTypeManagement.table.headers.machineTypeName'),
            dataIndex: 'machineTypeName',
            key: 'machineTypeName',
        },
        ...(canUpdate
            ? [
                  {
                      title: () => t('common.actions'),
                      key: 'actions',
                      render: (_, record) => (
                          <Button onClick={() => props.onEdit?.(record)}>
                              {t('common.edit')}
                          </Button>
                      ),
                  },
              ]
            : []),
    ];
};
```

### Console convention

- Không để `console.log` trong code merge.
- `console.error` được dùng trong catch nếu giúp debug.
- Message console nên có context rõ.

Đúng:

```ts
console.error('Error deleting machine type:', error);
```

Sai:

```ts
console.log(data);
console.log('aaa');
```

### Null/undefined fallback

- UI phải có fallback khi dữ liệu có thể thiếu.
- Dùng `??` cho fallback null/undefined.
- Dùng `||` khi muốn fallback cả chuỗi rỗng.

Ví dụ:

```tsx
<Descriptions.Item label={t('common.description')}>
    {machine.description || '-'}
</Descriptions.Item>

<Text>{unreadCount ?? 0}</Text>
```

### Không dùng magic number/string lặp lại

- Nếu một string/number dùng nhiều lần, đưa thành constant.
- Endpoint đưa vào `ENDPOINTS`.
- Permission string phải có trong `caslAbility.ts` và `permissionRegistry.ts`.

Đúng:

```ts
const DEFAULT_PAGE_SIZE = 10;

pagination={{
    defaultPageSize: DEFAULT_PAGE_SIZE,
}}
```

Sai:

```ts
pagination={{
    defaultPageSize: 10,
}}
```

### Redux Toolkit convention

Project hiện đang dùng Redux Toolkit cho một số domain/global state trong `src/stores`.

- Chỉ dùng Redux khi state cần chia sẻ giữa nhiều component/page, có websocket update, domain cache, filter global hoặc workflow phức tạp.
- Không đưa state local của một modal/form nhỏ vào Redux.
- Không gọi `useDispatch`/`useSelector` trực tiếp. Dùng typed hook:
  - `useAppDispatch`
  - `useAppSelector`
- Slice đặt trong `src/stores/{Domain}Store.ts`.
- State interface đặt tên `I{Domain}StoreState`.
- Slice name dùng camelCase domain:
  - `machine`
  - `notification`
  - `factoryOverview`
  - `drawingCode`
  - `order`
- Export reducer theo pattern:

```ts
export const { reducer } = slice;
```

- Export actions bằng object `{domain}Actions`.
- Nếu thêm store mới, phải register trong `src/stores/index.ts` và interface `AppState`.
- Async action hiện theo pattern thunk thủ công: action trả về function `(dispatch) => async ...`.
- Async action dùng `try/catch/finally`, không dùng `.then`.
- Reducer được phép viết kiểu mutate vì Redux Toolkit dùng Immer.
- Ngoài reducer Redux, không mutate state trực tiếp.

Đúng khi dùng Redux trong component:

```ts
const dispatch = useAppDispatch();
const { machines, isFetching, selectedTimePeriod } = useAppSelector((state) => state.machine);

useEffect(() => {
    if (!spaceId) return;

    dispatch(machineActions.fetchMachines(spaceId, selectedTimePeriod));
}, [dispatch, spaceId, selectedTimePeriod]);
```

Sai:

```ts
const dispatch = useDispatch();
const machineState = useSelector((state: any) => state.machine);

MachineService.getMachinesWithLogs(spaceId, 'TODAY').then((machines) => {
    dispatch({ type: 'machine/setMachines', payload: machines });
});
```

Đúng trong store:

```ts
export const machineActions = {
    fetchMachines:
        (spaceId: number, timePeriod: TimePeriod = 'TODAY') =>
            async (dispatch: Dispatch) => {
                dispatch(slice.actions.setFetching(true));

                try {
                    const machines = await MachineService.getMachinesWithLogs(
                        spaceId,
                        timePeriod
                    );
                    dispatch(slice.actions.setMachines(machines));
                } catch (error) {
                    console.error('Error fetching machines:', error);
                    dispatch(slice.actions.setError('Failed to load machines'));
                } finally {
                    dispatch(slice.actions.setFetching(false));
                }
            },
};
```

Sai:

```ts
export const machineActions = {
    fetchMachines: (spaceId: number) => {
        return MachineService.getMachinesWithLogs(spaceId, 'TODAY').then((machines) => {
            slice.actions.setMachines(machines);
        });
    },
};
```

### Redux state shape convention

- State nên chia nhóm rõ:
  - loading state: `isFetching`, `isLoadingFactories`
  - data: `machines`, `notifications`
  - filters/search: `selectedTimePeriod`, `searchText`
  - modal/detail: `selectedMachine`, `isModalOpen`
  - error: `error`
- Boolean trong Redux nên dùng `is...` hoặc `has...`.
- Error trong store nên là `string | null`.
- Reset action nên đặt `reset{Domain}State`.
- Set action đơn giản dùng `set{Name}`:
  - `setFetching`
  - `setMachines`
  - `setUnreadCount`
- Update action dùng `update{Name}`:
  - `updateMachine`
  - `updateMachinesPower`
- Không lưu `Promise`, class instance, DOM node, function hoặc object không serialize được vào Redux.
- Nếu bắt buộc lưu dữ liệu đặc biệt, phải kiểm tra `serializableCheck` trong `configureStore.ts`.

### Redux vs local state

Dùng local state khi:

- State chỉ dùng trong một component/page.
- Modal open/close chỉ thuộc page đó.
- Search/filter chỉ ảnh hưởng một table local.
- Form draft chưa cần chia sẻ ra ngoài.

Dùng Redux khi:

- Nhiều component ở nhiều nhánh cần cùng dữ liệu.
- Dữ liệu được websocket cập nhật.
- Cần giữ filter/selection khi đi qua nhiều component.
- Dashboard nhiều widget dùng chung một nguồn dữ liệu.
- State là domain workflow như order, machine, notification.

Ví dụ local state đúng:

```ts
const [searchTerm, setSearchTerm] = useState('');
const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: MachineType | null;
}>({ open: false, mode: 'create', data: null });
```

Không nên đưa các state này vào Redux nếu chỉ dùng trong page hiện tại.

### Zustand convention

Project có Zustand cho một số UI state như `UIStore.ts` và `useUserStore.ts`.

- Chỉ dùng Zustand cho UI preference/state nhẹ, không phải domain data chính.
- Không dùng Zustand thay thế Redux trong module đang dùng Redux.
- Không tạo store mới nếu local state đủ dùng.
- Zustand store đặt tên hook `use{Domain}Store`.
- State và actions nằm cùng store.
- Action đặt tên theo hành động rõ ràng:
  - `openAddTaskForm`
  - `closeAddTaskForm`
  - `setTasksViewMode`
  - `reset`
- Khi update object/array trong Zustand, tạo object/array mới.
- Không gọi API phức tạp trong Zustand store nếu flow đó thuộc service/Redux/domain workflow.

Đúng:

```ts
const tasksViewMode = useUIStore((state) => state.tasksViewMode);
const setTasksViewMode = useUIStore((state) => state.setTasksViewMode);
```

Sai:

```ts
const uiStore = useUIStore();
```

Lý do: lấy cả store dễ làm component re-render khi state không liên quan thay đổi.

### TanStack Query convention

Hiện tại project chưa cài và chưa dùng TanStack Query (`@tanstack/react-query`). Vì vậy:

- Không tự thêm TanStack Query vào feature mới nếu chưa được mentor/team duyệt.
- Không trộn TanStack Query với Redux cho cùng một domain data.
- Nếu module hiện đang dùng service + local state hoặc service + Redux, tiếp tục giữ pattern đó.
- Nếu team quyết định thêm TanStack Query sau này, phải thêm provider/query client ở app root và thống nhất convention trước khi dùng rộng.

Nếu sau này được phép dùng TanStack Query, convention đề xuất:

- Query key đặt thành constant hoặc factory, không viết rải rác:

```ts
export const machineQueryKeys = {
    all: ['machines'] as const,
    list: (spaceId: number) => [...machineQueryKeys.all, 'list', spaceId] as const,
    detail: (machineId: string) => [...machineQueryKeys.all, 'detail', machineId] as const,
};
```

- `useQuery` chỉ dùng cho GET/read data.
- `useMutation` dùng cho create/update/delete/restore.
- Query function vẫn gọi service, không gọi `axios` trực tiếp.
- Error/success toast cho mutation xử lý trong hook/component, không nằm trong service.
- Sau mutation thành công phải `invalidateQueries` đúng query key.
- Không copy server data từ TanStack Query vào Redux trừ khi có lý do rất rõ.

Đúng nếu TanStack Query được duyệt:

```ts
const machinesQuery = useQuery({
    queryKey: machineQueryKeys.list(spaceId),
    queryFn: () => MachineService.getAllMachinesInList(spaceId),
    enabled: Boolean(spaceId),
});

const deleteMachineMutation = useMutation({
    mutationFn: MachineService.deleteMachine,
    onSuccess: async () => {
        toast.success(t('machineManagement.deleteSuccess'));
        await queryClient.invalidateQueries({ queryKey: machineQueryKeys.all });
    },
    onError: (error) => {
        toast.error(getApiErrorMessage(error, t('machineManagement.deleteError')));
    },
});
```

Sai:

```ts
const query = useQuery({
    queryKey: ['data'],
    queryFn: () => axios.get('/api/machines'),
});

useEffect(() => {
    dispatch(machineActions.setMachines(query.data));
}, [query.data]);
```

## 6. Naming convention

### File và folder

- Route page dùng đúng convention của Next.js:
  - `page.tsx` cho page.
  - `layout.tsx` cho layout.
  - `loading.tsx`, `not-found.tsx` nếu cần state đặc biệt.
- Component dùng PascalCase:
  - `ResponsivePageHeader.tsx`
  - `NotificationDropdown.tsx`
  - `OrderDetailDrawer.tsx`
- Hook dùng camelCase và bắt đầu bằng `use`:
  - `usePageTitle.tsx`
  - `useApiErrorHandler.ts`
  - `usePermissionCheck.ts`
- Service dùng PascalCase + hậu tố `Service`:
  - `MachineService.ts`
  - `NotificationService.ts`
  - `OrderService.ts`
- Type domain dùng PascalCase theo tên domain:
  - `Machine.ts`
  - `Order.ts`
  - `Notification.ts`
- Component riêng của một page đặt trong `_components` ngay dưới route đó.
- Test đặt cạnh module hoặc trong `_tests`, tên `*.test.ts` hoặc `*.test.tsx`.
- File config form nên đặt dạng `{domain}FormConfig.ts` hoặc `{domain}FormConfig.tsx`.
- File column table nên đặt `Columns.tsx` hoặc `Column.tsx`, giữ theo pattern folder đang sửa.

### Component và function

- Component React dùng PascalCase:
  - `MachineTypeListPage`
  - `OrderFormContainer`
  - `NotificationItem`
- Function/helper thường dùng camelCase:
  - `normalizeNotification`
  - `getApiErrorMessage`
  - `formatKeyArgs`
- Function factory/getter dùng tiền tố `get`:
  - `getMachineTypeTableColumns`
  - `getMachineTypeFormFields`
  - `getMenuItems`
- Handler event dùng tiền tố `handle`:
  - `handleSubmit`
  - `handleDeleteMachineType`
  - `handleConfirmAction`
- Function gọi API trong service nên diễn đạt hành động rõ ràng:
  - `getAllMachines`
  - `getMachineById`
  - `createMachine`
  - `updateMachine`
  - `deleteMachine`
  - `restoreMachine`

### State và variable

- State boolean dùng tiền tố rõ nghĩa:
  - `loading`, `isLoading`
  - `open`, `isMobile`
  - `hasNext`, `hasAccess`
- State modal nên gom thành object nếu modal có nhiều thuộc tính:
  - `modalState`
  - `confirmModalState`
  - `viewModalState`
- Danh sách data dùng hậu tố `Data` hoặc plural noun:
  - `machineTypeData`
  - `notifications`
  - `selectedRowKeys`
- Giá trị filter/search dùng tên đúng mục đích:
  - `searchTerm`
  - `lastCreatedAt`
  - `lastId`
- Không đặt tên mơ hồ như `data1`, `temp`, `abc`, `res` nếu có thể đặt rõ hơn.

### Type và interface

- Type chính của entity đặt theo domain:
  - `Machine`
  - `MachineType`
  - `Notification`
- Type form data dùng hậu tố `FormData`:
  - `MachineTypeFormData`
  - `MachineFormData`
- Type update riêng dùng hậu tố `UpdateFormData` nếu payload update khác create:
  - `MachineUpdateFormData`
- Props type dùng hậu tố `Props`:
  - `EntityFormModalProps`
  - `MachineTypeTableColumnProps`
- API item/response raw từ backend dùng hậu tố rõ nguồn:
  - `NotificationApiItem`
  - `NotificationApiResponse`
  - `NotificationResponse`

### Constant và enum-like value

- Constant export dùng UPPER_SNAKE_CASE nếu là cấu hình dùng chung:
  - `ENDPOINTS`
  - `REFRESH_TOKEN_URL`
  - `PERMISSION_REGISTRY`
- Object config domain có thể dùng PascalCase nếu đang theo pattern file hiện có.
- Key permission dùng format `subject:action`:
  - `machine:view`
  - `order:update_plan`
  - `task_review:decline`
- Subject/action phải khớp `caslAbility.ts`.

## 7. Import/export convention

- Ưu tiên import bằng alias:
  - `@/services/MachineService`
  - `@/types/Machine`
  - `@/components/shared/SearchInput`
- Không import vòng vo nhiều cấp kiểu `../../../../../` nếu alias dùng được.
- Với component hoặc helper dùng lại nhiều nơi, thêm `index.ts` nếu folder đó đã có pattern export barrel.
- Với component chỉ dùng trong một page, import trực tiếp từ `_components`, không export lên shared.
- Thứ tự import nên giữ dễ đọc:
  1. React/Next.
  2. Thư viện ngoài.
  3. Alias nội bộ `@/...`.
  4. Import tương đối trong cùng folder.
- Không import type như value nếu chỉ dùng làm type; có thể dùng `import type` khi phù hợp.

## 8. Route và page convention

- Route admin nằm dưới `src/app/(dashboard)/admin/...`.
- Route operator nằm dưới `src/app/(dashboard)/operator/...`.
- Route auth nằm dưới `src/app/(auth)/...`.
- Folder route dùng kebab-case hoặc camelCase theo route đã có. Khi sửa module cũ, giữ nguyên style folder hiện tại.
- Page component nên đặt tên theo domain + mục đích:
  - `MachineTypeListPage`
  - `OperatorMyReviewsPage`
  - `SettingPage`
- Page nên có các phần chính theo thứ tự:
  1. State/hooks.
  2. Permission/translation/page title.
  3. Handler.
  4. Fetch/load data.
  5. Derived data bằng `useMemo`.
  6. Render JSX.

## 9. Service/API convention

- Endpoint phải khai báo trong `ENDPOINTS`, không rải string endpoint trong nhiều file.
- Với endpoint có id, dùng function:
  - `DETAIL: (id: PathParam) => WITH_PARAM('/api/machines/v1', id)`
  - `RESTORE: (id: PathParam) => '/api/machines/v1/${id}/restoring'`
- Service là class có static method, theo pattern hiện tại:
  - `export class MachineService { static async getAllMachines() { ... } }`
- Service nhận/return type rõ ràng:
  - `Promise<Machine[]>`
  - `Promise<MachineTypeFormData>`
  - `Promise<void>`
- Service chịu trách nhiệm map/normalize response backend.
- Component không biết chi tiết response raw nếu service đã normalize.
- Request JSON dùng `NetworkService.requestJson<T>`.
- Request file/export dùng `NetworkService.requestBlob`.

## 10. UI component convention

- CRUD list page nên tách:
  - `page.tsx`: state, fetch, handler, layout chính.
  - `_components/Column.tsx` hoặc `_components/Columns.tsx`: table columns.
  - `_components/{domain}FormConfig.ts`: field config.
- Button action trong table nên dùng icon + tooltip.
- Nếu action cần quyền, column phải nhận `ability` hoặc handler phải check permission.
- Create/edit form ưu tiên dùng `EntityFormModal`.
- Confirm action quan trọng dùng `ConfirmModal` hoặc `Popconfirm` theo pattern page hiện có.
- Page header dùng `ResponsivePageHeader` nếu là page dashboard.
- Search dùng `SearchInput` nếu search đơn giản.
- Không tạo component shared mới nếu chỉ dùng một page.

## 11. i18n key convention

- Key nên đi theo domain:
  - `machineTypeManagement.title`
  - `machineTypeManagement.form.createTitle`
  - `machineTypeManagement.table.headers.machineTypeName`
  - `machineTypeManagement.actions.delete`
- Text dùng chung đặt trong `common`.
- Sidebar đặt trong `sidebar.navigation`.
- Permission subject label đặt trong `permissionSubjects`.
- Không dùng tiếng Việt/Anh hardcode trong JSX, trừ text debug tạm thời không commit.
- Khi thêm key mới, đặt cùng cấu trúc cho `vi`, `en`, `ch`.

## 12. Git/PR convention

- Tạo branch theo dạng:
  - `feature/{short-task-name}`
  - `fix/{short-bug-name}`
  - `refactor/{short-scope}`
- Commit message nên ngắn, rõ hành động:
  - `fix notification pagination`
  - `add machine type form validation`
  - `update order permission guard`
- Một PR chỉ nên giải quyết một nhóm việc liên quan.
- PR description nên có:
  - Đã làm gì.
  - Cách test.
  - Ảnh/video nếu đổi UI.
  - Rủi ro hoặc phần chưa xử lý.

## 13. Quy tắc Next.js App Router

- Component trong `src/app` mặc định là Server Component. Chỉ thêm `'use client'` khi cần state, effect, browser API, event handler, context client hoặc Ant Design component cần client.
- Không dùng `window`, `localStorage`, `document` ngoài client component/effect.
- Route dashboard phải nằm dưới `src/app/(dashboard)` để dùng layout auth/permission sẵn có.
- Không bypass auth check trong `src/app/(dashboard)/layout.tsx`.
- Khi thêm page mới, kiểm tra cả navigation, permission registry và translation key.

## 14. Quy tắc API/service

- Component không gọi `axios` trực tiếp.
- API mới phải đi theo luồng:
  1. Thêm endpoint vào `src/services/endpoints.ts`.
  2. Tạo/cập nhật service trong `src/services/*Service.ts`.
  3. Gọi API qua `NetworkService.requestJson` hoặc `NetworkService.requestBlob`.
  4. Component chỉ gọi service.
- Không hardcode base URL backend trong component.
- Không tự xử lý refresh token trong từng service. `apiClient.ts` đã xử lý 401, refresh token và queue request.
- Với GET/DELETE, truyền query bằng `data` trong `NetworkService` nếu phù hợp, hoặc build URL rõ ràng như pattern hiện có.
- API trả về `ApiResponse<T>`, service nên return `response.result` hoặc `response.message` đúng mục đích.
- Khi cần normalize dữ liệu backend, làm trong service, không rải logic normalize trong UI.

## 15. Quy tắc xử lý lỗi

- Với UI action, hiển thị lỗi bằng `toast` hoặc `useApiErrorHandler` theo pattern hiện có.
- Dùng `getApiErrorMessage(error, fallback)` khi có fallback text.
- Không nuốt lỗi im lặng. Nếu modal/form cần giữ trạng thái loading, phải có `finally`.
- Không spam `console.log` trong code mới. `console.error` chỉ dùng cho lỗi cần debug.

## 16. Quy tắc permission/RBAC

- Không chỉ ẩn nút bằng UI; action quan trọng phải kiểm tra permission trước khi chạy.
- Dùng:
  - `<Can I="create" a="machine_type">...</Can>` để render theo quyền.
  - `usePermissionCheck()` cho handler.
  - `useAbility()` khi cần build column/menu theo quyền.
- Khi thêm module/quyền mới, cập nhật:
  - `src/configs/permissions/caslAbility.ts`
  - `src/configs/permissions/permissionRegistry.ts`
  - `src/configs/permissions/routeAccess.ts` nếu route cần guard.
  - `src/configs/navigation/menuItems.tsx` nếu cần hiện menu.
  - translation trong `src/locales/*/common.json`.
- Không hardcode role như `admin` để cho phép thao tác nếu hệ thống đã có permission.

## 17. Quy tắc UI Ant Design

- Ưu tiên component có sẵn trong `src/components/shared` trước khi tạo component mới.
- CRUD form nên dùng `EntityFormModal` và file `*_formConfig.ts` nếu phù hợp.
- Danh sách/table nên tách column ra `_components/Columns.tsx` hoặc `Column.tsx` như pattern hiện có.
- Nút thao tác nên có icon, tooltip/aria-label nếu chỉ hiển thị icon.
- Page dashboard nên dùng `ResponsivePageHeader` để desktop/mobile đồng nhất.
- Table nên có `rowKey`, pagination, loading state, empty/fallback state rõ ràng.
- UI mobile phải được kiểm tra bằng breakpoint của Ant Design hoặc component mobile đã có.
- Không hardcode text trực tiếp trong UI nếu text hiển thị cho user; dùng `t('...')`.

## 18. Quy tắc i18n

- Mọi text user nhìn thấy phải dùng translation key.
- Khi thêm key mới, thêm vào cả `vi`, `en`, `ch` nếu màn hình đó hỗ trợ đủ 3 ngôn ngữ.
- Đặt key theo domain hiện có, ví dụ `machineTypeManagement.form.createTitle`.
- Không xóa key cũ nếu chưa kiểm tra toàn repo bằng `rg`.
- Nếu backend trả về `titleKey`, `contentKey` hoặc args, normalize ở service giống `NotificationService`.

## 19. Quy tắc state và data flow

- State chỉ dùng trong component nếu thuộc riêng component đó.
- State dùng chung nhiều màn hình hoặc cần cache/global thì xem `src/stores` trước.
- Không đưa dữ liệu không serialize được vào Redux nếu không cấu hình `serializableCheck`.
- Không mutate trực tiếp state/array/object trong React state.
- Dữ liệu derived nên dùng `useMemo` khi filter/sort trên danh sách lớn hoặc truyền vào table/columns.
- Handler truyền xuống component con nên dùng `useCallback` khi ảnh hưởng render hoặc nằm trong dependency của `useMemo`.

## 20. Quy tắc form

- Validation phải nằm trong form config hoặc schema/hook riêng, không để rải rác.
- Field bắt buộc phải có `required` và rule message.
- Với create/edit dùng chung form, xử lý khác biệt bằng `mode`.
- Khi submit cần confirm, dùng `ConfirmModal` theo pattern hiện có.
- Sau create/update/delete thành công phải refresh data hoặc cập nhật state đúng cách.
- Không đóng modal nếu API fail.

## 21. Quy tắc file upload

- Upload ảnh/PDF phải dùng helper/component hiện có nếu có.
- Không tự gửi file qua endpoint mới khi project đã dùng UploadThing.
- Luôn kiểm tra giới hạn file, type, loading, preview và trạng thái lỗi.

## 22. Quy tắc date/time/number

- Project đang dùng `dayjs` nhiều trong UI; giữ cùng pattern nếu file/module đang dùng `dayjs`.
- Format ngày hiển thị phổ biến: `DD/MM/YYYY HH:mm` hoặc `DD/MM/YYYY HH:mm:ss`.
- Không tự parse date bằng string split nếu có thể dùng `dayjs` hoặc helper sẵn có.
- Số lượng, tiền, thời lượng phải có fallback khi null/undefined.

## 23. Quy tắc test

- Test đặt cạnh module hoặc trong folder `_tests`, tên `*.test.ts` hoặc `*.test.tsx`.
- Utility/helper mới nên có unit test nếu có logic tính toán, mapping, validation.
- Permission parser, form validation, tree mapper, calculation là nhóm bắt buộc cân nhắc test.
- Với component phức tạp, test các hành vi chính: render, empty state, click action, permission visibility.
- Không sửa test để khớp bug nếu chưa hiểu đúng business rule.

## 24. Quy tắc bảo mật

- Không log token, cookie, password, refresh token hoặc payload nhạy cảm.
- Không đọc/ghi trực tiếp cookie auth trong component nếu đã có `AuthContext`/BFF.
- Không thêm secret vào source code.
- Không bypass 403/401 event trong `apiClient.ts`.
- Các action delete/restore/update quan trọng phải có confirm.

## 25. Quy tắc thêm một CRUD module mới

Khi được giao thêm một danh mục/module CRUD, làm theo checklist này:

1. Tạo type trong `src/types/{Domain}.ts`.
2. Thêm endpoint trong `src/services/endpoints.ts`.
3. Tạo service trong `src/services/{Domain}Service.ts`.
4. Tạo page trong đúng route `src/app/(dashboard)/admin/.../page.tsx`.
5. Tạo `_components/Columns.tsx` cho table.
6. Tạo `_components/{domain}FormConfig.ts` nếu dùng `EntityFormModal`.
7. Thêm permission subject/action nếu module cần phân quyền.
8. Thêm route access và menu item nếu cần hiển thị trên sidebar.
9. Thêm translation key cho `vi`, `en`, `ch`.
10. Thêm loading, empty, error, success toast, confirm modal.
11. Chạy lint/test/build phù hợp.

## 26. Checklist trước khi gửi PR

- Code chạy được ở local.
- Không còn debug `console.log` không cần thiết.
- Không có text hardcode cho user-facing UI.
- Không gọi API trực tiếp trong component.
- Permission đã được kiểm tra ở UI và handler.
- Loading/error/empty state đầy đủ.
- Mobile không vỡ layout ở màn hình chính đã sửa.
- Test liên quan đã chạy.
- Không sửa file ngoài phạm vi task.
- PR mô tả rõ đã sửa gì, test gì, còn rủi ro gì.

## 27. Khi không chắc chắn

- Hỏi mentor trước khi thay đổi auth, BFF, permission, websocket, upload, order workflow hoặc Docker/CI.
- Nếu thấy code cũ có pattern chưa tốt, vẫn ưu tiên giữ nhất quán trong task nhỏ; đề xuất refactor riêng sau.
- Nếu API backend khác type frontend, ghi rõ mapping/normalize trong service và báo lại.
- Nếu task thiếu business rule, không tự đoán phần ảnh hưởng dữ liệu sản xuất.
