'use client';

import React, { useMemo } from 'react';
import { Card, Typography, Flex, theme } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { SpaceOverview } from '@/types/Space';
import { MachineWithStatusLogsSummary } from '@/types/Machine';
import { computeSpaceStats } from '@/utils/spaceStatsUtils';
import SpaceStatsBar from './SpaceStatsBar';
import MachineCardGrid from './MachineCardGrid';

const { Title, Text } = Typography;

interface SpaceNodeProps {
    space: SpaceOverview;
    depth: number;
    expandedSpaces: Set<number>;
    onToggle: (spaceId: number) => void;
    onMachineClick: (machine: MachineWithStatusLogsSummary, e: React.MouseEvent) => void;
    isLastSibling?: boolean;
}

const SpaceNode: React.FC<SpaceNodeProps> = ({
    space,
    depth,
    expandedSpaces,
    onToggle,
    onMachineClick,
    isLastSibling: _isLastSibling = false,
}) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const isExpanded = expandedSpaces.has(space.spaceId);

    const stats = useMemo(() => computeSpaceStats(space), [space]);

    const hasContent = space.children.length > 0 || space.machineChildren.length > 0;

    // ─── Depth 0
    if (depth === 0) {
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
                    onClick={() => onToggle(space.spaceId)}
                    style={{
                        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                        padding: '20px 24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        color: token.colorTextLightSolid,
                    }}
                >
                    <Flex align="center" wrap="wrap" gap={16}>
                        <Flex align="center" gap={12}>
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
                                        color: token.colorBgBase,
                                        fontSize: 13,
                                        opacity: 0.85,
                                    }}
                                >
                                    {space.spaceCode} • {space.children.length}{' '}
                                    {t('factoryOverview.zone.lines', 'lines')} •{' '}
                                    {stats.totalMachines}{' '}
                                    {t('factoryOverview.zone.machines', 'machines')}
                                </Text>
                            </div>
                        </Flex>

                        <div
                            style={{
                                width: 1,
                                height: 40,
                                background: token.colorBgBase,
                                opacity: 0.3,
                            }}
                        />

                        <SpaceStatsBar stats={stats} variant="full" />
                    </Flex>
                </div>

                {/* Expanded children */}
                {isExpanded && hasContent && (
                    <div
                        style={{
                            padding: 24,
                            animation: 'fadeIn 0.3s ease-in',
                        }}
                    >
                        {/* Machine children at this level */}
                        {space.machineChildren.length > 0 && (
                            <div style={{ marginBottom: space.children.length > 0 ? 20 : 0 }}>
                                <MachineCardGrid
                                    machines={space.machineChildren}
                                    onMachineClick={onMachineClick}
                                />
                            </div>
                        )}

                        {/* Child spaces (recursion) */}
                        {space.children.map((child, index) => (
                            <SpaceNode
                                key={child.spaceId}
                                space={child}
                                depth={depth + 1}
                                expandedSpaces={expandedSpaces}
                                onToggle={onToggle}
                                onMachineClick={onMachineClick}
                                isLastSibling={index === space.children.length - 1}
                            />
                        ))}
                    </div>
                )}
            </Card>
        );
    }

    // ─── Depth 1+
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

    const rowBg = token.colorBgContainer;

    return (
        <div
            style={{
                position: 'relative',
                marginBottom: 8,
            }}
        >
            {/* Tree Row Header */}
            <div
                onClick={() => hasContent && onToggle(space.spaceId)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                    padding: '16px 20px',
                    background: rowBg,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderLeft: `${accentWidth}px solid ${currentColor}`,
                    cursor: hasContent ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    minHeight: 56,
                }}
                onMouseEnter={(e) => {
                    if (hasContent) {
                        e.currentTarget.style.background = token.colorPrimaryBg;
                    }
                 }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = rowBg;
                }}
            >

                {/* Expand chevron */}
                {hasContent && (
                    <DownOutlined
                        style={{
                            fontSize: 14,
                            color: currentColor,
                            transition: 'transform 0.3s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            flexShrink: 0,
                        }}
                    />
                )}

                {/* Space Code Badge */}
                <div
                    style={{
                        background: currentColor + '15',
                        color: currentColor,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: '0.3px',
                        border: `1px solid ${currentColor}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {space.spaceCode}
                </div>

                {/* Space name */}
                <Text
                    strong
                    style={{
                        fontSize: 16,
                        color: token.colorText,
                        flexShrink: 0,
                    }}
                >
                    {space.spaceName}
                </Text>

                {/* Inline stats */}
                {stats.totalMachines > 0 && <SpaceStatsBar stats={stats} variant="inline" />}
            </div>

            {/* Expanded content */}
            {isExpanded && hasContent && (
                <div
                    style={{
                        marginTop: 4,
                        marginLeft: 16,
                        paddingLeft: 16,
                        borderLeft: `2px dashed ${token.colorBorderSecondary}`,
                    }}
                >
                    {/* Machine children */}
                    {space.machineChildren.length > 0 && (
                        <div
                            style={{
                                marginBottom: space.children.length > 0 ? 12 : 0,
                            }}
                        >
                            <MachineCardGrid
                                machines={space.machineChildren}
                                onMachineClick={onMachineClick}
                            />
                        </div>
                    )}

                    {/* Child spaces (recursion) */}
                    {space.children.map((child, index) => (
                        <SpaceNode
                            key={child.spaceId}
                            space={child}
                            depth={depth + 1}
                            expandedSpaces={expandedSpaces}
                            onToggle={onToggle}
                            onMachineClick={onMachineClick}
                            isLastSibling={index === space.children.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(SpaceNode);
