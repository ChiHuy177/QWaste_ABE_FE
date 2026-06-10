---
name: qwaste-clean-code
description: Use when implementing, reviewing, or refactoring Qwaste v2 Next.js code, especially endpoint, service, page, CRUD, dashboard, monitoring, permission, navigation, i18n, form, table, React component, or App Router work. Applies Qwaste's local architecture plus React/Next.js performance practices.
---

# Qwaste Clean Code Skill

Use this skill to make agent output fit the Qwaste v2 codebase instead of generic React/Next.js code.

## Project Context

Qwaste v2 uses:

- Next.js App Router.
- React 18 and TypeScript.
- Ant Design for main UI.
- `react-i18next` with translations in `src/locales/{vi,en,ch}/common.json`.
- CASL permission via `AbilityContext`, `usePermissionCheck`, `PERMISSION_REGISTRY`, and route access config.
- API access through BFF route `/api/bff`.
- Domain services in `src/services`.
- Domain types in `src/types`.
- Page-local components in route `_components` folders.

## Coding Style

For TypeScript implementation rules around `async/await`, `try/catch/finally`, no `.then().catch()`, loading state, and error handling by layer, read:

```text
CODE_STYLE_ASYNC_ERROR.md
```

## First Read Before Editing

Before changing code, inspect the closest existing module.

For endpoint/service work, read:

- `src/services/endpoints.ts`
- `src/services/NetworkService.ts`
- `src/services/apiClient.ts`
- The closest `src/services/*Service.ts`
- The relevant `src/types/{Domain}.ts`

For CRUD pages, read:

- `src/app/(dashboard)/admin/categories/{domain}/page.tsx`
- `src/app/(dashboard)/admin/categories/{domain}/_components/Columns.tsx` or `Column.tsx`
- `src/app/(dashboard)/admin/categories/{domain}/_components/{domain}FormConfig.ts(x)`

For dashboard or monitoring pages, read nearby pages under:

- `src/app/(dashboard)/admin`
- `src/app/(dashboard)/operator`
- Shared chart/filter components under `src/components/shared`

For route, menu, and permission work, read:

- `src/configs/permissions/caslAbility.ts`
- `src/configs/permissions/permissionRegistry.ts`
- `src/configs/permissions/routeAccess.ts`
- `src/configs/navigation/menuItems.tsx`
- `src/locales/{vi,en,ch}/common.json`

## Core API Flow

Keep API calls on this path:

```text
Page/Component
    -> DomainService
        -> NetworkService.requestJson/requestBlob
            -> apiClient
                -> /api/bff
                    -> backend
```

Rules:

- Do not import `axios` in page/component.
- Do not call `apiClient` from page/component.
- Do not call backend URL directly from client UI.
- Do not manually prefix service URLs with `/api/bff`.
- Keep backend paths in `ENDPOINTS`, for example `/api/machines/v1`.
- Let `apiClient` use `baseURL: '/api/bff'`.
- Let BFF handle token/cookie forwarding.

## Endpoint Rules

File: `src/services/endpoints.ts`

Endpoint only defines backend paths. It does not call API.

Pattern:

```ts
type PathParam = string | number;

const WITH_PARAM = (base: string, param: PathParam): string => `${base}/${param}`;

export const ENDPOINTS = {
    PRODUCT: {
        BASE: '/api/products/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/products/v1', id),
        RESTORE: (id: PathParam) => `/api/products/v1/${id}/restoring`,
        PICKING: '/api/products/v1/picking',
    },
} as const;
```

Rules:

- Use domain object names consistent with the codebase: `MACHINE_TYPES`, `ORDERS`, `FACTORY`, `SPACES`.
- Use `BASE` for list/create/update when backend uses the collection path.
- Use `DETAIL(id)` for detail/delete.
- Use functions for path params.
- Use clear business names for special endpoints: `PICKING`, `RESTORE`, `EXPORT`, `CONFIRM`, `OVERVIEW_BY_FILTER`.
- Prefer `NetworkService` `data` params for GET/DELETE query objects when practical.
- If building query string manually, keep it in service, not page.

