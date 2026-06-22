'use client';

import { CheckCircleFilled } from '@ant-design/icons';
import { Empty, List, Space, Tag, Typography, theme } from 'antd';
import { type CSSProperties, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FloorMapMachineStatusResponse } from '@/types/FloorMap';
import { getMachineStatusFill } from '../_utils/floorMapColors';
import { isMachinePlaced } from '../_utils/floorMapRatio';

interface FloorMapStatusMachinePanelProps {
    machines: FloorMapMachineStatusResponse[];
    selectedMachineId: string | null;
    isMobile?: boolean;
    style?: CSSProperties;
    onSelectMachine: (machineId: string) => void;
}

export function FloorMapStatusMachinePanel({
    machines,
    selectedMachineId,
    isMobile = false,
    style,
    onSelectMachine,
}: FloorMapStatusMachinePanelProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const placedCount = useMemo(() => machines.filter(isMachinePlaced).length, [machines]);

    return (
        <aside
            style={{
                width: isMobile ? '100%' : 320,
                minWidth: isMobile ? 0 : 280,
                maxWidth: isMobile ? 'none' : 360,
                maxHeight: isMobile ? 360 : undefined,
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
            <div
                style={{
                    padding: 12,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgContainer,
                }}
            >
                <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 8,
                        }}
                    >
                        <div style={{ minWidth: 0 }}>
                            <Typography.Text strong style={{ fontSize: 15 }}>
                                {t('floorMap.machines.title')}
                            </Typography.Text>
                            <div style={{ marginTop: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('floorMap.machines.summary', {
                                        placed: placedCount,
                                        total: machines.length,
                                    })}
                                </Typography.Text>
                            </div>
                        </div>
                    </div>
                </Space>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {machines.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={t('floorMap.machines.empty')}
                        style={{ padding: '32px 12px' }}
                    />
                ) : (
                    <List
                        dataSource={machines}
                        renderItem={(machine) => {
                            const placed = isMachinePlaced(machine);
                            const isSelected = machine.machineId === selectedMachineId;
                            const statusColor = placed
                                ? getMachineStatusFill(machine.currentStatus)
                                : token.colorTextQuaternary;
                            const statusLabel = placed
                                ? t(`floorMap.status.${machine.currentStatus}`, {
                                      defaultValue: machine.currentStatus,
                                  })
                                : t('floorMap.status.unplaced');

                            return (
                                <List.Item
                                    aria-selected={isSelected}
                                    onClick={() => onSelectMachine(machine.machineId)}
                                    style={{
                                        padding: '12px 12px',
                                        cursor: 'pointer',
                                        background: isSelected
                                            ? token.colorPrimaryBgHover
                                            : token.colorBgContainer,
                                        borderInlineStart: isSelected
                                            ? `4px solid ${token.colorPrimary}`
                                            : '3px solid transparent',
                                        boxShadow: isSelected
                                            ? `inset 0 0 0 1px ${token.colorPrimaryBorder}`
                                            : undefined,
                                        borderBlockEnd: `1px solid ${token.colorSplit}`,
                                        transition:
                                            'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                                    }}
                                >
                                    <List.Item.Meta
                                        title={
                                            <Space
                                                size={8}
                                                align="center"
                                                wrap
                                                style={{ maxWidth: '100%' }}
                                            >
                                                <span
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        background: statusColor,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <Typography.Text
                                                    strong
                                                    style={{
                                                        maxWidth: '100%',
                                                        overflowWrap: 'anywhere',
                                                        whiteSpace: 'normal',
                                                    }}
                                                >
                                                    {machine.propertyCode}
                                                </Typography.Text>
                                                <Tag
                                                    style={{
                                                        marginInlineEnd: 0,
                                                        fontWeight: isSelected ? 600 : undefined,
                                                        borderColor: placed
                                                            ? `${statusColor}60`
                                                            : token.colorBorder,
                                                        background: placed
                                                            ? `${statusColor}12`
                                                            : token.colorFillQuaternary,
                                                        color: placed
                                                            ? statusColor
                                                            : token.colorTextSecondary,
                                                    }}
                                                >
                                                    {statusLabel}
                                                </Tag>
                                                {isSelected && (
                                                    <CheckCircleFilled
                                                        style={{
                                                            color: token.colorPrimary,
                                                            fontSize: 15,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                            </Space>
                                        }
                                        description={
                                            <Space orientation="vertical" size={1}>
                                                <Typography.Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {machine.spaceLevelName} / {machine.spaceCode}
                                                </Typography.Text>
                                                <Typography.Text
                                                    type="secondary"
                                                    ellipsis
                                                    style={{ maxWidth: 230, fontSize: 12 }}
                                                >
                                                    {machine.spaceName}
                                                </Typography.Text>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />
                )}
            </div>
        </aside>
    );
}
