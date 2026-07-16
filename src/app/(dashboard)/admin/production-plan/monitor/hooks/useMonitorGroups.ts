'use client';

import { useMemo } from 'react';
import { theme } from 'antd';
import type { ComponentType } from 'react';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionPlanMonitorActions } from '@/stores/ProductionPlanMonitorStore';
import {
    MONITOR_GROUP_BY_STATUS,
    MONITOR_GROUP_ORDER,
    monitorGroupColor,
    type MonitorGroupKey,
} from '../../_utils/planMappers';
import type { MonitorRowVM } from '../../_components/types';

export type MonitorGroupHeader = {
    type: 'group-header';
    groupKey: string;
    machineCode: string;
    spaceName: string;
    groupSize: number;
};
export type MonitorProductRow = MonitorRowVM & { type: 'product'; groupKey: string };
export type MonitorTotalRow = { type: 'total'; groupKey: string; totalCases: number };
export type MonitorFlatRow = MonitorGroupHeader | MonitorProductRow | MonitorTotalRow;

export interface MonitorStatConfig {
    status: MonitorGroupKey;
    icon: ComponentType<{ style?: React.CSSProperties }>;
    color: string;
    bg: string;
    border: string;
}

// -------- Flat-row builder (machine-grouped, mirrors DailyTable pattern) --------
function toFlatRows(products: MonitorRowVM[]): MonitorFlatRow[] {
    const groupMap = new Map<string, MonitorRowVM[]>();
    products.forEach((p) => {
        const arr = groupMap.get(p.machineId) ?? [];
        arr.push(p);
        groupMap.set(p.machineId, arr);
    });

    const rows: MonitorFlatRow[] = [];
    groupMap.forEach((group, machineId) => {
        const { machineCode, spaceName } = group[0];
        const totalCases = group.reduce((sum, p) => sum + p.plannedQuantity, 0);
        rows.push({
            type: 'group-header',
            groupKey: machineId,
            machineCode,
            spaceName,
            groupSize: group.length,
        });
        group.forEach((p) => rows.push({ ...p, type: 'product', groupKey: machineId }));
        rows.push({ type: 'total', groupKey: machineId, totalCases });
    });

    return rows;
}

interface UseMonitorGroupsParams {
    products: MonitorRowVM[];
}

/** Nhóm/lọc/đếm dữ liệu monitor theo status — đọc searchText/activeKeys từ Redux. */
export const useMonitorGroups = ({ products }: UseMonitorGroupsParams) => {
    const { token } = theme.useToken();
    const dispatch = useAppDispatch();
    const searchText = useAppSelector((state) => state.productionPlanMonitor.searchText);
    const activeKeys = useAppSelector((state) => state.productionPlanMonitor.activeKeys);

    const statConfigs = useMemo<MonitorStatConfig[]>(
        () => [
            {
                status: 'TODO',
                icon: ClockCircleOutlined,
                color: monitorGroupColor('TODO', token),
                bg: '#f9f0ff',
                border: '#d3adf7',
            },
            {
                status: 'IN_PROGRESS',
                icon: SyncOutlined,
                color: monitorGroupColor('IN_PROGRESS', token),
                bg: token.colorInfoBg,
                border: token.colorInfo,
            },
            {
                status: 'PAUSE',
                icon: PauseCircleOutlined,
                color: monitorGroupColor('PAUSE', token),
                bg: token.colorWarningBg,
                border: token.colorWarning,
            },
            {
                status: 'COMPLETE',
                icon: CheckCircleOutlined,
                color: monitorGroupColor('COMPLETE', token),
                bg: token.colorSuccessBg,
                border: token.colorSuccess,
            },
        ],
        [token]
    );

    const statusCounts = useMemo(() => {
        const counts: Record<MonitorGroupKey, number> = {
            TODO: 0,
            IN_PROGRESS: 0,
            PAUSE: 0,
            COMPLETE: 0,
        };
        products.forEach((p) => counts[MONITOR_GROUP_BY_STATUS[p.status]]++);
        return counts;
    }, [products]);

    const filteredByKeyword = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return products;
        return products.filter(
            (p) =>
                p.code.toLowerCase().includes(keyword) ||
                p.name.toLowerCase().includes(keyword) ||
                p.machineCode.toLowerCase().includes(keyword) ||
                p.spaceName.toLowerCase().includes(keyword)
        );
    }, [products, searchText]);

    const grouped = useMemo(() => {
        const map: Record<MonitorGroupKey, MonitorRowVM[]> = {
            IN_PROGRESS: [],
            PAUSE: [],
            TODO: [],
            COMPLETE: [],
        };
        filteredByKeyword.forEach((p) => map[MONITOR_GROUP_BY_STATUS[p.status]].push(p));
        return map;
    }, [filteredByKeyword]);

    const groupedFlatRows = useMemo(() => {
        const result = {} as Record<MonitorGroupKey, MonitorFlatRow[]>;
        MONITOR_GROUP_ORDER.forEach((status) => {
            result[status] = toFlatRows(grouped[status]);
        });
        return result;
    }, [grouped]);

    // While searching, force-open every group that has matches so results are never hidden
    const displayedActiveKeys = useMemo(() => {
        if (!searchText.trim()) return activeKeys;
        const withMatches = MONITOR_GROUP_ORDER.filter((status) => grouped[status].length > 0);
        return Array.from(new Set([...activeKeys, ...withMatches]));
    }, [activeKeys, grouped, searchText]);

    return {
        searchText,
        setSearchText: (value: string) => dispatch(productionPlanMonitorActions.setSearchText(value)),
        activeKeys,
        setActiveKeys: (keys: MonitorGroupKey[]) =>
            dispatch(productionPlanMonitorActions.setActiveKeys(keys)),
        statConfigs,
        statusCounts,
        filteredByKeyword,
        grouped,
        groupedFlatRows,
        displayedActiveKeys,
    };
};
