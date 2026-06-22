'use client';

import React, { useMemo } from 'react';
import { Card, Typography, Flex, theme, Grid } from 'antd';
import {
    DownOutlined,
    ThunderboltOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    PoweroffOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { SpaceOverview } from '@/types/Space';
import { MachineWithStatusLogsSummary } from '@/types/Machine';
import { computeSpaceStats, formatSeconds } from '@/utils/spaceStatsUtils';
import MachineCardGrid from './MachineCardGrid';
import SpaceStatsBar from './SpaceStatsBar';

const { Title, Text } = Typography;

export type ViewFilter = 'all' | 'zones' | 'lines' | 'machines';

interface SpaceNodeProps {
    space: SpaceOverview;
    depth: number;
    expandedSpaces: Set<number>;
    onToggle: (spaceId: number, space?: SpaceOverview) => void;
    onMachineClick: (machine: MachineWithStatusLogsSummary, e: React.MouseEvent) => void;
    viewFilter?: ViewFilter;
    isLastSibling?: boolean;
}

const sectionLabelStyle = (colorTextTertiary: string): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: colorTextTertiary,
});

const SpaceNode: React.FC<SpaceNodeProps> = ({
    space,
    depth,
    expandedSpaces,
    onToggle,
    onMachineClick,
    viewFilter = 'all',
    isLastSibling: _isLastSibling = false,
}) => {
    const { token } = theme.useToken();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const isExpanded = expandedSpaces.has(space.spaceId);

    const stats = useMemo(() => computeSpaceStats(space), [space]);

    const mobileScales = [
        null,
        { fontSize: 15, padding: '12px 14px', codePill: 12 },
        { fontSize: 14, padding: '10px 12px', codePill: 12 },
        { fontSize: 13, padding: '9px 11px', codePill: 11 },
        { fontSize: 13, padding: '8px 10px', codePill: 11 },
        { fontSize: 12, padding: '7px 10px', codePill: 10 },
        { fontSize: 12, padding: '6px 9px', codePill: 10 },
        { fontSize: 11, padding: '6px 8px', codePill: 10 },
    ] as const;
    const mobileScale = !screens.md && depth > 0 ? mobileScales[Math.min(depth, 7)] : null;

    const hasLines = space.children.length > 0;
    const hasMachinesInZone = space.machineChildren.length > 0;
    const hasContent = hasLines || hasMachinesInZone;

    const showLines = viewFilter === 'all' || viewFilter === 'lines';
    const showMachines = viewFilter === 'all' || viewFilter === 'machines';
    const showBody = viewFilter !== 'zones' && isExpanded && hasContent;

    // ─── Depth 0 — Zone accordion (gradient header + horizontal scroll body)
    if (depth === 0) {
        const energyValue =
            stats.energyKwh > 0
                ? `${stats.energyKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`
                : '--';
        const measuredEnergyValue = '--';

        // The gradient header is dark in both themes, so theme tokens (tuned for
        // light/dark surfaces) lack contrast here — use fixed on-dark accents.
        const headerIconColors = {
            energy: '#69C0FF',
            measuredEnergy: '#FFD666',
            run: '#95DE64',
            idle: '#FFC069',
            offline: '#D9D9D9',
            error: '#FF7875',
        };

        // Hard column widths (not min-widths) keep stats aligned across sibling
        // zone cards even when values differ in length ('--' vs '14,702.8 kWh').
        const headerStats = [
            {
                key: 'energy',
                label: t('machineManagement.timeline.energy', 'Energy'),
                value: energyValue,
                icon: <ThunderboltOutlined />,
                color: headerIconColors.energy,
                columnWidth: 118,
            },
            {
                key: 'measuredEnergy',
                label: t('machineManagement.timeline.measuredEnergy', 'Measured Energy'),
                value: measuredEnergyValue,
                icon: <ThunderboltOutlined />,
                color: headerIconColors.measuredEnergy,
                columnWidth: 118,
            },
            {
                key: 'run',
                label: t('factoryOverview.zone.run', 'Run'),
                value: formatSeconds(stats.runtimeSeconds),
                icon: <ClockCircleOutlined />,
                color: headerIconColors.run,
                columnWidth: 86,
            },
            {
                key: 'idle',
                label: t('factoryOverview.zone.stop', 'Idle'),
                value: formatSeconds(stats.idleSeconds),
                icon: <PauseCircleOutlined />,
                color: headerIconColors.idle,
                columnWidth: 86,
            },
            {
                key: 'offline',
                label: t('factoryOverview.zone.offline', 'Offline'),
                value: formatSeconds(stats.offlineSeconds),
                icon: <PoweroffOutlined />,
                color: headerIconColors.offline,
                columnWidth: 86,
            },
            {
                key: 'error',
                label: t('factoryOverview.zone.error', 'Error'),
                value: formatSeconds(stats.errorSeconds),
                icon: <CloseCircleOutlined />,
                color: headerIconColors.error,
                columnWidth: 86,
            },
        ];

        return (
            <Card
                style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: token.boxShadowTertiary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}
                styles={{ body: { padding: 0 } }}
            >
                {/* Gradient Header */}
                <div
                    onClick={() => onToggle(space.spaceId, space)}
                    style={{
                        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                        padding: '20px 24px',
                        cursor: 'pointer',
                        /* removed animation - compatibility fix */
                        color: token.colorTextLightSolid,
                    }}
                >
                    <Flex align="center" wrap="wrap" gap={16}>
                        {/* Chevron + title */}
                        <Flex align="center" gap={12} style={{ flex: 1, minWidth: 220 }}>
                            <DownOutlined
                                style={{
                                    fontSize: 16,
                                    color: token.colorTextLightSolid,
                                    transition: 'transform 0.3s',
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                            />
                            <div>
                                <Title
                                    level={3}
                                    style={{
                                        color: token.colorTextLightSolid,
                                        margin: 0,
                                        marginBottom: 4,
                                    }}
                                >
                                    {space.spaceName}
                                </Title>
                                <Text
                                    style={{
                                        color: '#ffffff',
                                        fontSize: 13,
                                        opacity: 0.85,
                                    }}
                                >
                                    {space.spaceCode} &bull; {space.children.length}{' '}
                                    {t('factoryOverview.zone.lines', 'lines')} &bull;{' '}
                                    {stats.totalMachines}{' '}
                                    {t('factoryOverview.zone.machines', 'machines')}
                                </Text>
                            </div>
                        </Flex>

                        {screens.md && (
                            <div
                                style={{
                                    width: 1,
                                    height: 40,
                                    background: '#ffffff',
                                    opacity: 0.3,
                                }}
                            />
                        )}

                        {/* Stats: desktop = one row, mobile = full-width 2-column grid */}
                        <div
                            style={
                                screens.md
                                    ? {
                                          display: 'flex',
                                          alignItems: 'center',
                                          flexWrap: 'wrap',
                                          gap: 24,
                                      }
                                    : {
                                          display: 'grid',
                                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                          gap: '12px 16px',
                                          width: '100%',
                                      }
                            }
                        >
                            {headerStats.map((item) => (
                                <Flex key={item.key} align="center" gap={8}>
                                    <div
                                        style={{
                                            width: screens.md ? 28 : 24,
                                            height: screens.md ? 28 : 24,
                                            borderRadius: '50%',
                                            background: `${item.color}2E`,
                                            border: `1px solid ${item.color}59`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: item.color,
                                            fontSize: screens.md ? 15 : 13,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {item.icon}
                                    </div>
                                    <div
                                        style={
                                            screens.md
                                                ? { width: item.columnWidth, flexShrink: 0 }
                                                : { minWidth: 0 }
                                        }
                                    >
                                        <Text
                                            style={{
                                                display: 'block',
                                                fontSize: 12,
                                                color: '#ffffff',
                                                opacity: 0.8,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {item.label}
                                        </Text>
                                        <Text
                                            style={{
                                                display: 'block',
                                                fontSize: screens.md ? 16 : 14,
                                                fontWeight: 700,
                                                color: token.colorTextLightSolid,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                            title={item.value}
                                        >
                                            {item.value}
                                        </Text>
                                    </div>
                                </Flex>
                            ))}
                        </div>
                    </Flex>
                </div>

                {/* Expanded body */}
                {showBody && (
                    <div
                        style={{
                            padding: 24,
                            animation: 'fadeIn 0.3s ease-in',
                        }}
                    >
                        {/* Lines subsection — rendered recursively */}
                        {hasLines && showLines && (
                            <div
                                style={{
                                    marginBottom: hasMachinesInZone && showMachines ? 28 : 0,
                                }}
                            >
                                <div style={sectionLabelStyle(token.colorTextTertiary)}>
                                    {t('factoryOverview.zone.linesLabel', 'LINES')} (
                                    {space.children.length})
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8,
                                        marginTop: 8,
                                    }}
                                >
                                    {space.children.map((child, index) => (
                                        <SpaceNode
                                            key={child.spaceId}
                                            space={child}
                                            depth={depth + 1}
                                            expandedSpaces={expandedSpaces}
                                            onToggle={onToggle}
                                            onMachineClick={onMachineClick}
                                            viewFilter={viewFilter}
                                            isLastSibling={index === space.children.length - 1}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Machines directly in zone */}
                        {hasMachinesInZone && showMachines && (
                            <div>
                                <div style={sectionLabelStyle(token.colorTextTertiary)}>
                                    {t(
                                        'factoryOverview.zone.machinesInZoneLabel',
                                        'MACHINES DIRECTLY IN ZONE'
                                    )}{' '}
                                    ({space.machineChildren.length}) &larr;{' '}
                                    {t('factoryOverview.zone.scrollHint', 'scroll')} &rarr;
                                </div>
                                <MachineCardGrid
                                    machines={space.machineChildren}
                                    onMachineClick={onMachineClick}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Card>
        );
    }

    // ─── Depth 1+ — sub-space tree row (kept for any deeper nesting)
    const indentPx = screens.md ? depth * 3 : 0;
    const depthLevel = depth - 1;

    const depthColors = [
        token.colorPrimary,
        token.colorSuccess,
        token.colorWarning,
        token.colorInfo,
        token.colorError,
    ];
    const currentColor = depthColors[depthLevel % depthColors.length];
    const accentWidth = Math.max(3, 5 - depthLevel);

    const depthBackgrounds = isDark
        ? [
            '#282828',
            '#2C2D30',
            '#303237',
            '#34373E',
            '#383C45',
            '#3C414C',
            '#404653',
            '#444B5A',
            '#485061',
            '#4C5568',
            '#505A6F',
        ]
        : [
            '#FFFFFF',
            '#F7F8FA',
            '#F0F2F5',
            '#E9ECF0',
            '#E2E6EB',
            '#DBE0E6',
            '#D4DAE1',
            '#CDD4DC',
            '#C6CED7',
            '#BFC8D2',
            '#B8C2CD',
        ];
    const rowBg = depthBackgrounds[Math.min(depth, 10)];
    const rowHoverBg = isDark ? 'rgba(61, 125, 210, 0.16)' : token.colorPrimaryBg;
    const levelBadgeBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
    const levelBadgeColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#555555';

    return (
        <div style={{ position: 'relative', marginBottom: 8, paddingLeft: indentPx }}>
            {/* Tree Row Header */}
            <div
                onClick={() => hasContent && onToggle(space.spaceId, space)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                    padding: mobileScale?.padding ?? '16px 20px',
                    background: rowBg,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderLeft: `${accentWidth}px solid ${currentColor}`,
                    cursor: hasContent ? 'pointer' : 'default',
                    transition:
                        'background-color 0.15s' /* removed animation - compatibility fix */,
                    minHeight: 56,
                }}
                onMouseEnter={(e) => {
                    if (hasContent) e.currentTarget.style.background = rowHoverBg;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = rowBg;
                }}
            >
                {/* Mobile: column layout — row 1: chevron+badge+code, row 2: name */}
                {/* Desktop/iPad: flat single row */}
                {!screens.md ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {/* Always reserve the chevron slot so rows without
                                children stay aligned with expandable ones */}
                            <DownOutlined
                                style={{
                                    fontSize: 14,
                                    color: currentColor,
                                    transition: 'transform 0.3s',
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    flexShrink: 0,
                                    visibility: hasContent ? 'visible' : 'hidden',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: levelBadgeBg,
                                    color: levelBadgeColor,
                                    marginRight: 4,
                                    flexShrink: 0,
                                }}
                            >
                                {depth >= 10 ? 'L10+' : `L${depth}`}
                            </span>
                            <div
                                style={{
                                    background: currentColor + '15',
                                    color: currentColor,
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: mobileScale?.codePill ?? 13,
                                    fontWeight: 600,
                                    letterSpacing: '0.3px',
                                    border: `1px solid ${currentColor}40`,
                                }}
                            >
                                {space.spaceCode}
                            </div>
                        </div>
                        <Text
                            strong
                            style={{
                                fontSize: mobileScale?.fontSize ?? 16,
                                color: token.colorText,
                            }}
                        >
                            {space.spaceName}
                        </Text>
                    </div>
                ) : (
                    <>
                        {/* Always reserve the chevron slot so rows without
                            children stay aligned with expandable ones */}
                        <DownOutlined
                            style={{
                                fontSize: 14,
                                color: currentColor,
                                transition: 'transform 0.3s',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                flexShrink: 0,
                                visibility: hasContent ? 'visible' : 'hidden',
                            }}
                        />
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: 4,
                                background: levelBadgeBg,
                                color: levelBadgeColor,
                                marginRight: 4,
                                flexShrink: 0,
                            }}
                        >
                            {depth >= 10 ? 'L10+' : `L${depth}`}
                        </span>
                        <div
                            style={{
                                background: currentColor + '15',
                                color: currentColor,
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: mobileScale?.codePill ?? 13,
                                fontWeight: 600,
                                letterSpacing: '0.3px',
                                border: `1px solid ${currentColor}40`,
                            }}
                        >
                            {space.spaceCode}
                        </div>
                        <Text
                            strong
                            style={{
                                fontSize: mobileScale?.fontSize ?? 16,
                                color: token.colorText,
                                flexShrink: 0,
                            }}
                        >
                            {space.spaceName}
                        </Text>
                    </>
                )}
                {/* Desktop: pin stats to the right edge so columns align across rows */}
                <div style={{ marginLeft: screens.md ? 'auto' : 0 }}>
                    <SpaceStatsBar stats={stats} variant="inline" />
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && hasContent && (
                <div
                    style={{
                        marginTop: 4,
                        marginLeft: 0,
                        paddingLeft: 0,
                    }}
                >
                    {space.machineChildren.length > 0 && (
                        <div style={{ marginBottom: space.children.length > 0 ? 12 : 0 }}>
                            <MachineCardGrid
                                machines={space.machineChildren}
                                onMachineClick={onMachineClick}
                            />
                        </div>
                    )}

                    {space.children.map((child, index) => (
                        <SpaceNode
                            key={child.spaceId}
                            space={child}
                            depth={depth + 1}
                            expandedSpaces={expandedSpaces}
                            onToggle={onToggle}
                            onMachineClick={onMachineClick}
                            viewFilter={viewFilter}
                            isLastSibling={index === space.children.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(SpaceNode);
