'use client';

import React from 'react';
import { Typography, Tag, theme } from 'antd';
import {
    DesktopOutlined,
    ShopOutlined,
    WarningOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MachineStatusSummaryItem } from '@/types/Monitoring';
import { formatHours } from '../errorAnalyticsUtils';

const { Title } = Typography;

export interface MachineHeroHeaderProps {
    selectedRow: MachineStatusSummaryItem;
    workshopName?: string;
    isXs?: boolean;
}

export const MachineHeroHeader: React.FC<MachineHeroHeaderProps> = React.memo(
    ({ selectedRow, workshopName, isXs }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        return (
            <div
                style={{
                    padding: '12px 16px',
                    borderRadius: token.borderRadiusLG,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    flexWrap: isXs ? 'wrap' : 'nowrap',
                    gap: 12,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: token.borderRadius,
                            backgroundColor: token.colorPrimaryBg,
                            color: token.colorPrimary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <DesktopOutlined style={{ fontSize: 22 }} />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                        }}
                    >
                        <Title
                            level={4}
                            style={{
                                margin: 0,
                                fontSize: 16,
                                color: token.colorTextHeading,
                            }}
                            ellipsis={{ tooltip: selectedRow.machineName }}
                        >
                            {selectedRow.machineName}
                        </Title>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 3,
                                flexWrap: 'wrap',
                            }}
                        >
                            {workshopName && (
                                <Tag
                                    color="blue"
                                    icon={<ShopOutlined />}
                                    style={{
                                        margin: 0,
                                        fontSize: 11,
                                        borderRadius: 4,
                                    }}
                                >
                                    {workshopName}
                                </Tag>
                            )}
                            <Tag
                                bordered={false}
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                            >
                                {selectedRow.machineId}
                            </Tag>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    {selectedRow.totalErrorHours > 0 ? (
                        <Tag
                            color="error"
                            icon={<WarningOutlined />}
                            style={{
                                padding: '4px 12px',
                                borderRadius: 12,
                                fontWeight: 600,
                                fontSize: 12,
                                margin: 0,
                            }}
                        >
                            {t('factoryOverview.modal.totalErrorTime', {
                                time: formatHours(selectedRow.totalErrorHours),
                            }) || `Tổng thời gian lỗi: ${formatHours(selectedRow.totalErrorHours)}`}
                        </Tag>
                    ) : (
                        <Tag
                            color="success"
                            icon={<CheckCircleOutlined />}
                            style={{
                                padding: '4px 12px',
                                borderRadius: 12,
                                fontWeight: 600,
                                fontSize: 12,
                                margin: 0,
                            }}
                        >
                            {t('factoryOverview.modal.operatingNormally') ||
                                'Hoạt động ổn định (0h lỗi)'}
                        </Tag>
                    )}
                </div>
            </div>
        );
    }
);

MachineHeroHeader.displayName = 'MachineHeroHeader';