Do not do this in page/component:

```ts
await axios.get('/api/bff/api/machineTypes/v1');
```

## Type Rules

File: `src/types/{Domain}.ts`

Pattern:

```ts
import { AuditMetaData } from './Metadata';

export interface Product {
    productId: number;
    productCode: string;
    productName: string;
    description: string;
    auditMetaData?: AuditMetaData;
}

export interface ProductFormData {
    productCode: string;
    productName: string;
    description: string;
}

export interface ProductPickingResponse {
    productId: number;
    productCode: string;
    productName: string;
}
```

Rules:

- Name the main entity after the domain: `Machine`, `MachineType`, `Factory`.
- Name create/edit form payload `{Domain}FormData`.
- Name different update payload `{Domain}UpdateFormData`.
- Name picker response `{Domain}PickingResponse` or `{Domain}PickingSimple`.
- Do not duplicate domain types inside page files.
- Avoid `any` for main payloads.
- Normalize backend shape in service/helper when UI needs a cleaner type.

## Service Rules

File: `src/services/{Domain}Service.ts`

Pattern:

```ts
import { Product, ProductFormData, ProductPickingResponse } from '@/types/Product';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class ProductService {
    static async getAllProducts(): Promise<Product[]> {
        const response = await NetworkService.requestJson<Product[]>({
            method: 'GET',
            url: ENDPOINTS.PRODUCT.BASE,
        });

        return response.result as Product[];
    }

    static async getProductById(productId: number): Promise<Product> {
        const response = await NetworkService.requestJson<Product>({
            method: 'GET',
            url: ENDPOINTS.PRODUCT.DETAIL(productId),
        });

        return response.result as Product;
    }

    static async createProduct(productData: ProductFormData): Promise<Product> {
        const response = await NetworkService.requestJson<Product>({
            method: 'POST',
            url: ENDPOINTS.PRODUCT.BASE,
            data: productData,
        });

        return response.result as Product;
    }

    static async updateProduct(productData: Product): Promise<string> {
        const response = await NetworkService.requestJson<Product>({
            method: 'PUT',
            url: ENDPOINTS.PRODUCT.BASE,
            data: productData,
        });

        return response.message as string;
    }

    static async deleteProduct(productId: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.PRODUCT.DETAIL(productId),
        });

        return response.result;
    }

    static async getProductsForPicking(): Promise<ProductPickingResponse[]> {
        const response = await NetworkService.requestJson<ProductPickingResponse[]>({
            method: 'GET',
            url: ENDPOINTS.PRODUCT.PICKING,
        });

        return response.result as ProductPickingResponse[];
    }
}
```

Rules:

- Service file name: `{Domain}Service.ts`.
- Service class name: `{Domain}Service`.
- Service methods are static.
- Service method names use action + domain: `getAllMachines`, `getMachineById`, `createMachine`, `updateMachine`, `deleteMachine`, `restoreMachine`.
- Every service method has explicit return type.
- Service usually has no `try/catch`; let errors bubble to page/hook/store.
- Service must not import `toast`, router, React hooks, modal, component, or Redux dispatch.
- Service should return `response.result` or `response.message`, not raw `ApiResponse<T>`, unless caller explicitly needs raw metadata.
- Use `NetworkService.requestBlob` for export/download endpoints.
- Add `export * from './{Domain}Service';` in `src/services/index.ts` only if the codebase imports that service from the barrel.

## CRUD Page Rules

Route location:

```text
src/app/(dashboard)/admin/{route}/page.tsx
src/app/(dashboard)/operator/{route}/page.tsx
```

Rules:

