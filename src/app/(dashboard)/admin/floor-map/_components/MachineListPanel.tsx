'use client';

import { Button, Empty, Input, Space, Tag, Tooltip, Typography, theme } from 'antd';
import { AimOutlined, CloseOutlined, HolderOutlined, SearchOutlined } from '@ant-design/icons';
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FloorMapMachineDisplayResponse } from '@/types/FloorMap';
import { getMachineStatusFill } from '../_utils/floorMapColors';
import {
    FLOOR_MAP_MACHINE_DRAG_DATA_TYPE,
    createFloorMapMachineDragPayload,
} from '../_utils/floorMapDrag';
import { isMachinePlaced } from '../_utils/floorMapRatio';

type FilterKey = 'all' | 'placed' | 'unplaced';

interface MachineListPanelProps {
    machines: FloorMapMachineDisplayResponse[];
    selectedMachineId: string | null;
    placingMachineId: string | null;
    removingMachineId: string | null;
    readOnly?: boolean;
    isMobile?: boolean;
    style?: CSSProperties;
    /** Rendered under the empty state when the space has no machines at all. */
    emptyAction?: ReactNode;
    onSelectMachine: (machineId: string) => void;
    onPlaceMachine?: (machine: FloorMapMachineDisplayResponse) => void;
    onRemoveMachine?: (machine: FloorMapMachineDisplayResponse) => void;
}

