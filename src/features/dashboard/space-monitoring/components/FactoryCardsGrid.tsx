'use client';

import React, { useState, useMemo } from 'react';
import { Card, Typography, theme, Input, Select, Button, Flex, Grid } from 'antd';
import { ArrowRightOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { SpaceOverview, SpaceComputedStats, SpacePickingWithChildren } from '@/types/Space';
import {
    collectAllMachines,
    computeStatsFromMachines,
    formatSeconds,
} from '@/utils/spaceStatsUtils';

const { Text } = Typography;

interface FactoryCardsGridProps {
    factories: SpacePickingWithChildren[];
    overviewMap: Record<number, SpaceOverview | null>;
    loading: boolean;
    onSelect: (factoryId: number) => void;
}

const EMPTY_STATS: SpaceComputedStats = computeStatsFromMachines([]);

const formatEnergy = (kwh: number): string => {
    if (kwh >= 1_000_000_000)
        return `${(kwh / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B`;
    if (kwh >= 1_000_000)
        return `${(kwh / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
    if (kwh >= 1_000)
        return `${(kwh / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`;
    return kwh.toLocaleString('en-US', { maximumFractionDigits: 1 });
};

const FactoryCardsGrid: React.FC<FactoryCardsGridProps> = ({
    factories,
    overviewMap,
    loading,
    onSelect,
}) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();

    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [searchText, setSearchText] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const selectOptions = useMemo(
        () => factories.map((f) => ({ label: f.spaceName, value: f.spaceId })),
        [factories]
    );

    const filteredFactories = useMemo(
        () =>
            factories.filter((f) => {
                const matchesSearch =
                    searchText === '' ||
                    f.spaceName.toLowerCase().includes(searchText.toLowerCase());
                const matchesIds = selectedIds.length === 0 || selectedIds.includes(f.spaceId);
                return matchesSearch && matchesIds;
            }),
        [factories, searchText, selectedIds]
    );

    const gridColumns = useMemo(() => {
        const baseColumns = !screens.md ? 1 : !screens.lg ? 2 : 3;
        const visibleCount = filteredFactories.length;
        const columnCount = visibleCount > 0 ? Math.min(baseColumns, visibleCount) : baseColumns;
        return `repeat(${columnCount}, minmax(0, 1fr))`;
    }, [filteredFactories.length, screens.lg, screens.md]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter bar */}
            <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                <Input
                    prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                    placeholder={t(
                        'factoryOverview.filter.searchPlaceholder',
                        'Search factories...'
                    )}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    style={{ maxWidth: 280 }}
                />
                <Flex gap={8} align="center">
                    <Select
                        mode="multiple"
                        showSearch={{ filterOption: (input, option) => ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase()) }}
                        placeholder={t(
                            'factoryOverview.filter.selectPlaceholder',
                            'Filter by factory...'
                        )}
                        value={selectedIds}
                        onChange={setSelectedIds}
                        options={selectOptions}
                        style={{ width: 320, maxWidth: '100%' }}
                        maxTagCount="responsive"
                    />
                    <Button type="link" onClick={() => setSelectedIds([])}>
                        {t('common.clear', 'Clear')}
                    </Button>
                </Flex>
            </Flex>

            {/* Factory card grid or empty state */}
            {filteredFactories.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '48px 0',
                        color: token.colorTextTertiary,
                        fontSize: 14,
                    }}
                >
                    {t('factoryOverview.filter.noMatch', 'No factories match your filter')}
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: gridColumns,
                        gap: 16,
                        alignItems: 'start',
                        background: '#F5F7FA',
                        padding: 8,
                        borderRadius: 12,
                        margin: -8,
                    }}
                >
                    {filteredFactories.map((factory) => {
                        const overview = overviewMap[factory.spaceId] ?? null;
                        const stats = overview
                            ? computeStatsFromMachines(collectAllMachines(overview))
                            : EMPTY_STATS;

                        const zoneCount = overview?.children.length ?? 0;
                        const lineCount = overview
                            ? overview.children.reduce((sum, zone) => sum + zone.children.length, 0)
                            : 0;

                        return (
                            <Card
                                key={factory.spaceId}
                                variant="borderless"
                                loading={loading && !overview}
                                onClick={() => onSelect(factory.spaceId)}
                                onMouseEnter={() => setHoveredId(factory.spaceId)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    borderRadius: 16,
                                    borderTop: `3px solid ${token.colorPrimary}`,
                                    borderRight: `1px solid ${hoveredId === factory.spaceId ? token.colorPrimary : token.colorBorderSecondary}`,
                                    borderBottom: `1px solid ${hoveredId === factory.spaceId ? token.colorPrimary : token.colorBorderSecondary}`,
                                    borderLeft: `1px solid ${hoveredId === factory.spaceId ? token.colorPrimary : token.colorBorderSecondary}`,
                                    boxShadow:
                                        token.boxShadowTertiary /* removed animation - compatibility fix */,
                                    cursor: 'pointer',
                                    transition:
                                        'border-color 0.2s' /* removed animation - compatibility fix */,
                                }}
                                styles={{ body: { padding: 0 } }}
                            >
                                {/* Card header: label+name on left, counts on right */}
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        background: token.colorPrimaryBg,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems:
                                            filteredFactories.length <= 2 ? 'center' : 'flex-start',
                                        gap: 8,
                                    }}
                                >
                                    {/* Left: FACTORY label + name */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Text
                                            style={{
                                                display: 'block',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: '0.6px',
                                                textTransform: 'uppercase',
                                                color: token.colorTextTertiary,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {t('factoryOverview.factoryLabel', 'Factory')}
                                        </Text>
                                        <div
                                            style={{
                                                fontSize: 28,
                                                fontWeight: 700,
                                                color: token.colorPrimaryTextActive,
                                                lineHeight: 1.2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {factory.spaceName}
                                        </div>
                                    </div>

                                    {/* Right: zone / line / machine counts */}
                                    <div
                                        style={{
                                            flexShrink: 0,
                                            textAlign: 'right',
                                            minWidth:
                                                filteredFactories.length <= 2 ? '50%' : undefined,
                                        }}
                                    >
                                        {filteredFactories.length <= 2 ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: 16,
                                                    justifyContent: 'flex-end',
                                                    alignItems: 'center',
                                                    fontSize: 18,
                                                    color: token.colorTextSecondary,
                                                }}
                                            >
                                                <span>
                                                    <span style={{ fontWeight: 600 }}>
                                                        {zoneCount}
                                                    </span>{' '}
                                                    {t('factoryOverview.filter.zones', 'Zones')}
                                                </span>
                                                <span style={{ color: '#BBBBBB' }}>·</span>
                                                <span>
                                                    <span style={{ fontWeight: 600 }}>
                                                        {lineCount}
                                                    </span>{' '}
                                                    {t('factoryOverview.filter.lines', 'Lines')}
                                                </span>
                                                <span style={{ color: '#BBBBBB' }}>·</span>
                                                <span>
                                                    <span style={{ fontWeight: 600 }}>
                                                        {stats.totalMachines}
                                                    </span>
                                                    {' Machines'}
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <Text
                                                    style={{
                                                        display: 'block',
                                                        fontSize: 13,
                                                        color: token.colorTextSecondary,
                                                    }}
                                                >
                                                    <Text strong>{zoneCount}</Text>{' '}
                                                    {t('factoryOverview.filter.zones', 'Zones')}
                                                </Text>
                                                <Text
                                                    style={{
                                                        display: 'block',
                                                        fontSize: 13,
                                                        color: token.colorTextSecondary,
                                                    }}
                                                >
                                                    <Text strong>{lineCount}</Text>{' '}
                                                    {t('factoryOverview.filter.lines', 'Lines')}
                                                </Text>
                                                <Text
                                                    style={{
                                                        display: 'block',
                                                        fontSize: 13,
                                                        color: token.colorTextSecondary,
                                                    }}
                                                >
                                                    <Text strong>{stats.totalMachines}</Text>
                                                    {' Machines'}
                                                </Text>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Card body: stats */}
                                <div style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                style={{
                                                    display: 'block',
                                                    fontSize: 12,
                                                    color: token.colorTextTertiary,
                                                }}
                                            >
                                                {t('machineManagement.timeline.energy', 'Energy')}
                                            </Text>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 700,
                                                    color: token.colorText,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {formatEnergy(stats.energyKwh)} kWh
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                width: 1,
                                                background: token.colorBorderSecondary,
                                                margin: '2px 12px',
                                                flexShrink: 0,
                                            }}
                                        />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                style={{
                                                    display: 'block',
                                                    fontSize: 12,
                                                    color: token.colorTextTertiary,
                                                }}
                                            >
                                                {t('factoryOverview.onlineTime', 'Online time')}
                                            </Text>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 700,
                                                    color: token.colorText,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {formatSeconds(
                                                    stats.runtimeSeconds +
                                                        stats.idleSeconds +
                                                        stats.errorSeconds
                                                )}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                width: 1,
                                                background: token.colorBorderSecondary,
                                                margin: '2px 12px',
                                                flexShrink: 0,
                                            }}
                                        />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                style={{
                                                    display: 'block',
                                                    fontSize: 12,
                                                    color: token.colorTextTertiary,
                                                }}
                                            >
                                                {t('factoryOverview.offlineTime', 'Offline time')}
                                            </Text>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 700,
                                                    color: token.colorText,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {formatSeconds(stats.offlineSeconds)}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                width: 1,
                                                background: token.colorBorderSecondary,
                                                margin: '2px 12px',
                                                flexShrink: 0,
                                            }}
                                        />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                                style={{
                                                    display: 'block',
                                                    fontSize: 12,
                                                    color: token.colorTextTertiary,
                                                }}
                                            >
                                                {t(
                                                    'machineManagement.timeline.operatorCount',
                                                    'Operators'
                                                )}
                                            </Text>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 700,
                                                    color: token.colorText,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {stats.operatorCount}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer: unchanged */}
                                <div
                                    style={{
                                        padding: '10px 16px',
                                        textAlign: 'center',
                                        background: token.colorInfoBg,
                                        color: '#185FA5',
                                        fontWeight: 600,
                                        fontSize: 13,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        borderTop: '1px solid #BFDBFE',
                                    }}
                                >
                                    <ArrowRightOutlined />
                                    {t('factoryOverview.viewZones', 'View zones in this factory')}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FactoryCardsGrid;
