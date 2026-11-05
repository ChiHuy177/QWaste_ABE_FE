import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ProductDetailModal from './ProductDetailModal';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { MonitorRowVM } from './types';
import type { ProductionPlanDetail, ProductionPlanStatusLog } from '@/types/ProductionPlan';
import type { CursorPage } from '@/types/Common';

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) =>
            typeof defaultValue === 'string' ? defaultValue : key,
    }),
}));

const mockHandleError = jest.fn();
jest.mock('@/hooks/useApiErrorHandler', () => ({
    useApiErrorHandler: () => ({ handleError: mockHandleError }),
}));

jest.mock('@/services/ProductionPlanService', () => ({
    ProductionPlanService: {
        getProductionPlanById: jest.fn(),
        getProductionPlanStatusLogs: jest.fn(),
    },
}));

const getDetail = () => ProductionPlanService.getProductionPlanById as jest.Mock;
const getLogs = () => ProductionPlanService.getProductionPlanStatusLogs as jest.Mock;

const makeRow = (overrides: Partial<MonitorRowVM> = {}): MonitorRowVM => ({
    productionPlanId: 'plan-1',
    code: 'PP-001',
    name: 'Vỏ bình nước',
    machineId: 'machine-1',
    machineCode: 'MC-01',
    spaceName: 'Line 1',
    moldCode: 'MOLD-01',
    plannedQuantity: 1000,
    actualQuantity: 100,
    status: 'RUNNING',
    updatedAt: new Date('2026-11-05T08:00:00'),
    ...overrides,
});

const makeDetail = (overrides: Partial<ProductionPlanDetail> = {}): ProductionPlanDetail => ({
    productionPlanId: 'plan-1',
    productionPlanCode: 'PP-001',
    productionPlanName: 'Vỏ bình nước',
    productionPlanParentId: null,
    productionPlanParentCode: null,
    productionPlanParentName: null,
    snapshotMoldCode: 'MOLD-01',
    snapshotMoldName: 'Khuôn 1',
    snapshotMoldQuantity: 4,
    snapshotOperationTypeCode: 'OP-01',
    snapshotOperationTypeName: 'Ép nhựa',
    machineId: 'machine-1',
    machineCode: 'MC-01',
    plannedQuantity: 1000,
    actualQuantity: 100,
    plannedDate: '2026-11-05',
    status: 'RUNNING',
    sequence: 1,
    note: null,
    ...overrides,
});

const makeLog = (id: number): ProductionPlanStatusLog => ({
    productionPlanStatusLogId: id,
    machineId: 'machine-1',
    machineCode: 'MC-01',
    machineName: 'Máy 1',
    fromStatus: 'PENDING',
    toStatus: 'RUNNING',
    trigger: 'MANUAL',
    incidentReason: null,
    reason: null,
    changedBy: 'operator',
    timestamp: '2026-11-05T08:00:00',
});

const logPage = (
    items: ProductionPlanStatusLog[],
    overrides: Partial<CursorPage<ProductionPlanStatusLog>> = {}
): CursorPage<ProductionPlanStatusLog> => ({
    items,
    nextCursor: null,
    hasMore: false,
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();
    getDetail().mockResolvedValue(makeDetail());
    getLogs().mockResolvedValue(logPage([makeLog(1)]));
});

const renderModal = (row: MonitorRowVM) =>
    render(<ProductDetailModal row={row} open onClose={jest.fn()} />);

describe('ProductDetailModal — fetch khi có dữ liệu WS', () => {
    it('mở modal gọi detail + statusLogs, mỗi API đúng 1 lần', async () => {
        renderModal(makeRow());

        await waitFor(() => expect(getDetail()).toHaveBeenCalledTimes(1));
        expect(getDetail()).toHaveBeenCalledWith('plan-1');
        expect(getLogs()).toHaveBeenCalledTimes(1);
        expect(getLogs()).toHaveBeenCalledWith('plan-1', { limit: 20 });
    });

    it('tick sản lượng (row đổi reference, status giữ nguyên) không gọi lại API nào', async () => {
        const { rerender } = renderModal(makeRow({ actualQuantity: 100 }));
        await waitFor(() => expect(getDetail()).toHaveBeenCalledTimes(1));

        // Mô phỏng 3 tick ProductionPlan_Production liên tiếp — mỗi tick tạo object row mới.
        for (const quantity of [150, 200, 250]) {
            rerender(
                <ProductDetailModal
                    row={makeRow({ actualQuantity: quantity })}
                    open
                    onClose={jest.fn()}
                />
            );
        }

        await waitFor(() => expect(screen.getByText('250')).toBeInTheDocument());
        expect(getDetail()).toHaveBeenCalledTimes(1);
        expect(getLogs()).toHaveBeenCalledTimes(1);
    });

    it('đổi status gọi lại statusLogs nhưng không gọi lại detail', async () => {
        const { rerender } = renderModal(makeRow({ status: 'RUNNING' }));
        await waitFor(() => expect(getLogs()).toHaveBeenCalledTimes(1));

        rerender(
            <ProductDetailModal row={makeRow({ status: 'PAUSE' })} open onClose={jest.fn()} />
        );

        await waitFor(() => expect(getLogs()).toHaveBeenCalledTimes(2));
        expect(getDetail()).toHaveBeenCalledTimes(1);
    });

    it('đổi sang plan khác gọi lại cả 2 API', async () => {
        const { rerender } = renderModal(makeRow());
        await waitFor(() => expect(getDetail()).toHaveBeenCalledTimes(1));

        rerender(
            <ProductDetailModal
                row={makeRow({ productionPlanId: 'plan-2', code: 'PP-002' })}
                open
                onClose={jest.fn()}
            />
        );

        await waitFor(() => expect(getDetail()).toHaveBeenCalledTimes(2));
        expect(getDetail()).toHaveBeenLastCalledWith('plan-2');
        expect(getLogs()).toHaveBeenCalledTimes(2);
        expect(getLogs()).toHaveBeenLastCalledWith('plan-2', { limit: 20 });
    });

    it('giữ nguyên log đã load thêm khi có tick sản lượng', async () => {
        getLogs()
            .mockResolvedValueOnce(logPage([makeLog(1)], { nextCursor: 'c1', hasMore: true }))
            .mockResolvedValueOnce(logPage([makeLog(2)]));

        const { rerender } = renderModal(makeRow({ actualQuantity: 100 }));
        await waitFor(() => expect(getLogs()).toHaveBeenCalledTimes(1));

        await userEvent.click(screen.getByRole('button', { name: /loadMore/i }));
        await waitFor(() => expect(getLogs()).toHaveBeenCalledTimes(2));
        expect(getLogs()).toHaveBeenLastCalledWith('plan-1', { limit: 20, cursor: 'c1' });

        // Tick sản lượng không được reset list về trang đầu.
        rerender(
            <ProductDetailModal row={makeRow({ actualQuantity: 300 })} open onClose={jest.fn()} />
        );

        await waitFor(() => expect(screen.getByText('300')).toBeInTheDocument());
        expect(getLogs()).toHaveBeenCalledTimes(2);
    });

    it('hiển thị actualQuantity realtime từ row thay vì snapshot của detail', async () => {
        getDetail().mockResolvedValue(makeDetail({ actualQuantity: 100 }));
        renderModal(makeRow({ actualQuantity: 480 }));

        await waitFor(() => expect(screen.getByText('480')).toBeInTheDocument());
        expect(screen.queryByText('100')).not.toBeInTheDocument();
    });
});