export function MachineListPanel({
    machines,
    selectedMachineId,
    placingMachineId,
    removingMachineId,
    readOnly = false,
    isMobile = false,
    style,
    emptyAction,
    onSelectMachine,
    onPlaceMachine,
    onRemoveMachine,
}: MachineListPanelProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [filter, setFilter] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');

    const filteredMachines = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return machines.filter((machine) => {
            const placed = isMachinePlaced(machine);
            const matchesFilter =
                filter === 'all' || (filter === 'placed' ? placed : !placed);
            const searchableText = [
                machine.propertyCode,
                machine.spaceCode,
                machine.spaceName,
                machine.spaceLevelName,
            ]
                .join(' ')
                .toLowerCase();

            return matchesFilter && searchableText.includes(normalizedSearch);
        });
    }, [filter, machines, search]);

    const placedCount = useMemo(() => machines.filter(isMachinePlaced).length, [machines]);
    const unplacedCount = machines.length - placedCount;
    const statFilters: Array<{
        key: FilterKey;
        label: string;
        value: number;
        color: string;
        background: string;
    }> = [
        {
            key: 'all',
            label: t('floorMap.machines.stats.total'),
            value: machines.length,
            color: token.colorPrimary,
            background: token.colorPrimaryBg,
        },
        {
            key: 'placed',
            label: t('floorMap.machines.filters.placed'),
            value: placedCount,
            color: token.colorSuccess,
            background: token.colorSuccessBg,
        },
        {
            key: 'unplaced',
            label: t('floorMap.machines.filters.unplaced'),
            value: unplacedCount,
            color: token.colorTextSecondary,
            background: token.colorFillQuaternary,
        },
    ];

    return (
        <aside
            style={{
                width: isMobile ? '100%' : 320,
                minWidth: isMobile ? 0 : 280,
                maxWidth: isMobile ? 'none' : 360,
                maxHeight: isMobile ? 380 : undefined,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgContainer,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
                ...style,
            }}
        >
            <style>{`
                .fm-stat-filter {
                    transition: border-color 0.2s ease, background 0.2s ease;
                }
                .fm-stat-filter:hover {
                    border-color: ${token.colorPrimaryBorderHover} !important;
                }
                .fm-machine-item:hover {
                    background: ${token.colorPrimary}0c !important;
                }
                .fm-machine-item:last-child {
                    border-bottom: none !important;
                }
            `}</style>

            {/* Header */}
            <div
                style={{
                    padding: 16,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                        <Typography.Text strong style={{ fontSize: 15, fontWeight: 600 }}>
                            {t('floorMap.machines.title')}
                        </Typography.Text>
                        <div style={{ marginTop: 2 }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {t('floorMap.machines.summary', {
                                    placed: placedCount,
                                    total: machines.length,
                                })}
                            </Typography.Text>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 8,
                        }}
                    >
                        {statFilters.map((stat) => {
                            const isActive = filter === stat.key;

                            return (
                                <button
                                    key={stat.key}
                                    type="button"
                                    className="fm-stat-filter"
                                    aria-pressed={isActive}
                                    onClick={() => setFilter(stat.key)}
                                    style={{
                                        padding: '8px 6px',
                                        border: `1px solid ${
                                            isActive ? stat.color : token.colorBorderSecondary
                                        }`,
                                        borderRadius: token.borderRadius,
                                        background: isActive
                                            ? stat.background
                                            : token.colorBgContainer,
                                        minWidth: 0,
                                        cursor: 'pointer',
                                        textAlign: 'start',
                                        outlineColor: stat.color,
                                    }}
                                >
                                    <Typography.Text
                                        style={{
                                            display: 'block',
                                            color: stat.color,
                                            fontSize: 16,
                                            fontWeight: 700,
                                            lineHeight: 1.1,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {stat.value}
                                    </Typography.Text>
                                    <Typography.Text
                                        type="secondary"
                                        ellipsis
                                        style={{ display: 'block', marginTop: 4, fontSize: 11 }}
                                    >
                                        {stat.label}
                                    </Typography.Text>
                                </button>
                            );
                        })}
                    </div>

                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder={t('floorMap.machines.searchPlaceholder')}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </Space>
            </div>

            {/* List */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                }}
            >
                {filteredMachines.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            machines.length === 0
                                ? t('floorMap.machines.noMachinesInSpace')
                                : t('floorMap.machines.empty')
                        }
                        style={{ padding: '32px 16px' }}
                    >
                        {machines.length === 0 ? emptyAction : null}
                    </Empty>
                ) : (
                    filteredMachines.map((machine) => {
                        const placed = isMachinePlaced(machine);
                        const isSelected = machine.machineId === selectedMachineId;
                        const isDraggable = !readOnly && !placed && !isMobile;
                        const statusColor = placed
                            ? getMachineStatusFill(machine.currentStatus)
                            : token.colorTextQuaternary;
                        const statusLabel = placed
                            ? machine.currentStatus
                                ? t(`floorMap.status.${machine.currentStatus}`, {
                                      defaultValue: machine.currentStatus,
                                  })
                                : t('floorMap.status.placed')
                            : t('floorMap.status.unplaced');

                        return (
                            <div
                                key={machine.machineId}
                                className="fm-machine-item"
                                role="button"
                                tabIndex={0}
                                draggable={isDraggable}
                                onClick={() => onSelectMachine(machine.machineId)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onSelectMachine(machine.machineId);
                                    }
                                }}
                                onDragStart={(event) => {
                                    if (!isDraggable) return;

                                    event.dataTransfer.effectAllowed = 'copy';
                                    event.dataTransfer.setData(
                                        FLOOR_MAP_MACHINE_DRAG_DATA_TYPE,
                                        createFloorMapMachineDragPayload(machine.machineId)
                                    );
                                    event.dataTransfer.setData('text/plain', machine.propertyCode);
                                }}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                    borderInlineStart: `3px solid ${
                                        isSelected ? token.colorPrimary : statusColor
                                    }`,
                                    background: isSelected
                                        ? `${token.colorPrimary}08`
                                        : 'transparent',
                                    cursor: isDraggable ? 'grab' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                {isDraggable && (
                                    <HolderOutlined
                                        style={{
                                            color: token.colorTextQuaternary,
                                            fontSize: 14,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: statusColor,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Typography.Text
                                            strong
                                            style={{
                                                flex: '1 1 160px',
                                                minWidth: 0,
                                                fontSize: 15,
                                                fontWeight: 600,
                                                lineHeight: 1.25,
                                                overflowWrap: 'anywhere',
                                                whiteSpace: 'normal',
                                            }}
                                        >
                                            {machine.propertyCode}
                                        </Typography.Text>
                                        <Tag
                                            style={{
                                                marginInlineEnd: 0,
                                                flexShrink: 0,
                                                fontSize: 11,
                                                borderRadius: 6,
                                                padding: '0 6px',
                                                borderColor: placed
                                                    ? `${statusColor}60`
                                                    : token.colorBorder,
                                                background: placed
                                                    ? `${statusColor}18`
                                                    : token.colorFillQuaternary,
                                                color: placed
                                                    ? statusColor
                                                    : token.colorTextSecondary,
                                            }}
                                        >
                                            {statusLabel}
                                        </Tag>
                                    </div>
                                    <Typography.Text
                                        type="secondary"
                                        ellipsis
                                        style={{ display: 'block', fontSize: 12 }}
                                    >
                                        {machine.spaceLevelName} · {machine.spaceCode} · {machine.spaceName}
                                    </Typography.Text>
                                </div>

                                {!readOnly &&
                                    (placed ? (
                                        <Tooltip title={t('floorMap.actions.removeFromMap')}>
                                            <Button
                                                danger
                                                type="text"
                                                size="small"
                                                icon={<CloseOutlined />}
                                                aria-label={t('floorMap.actions.removeFromMap')}
                                                loading={removingMachineId === machine.machineId}
                                                style={{ flexShrink: 0 }}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onRemoveMachine?.(machine);
                                                }}
                                            />
                                        </Tooltip>
                                    ) : (
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<AimOutlined />}
                                            loading={placingMachineId === machine.machineId}
                                            style={{ flexShrink: 0 }}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onPlaceMachine?.(machine);
                                            }}
                                        >
                                            {t('floorMap.actions.place')}
                                        </Button>
                                    ))}
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
}
