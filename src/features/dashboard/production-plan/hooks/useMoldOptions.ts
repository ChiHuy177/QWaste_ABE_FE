import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MoldService } from '@/services/MoldService';
import { isMoldSchedulable, type Mold } from '@/types/Mold';
import type { SelectOptionVM } from '../components/types';
import { moldQueryKeys } from './queryKeys';

const STALE_TIME = 5 * 60_000; // 5 minutes

export interface UseMoldOptionsResult {
    molds: Mold[];
    moldOptions: SelectOptionVM[];
    isLoading: boolean;
}

/** Danh sách khuôn đầy đủ (kể cả đã xóa/RETIRED) — picker chỉ lọc mold còn dùng được. */
export const useMoldOptions = (): UseMoldOptionsResult => {
    const query = useQuery({
        queryKey: moldQueryKeys.lists,
        queryFn: () => MoldService.getAllMolds(),
        staleTime: STALE_TIME,
    });

    const molds = query.data ?? [];

    const moldOptions = useMemo<SelectOptionVM[]>(
        () =>
            molds.filter(isMoldSchedulable).map((mold) => ({
                value: mold.moldId,
                label: `${mold.moldCode} — ${mold.moldName}`,
            })),
        [molds]
    );

    return { molds, moldOptions, isLoading: query.isLoading };
};