- Add `'use client';` only when state, effects, browser APIs, event handlers, or client UI libraries are needed.
- Page owns state, loading, fetch/load functions, handlers, and layout composition.
- Page calls service only; it does not parse raw backend endpoints.
- Use `usePageTitle` for dashboard page titles.
- Use `ResponsivePageHeader` for dashboard page headers.
- Use `SearchInput` for simple search.
- Use `EntityFormModal` for create/edit forms when field config fits.
- Use `ConfirmModal` or existing confirmation pattern for create/update/delete/restore.
- Use `useApiErrorHandler` or existing toast fallback pattern for API errors.
- Use `Can`, `useAbility`, and `usePermissionCheck` for permission-aware UI and handlers.
- Table must have stable `rowKey`, loading, pagination, and proper horizontal scroll when needed.

Preferred page order:

1. Hooks: translation, router, breakpoint, page title.
2. Permission: ability, permission check.
3. Local/Redux state.
4. Derived booleans and values.
5. Fetch/load functions.
6. Effects.
7. User-action handlers.
8. Memoized columns, filters, form fields.
9. Render.

Naming:

- User action: `handleCreateProduct`, `handleEditProduct`, `handleDeleteProduct`, `handleSubmit`.
- Data loading: `fetchProductData`, `loadProductDetail`.
- Derived data: `filteredProductData`, `canCreateProduct`, `isMobile`, `hasAnyAction`.
- Modal state with multiple fields: `modalState`, `confirmModalState`, `viewModalState`.

Loading:

```ts
const fetchProductData = useCallback(async () => {
    try {
        setLoading(true);
        const products = await ProductService.getAllProducts();
        setProductData(products);
    } catch (error) {
        handleError(error, { fallbackKey: 'productManagement.fetchError' });
    } finally {
        setLoading(false);
    }
}, [handleError]);
```

Permission in handler:

```ts
const handleEditProduct = (product: Product) => {
    if (!checkPermission('update', 'product')) return;
    setModalState({ open: true, mode: 'edit', data: product });
};
```

Do not rely only on hidden UI for permission.

## Table Columns Rules

File:

```text
src/app/(dashboard)/admin/{route}/_components/Columns.tsx
```

or existing local name `Column.tsx`.

Rules:

- Columns receive callbacks like `onView`, `onEdit`, `onDelete`.
- Columns do not fetch API.
- Columns do not mutate page state directly.
- Columns receive `ability` when action visibility depends on permission.
- Do not add actions column if no action is allowed.
- Icon-only buttons must have tooltip or `aria-label`.
- Keep sorter/render logic local to columns if it is only table display logic.

Pattern:

```tsx
export type ProductTableColumnProps = {
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getProductTableColumns = (
    props: ProductTableColumnProps
): ColumnsType<Product> => {
    const canUpdate = props.ability?.can('update', 'product') ?? false;
    const canDelete = props.ability?.can('delete', 'product') ?? false;
    const hasAnyAction = canUpdate || canDelete;

    const columns: ColumnsType<Product> = [
        // fields
    ];

    if (hasAnyAction) {
        columns.push({
            key: 'actions',
            title: () => props.t('productManagement.table.headers.actions'),
            render: (_, record) => (
                // buttons call props.onEdit?.(record), props.onDelete?.(record)
            ),
        });
    }

    return columns;
};
```

## Form Config Rules

File:

```text
src/app/(dashboard)/admin/{route}/_components/{domain}FormConfig.ts
```

Rules:

- Put validation rules in form config or schema/hook, not scattered in JSX.
- Use translation keys for labels, placeholders, and validation messages.
- Use `mode` when create/edit field behavior differs.
- Keep validation constants near the form config.

Pattern:

```ts
import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    PRODUCT_CODE: { min: 2, max: 20, pattern: '^[A-Z0-9]+$', required: true },
});

export const getProductFormFields = (
    t: (key: string, options?: any) => string,
    mode: 'create' | 'edit'
): FormFieldConfig[] => [
    {
        name: 'productCode',
        label: t('productManagement.form.fields.productCode'),
        type: 'text',
        placeholder: t('productManagement.form.placeholders.productCode'),
        required: true,
        maxLength: VALIDATION_CONFIG.PRODUCT_CODE.max,
        rules: [
            {
                required: true,
                message: t('productManagement.form.validation.required'),
            },
        ],
        span: { xs: 24, sm: 12 },
    },
];
```

