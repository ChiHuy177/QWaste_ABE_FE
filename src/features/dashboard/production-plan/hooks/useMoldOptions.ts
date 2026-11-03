import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MoldService } from '@/services/MoldService';
import type { MoldPickingResponse } from '@/types/Mold';
import type { SelectOptionVM } from '../components/types';
import { moldQueryKeys } from './queryKeys';

const STALE_TIME = 5 * 60_000; // 5 minutes

export interface UseMoldOptionsResult {
    molds: MoldPickingResponse[];
    moldOptions: SelectOptionVM[];
    isLoading: boolean;
}

/** Danh sách khuôn dùng được cho kế hoạch — GET /molds/v1/picking (BE đã loại soft-delete). */
export const useMoldOptions = (): UseMoldOptionsResult => {
    const query = useQuery({
        queryKey: moldQueryKeys.picking,
        queryFn: () => MoldService.getMoldsForPicking(),
        staleTime: STALE_TIME,
    });

    const molds = query.data ?? [];

    const moldOptions = useMemo<SelectOptionVM[]>(
        () =>
            molds.map((mold) => ({
                value: mold.moldId,
                label: `${mold.moldCode} — ${mold.moldName}`,
            })),
        [molds]
    );

    return { molds, moldOptions, isLoading: query.isLoading };
};