## Dashboard and Monitoring Page Rules

For non-CRUD pages such as factory overview, machines overview, energy, charts, or monitoring:

- Keep endpoint constants in `ENDPOINTS`, even for chart/overview APIs.
- Keep API calls in domain service.
- Keep filter state in page or a route-local hook.
- Extract repeated chart/filter/cards into `_components`.
- Keep chart data mapping in service, utility, or memoized mapper, not inline JSX.
- Fetch independent panels in parallel when possible.
- Use stable filter object dependencies or primitive dependencies to avoid repeated fetch loops.
- Show loading and empty state per panel if panels can fail independently.
- Keep date/time formatting consistent with existing `dayjs` usage.
- Do not hardcode Woodsland-specific filters in UI; use existing config constants when already present.

Parallel fetch pattern:

```ts
const fetchDashboardData = useCallback(async () => {
    try {
        setLoading(true);
        const [overview, machines, energy] = await Promise.all([
            FactoryService.getFactoryOverview(factoryId, datePeriod),
            MachineService.getMachinesWithLogs(spaceId, datePeriod),
            EnergyService.getEnergyOverview(datePeriod),
        ]);

        setOverviewData(overview);
        setMachineData(machines);
        setEnergyData(energy);
    } catch (error) {
        handleError(error, { fallbackKey: 'dashboard.fetchError' });
    } finally {
        setLoading(false);
    }
}, [datePeriod, factoryId, handleError, spaceId]);
```

## Permission Rules

Update these files only when the module needs a new permission subject/action:

- `src/configs/permissions/caslAbility.ts`
- `src/configs/permissions/permissionRegistry.ts`
- `src/configs/permissions/routeAccess.ts`
- `src/configs/navigation/menuItems.tsx`
- `src/locales/{vi,en,ch}/common.json`

Registry pattern:

```ts
{
    slug: 'product:view',
    subject: 'product',
    action: 'view',
    routes: ['/admin/categories/product'],
    menuKey: 'product',
    description: 'View products',
}
```

Rules:

- Add subject to `caslAbility.ts` before using it in `Can` or `ability.can`.
- Add route mapping if the route needs guard.
- Add menu item only if route should appear in sidebar.
- Menu must use `ability.can`, not role checks.
- Handler must check permission before mutation.

## Navigation Rules

File: `src/configs/navigation/menuItems.tsx`

Pattern:

```tsx
if (ability.can('view', 'product')) {
    categoryItems.push(
        createMenuItem('/admin/categories/product', t('sidebar.navigation.product'))
    );
}
```

Rules:

- Route key must match the App Router path.
- Label must use translation key.
- Place item in the same group style as similar modules.
- Do not hardcode role names.

## i18n Rules

Files:

```text
src/locales/vi/common.json
src/locales/en/common.json
src/locales/ch/common.json
```

Rules:

- User-facing text must use `t('...')`.
- Use domain key: `machineTypeManagement`, `factoryManagement`, `productManagement`.
- Put sidebar labels in `sidebar.navigation`.
- Put page titles in `pageTitle` when using `usePageTitle`.
- Add keys to all supported locales when the screen supports all locales.
- Do not delete old keys before checking usage with `rg`.

Domain key shape:

```json
{
    "productManagement": {
        "title": "Danh sách sản phẩm",
        "addProduct": "Thêm sản phẩm",
        "searchPlaceholder": "Tìm kiếm theo mã hoặc tên sản phẩm",
        "fetchError": "Không thể tải danh sách sản phẩm",
        "deleteSuccess": "Xóa sản phẩm thành công",
        "deleteError": "Xóa sản phẩm thất bại",
        "updateSuccess": "Cập nhật sản phẩm thành công",
        "updateError": "Cập nhật sản phẩm thất bại",
        "table": {
            "headers": {
                "productCode": "Mã sản phẩm",
                "productName": "Tên sản phẩm",
                "actions": "Thao tác"
            }
        },
        "actions": {
            "edit": "Sửa",
            "delete": "Xóa"
        },
        "form": {
            "createTitle": "Tạo sản phẩm",
            "editTitle": "Cập nhật sản phẩm",
            "createSuccess": "Tạo sản phẩm thành công",
            "createError": "Tạo sản phẩm thất bại",
            "fields": {
                "productCode": "Mã sản phẩm",
                "productName": "Tên sản phẩm"
            },
            "validation": {
                "required": "Trường này là bắt buộc",
                "minLength": "Tối thiểu {{min}} ký tự",
                "maxLength": "Tối đa {{max}} ký tự"
            }
        }
    }
}
```

## React and Next.js Best Practices

For React/Next.js performance work, read:

```text
REACT_NEXT_PERFORMANCE.md
```

That file rewrites the Vercel React best-practice categories into Qwaste-specific rules for async waterfalls, bundle size, server/client boundaries, TanStack Query, re-render behavior, rendering, JavaScript hot paths, and advanced hook patterns.

## State and Data Flow Rules

- Keep state local when used by one page/component.
- Use Redux Toolkit/context only when state is shared or already follows an existing approved module pattern.
- Do not add new Zustand stores for Qwaste modules; existing Zustand files are legacy/special-case and should not be copied for new work.
- Do not copy server data into Redux just because it was fetched.
- Do not mutate React state arrays/objects directly.
- Use `useCallback` for handlers passed into memoized columns or child components.
- Keep filter/search values explicit: `searchTerm`, `selectedFactoryId`, `datePeriod`.
- Keep modal state objects explicit when modal has multiple fields.

## Error Handling Rules

- Service lets errors throw naturally.
- Page/hook/store catches errors to show toast/modal and preserve UI state.
- Use `useApiErrorHandler` when existing page pattern uses it.
- Every user-facing error needs a fallback translation key.
- Do not swallow errors silently.
- Do not close create/edit modal if the mutation fails.
- Do not leave loading stuck after errors.
- Do not use `.then().catch()` for new API flows; use `async/await` with `try/catch/finally`.

## Clean Code Issues To Fix When Found

Fix these while touching related code:

- API call in component.
- Hardcoded endpoint outside `ENDPOINTS`.
- `console.log` debug in service/page.
- Deep relative import where alias `@/...` works.
- Unused state such as selection state with disabled checkboxes and no selection feature.
- Duplicate export in `src/services/index.ts`.
- `any` on known domain payload.
- User-facing hardcoded text in JSX.
- Large business logic expression inside JSX.
- Permission only hidden in UI but not checked in handler.

Do not refactor unrelated files just because these issues exist elsewhere.

## Validation

For docs-only changes, no test is required.

For code changes, run the narrowest useful validation:

```bash
npm run lint:check
npm test
```

Run build when changing routes, config, auth, BFF, permission, or cross-cutting service behavior:

```bash
npm run build
```

If validation cannot run, state the reason and the residual risk.

## Review Checklist

When reviewing Qwaste code, lead with findings and file references.

Check:

- Page/component calls API directly.
- Endpoint string is duplicated or hardcoded.
- Service imports UI, toast, router, React hook, or Redux dispatch.
- Main payload uses `any` where a type is clear.
- Handler mutates important data without permission check.
- Loading can get stuck because `finally` is missing.
- Error lacks fallback translation key.
- User-facing text is hardcoded.
- Table lacks stable `rowKey`, loading, pagination, or action tooltip.
- Form validation is scattered outside config/schema.
- Route/menu/permission/i18n are out of sync.
- React code creates request waterfalls or unnecessary re-renders.
- New code adds unrelated refactor or metadata churn.

## Final Response Style

When finished, summarize:

- Changed files.
- Main behavior or convention applied.
- Validation run or not run.

Keep the response concise.
