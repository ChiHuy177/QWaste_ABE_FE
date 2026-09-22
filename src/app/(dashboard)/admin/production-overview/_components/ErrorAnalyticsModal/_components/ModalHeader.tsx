'use client';

import React from 'react';
import { Typography, Tag, theme } from 'antd';
import { FieldTimeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export interface ModalHeaderProps {
    isSingleMachineMode: boolean;
    machineName?: string;
    machineId?: string;
    totalErrorHours?: number;
    spaceName?: string;
    workshopName?: string;
    isDateRange: boolean;
    startDate: string;
    endDate: string;
    totalMachinesCount: number;
    isMobile?: boolean;
}

export const ModalHeader: React.FC<ModalHeaderProps> = React.memo(
    ({
        isSingleMachineMode,
        machineName,
        machineId,
        totalErrorHours,
        spaceName,
        workshopName,
        isDateRange,
        startDate,
        endDate,
        totalMachinesCount,
        isMobile,
    }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        const titleText = isSingleMachineMode
            ? `${t('factoryOverview.table.title.errorHistory') || 'Lịch sử sự cố'} — ${machineName || machineId || ''}`
            : t('factoryOverview.table.title.timeAnalytics') ||
              t('factoryOverview.modal.title') ||
              'Phân tích thời gian hoạt động';

        const subtitleText = isSingleMachineMode
            ? workshopName || spaceName || t('factoryOverview.modal.allPlant') || 'Toàn nhà máy'
            : spaceName || t('factoryOverview.modal.allPlant') || 'Toàn nhà máy';

        const dateRangeText = isDateRange
            ? `${startDate} ~ ${endDate}`
            : startDate || t('filters.today') || 'Hôm nay';

        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingRight: 28,
                    paddingBottom: 4,
                    gap: 10,
                }}
            >
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}
                >
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: token.borderRadiusSM,
                            backgroundColor: token.colorPrimaryBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: token.colorPrimary,
                            flexShrink: 0,
                        }}
                    >
                        <FieldTimeOutlined style={{ fontSize: 16 }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <Title
                            level={4}
                            style={{
                                margin: 0,
                                lineHeight: 1.25,
                                fontSize: isMobile ? 14.5 : 16.5,
                            }}
                            ellipsis={{ tooltip: titleText }}
                        >
                            {titleText}
                        </Title>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 11.5,
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {subtitleText} • {dateRangeText}
                        </Text>
                    </div>
                </div>

                {isSingleMachineMode ? (
                    <Tag
                        color="error"
                        style={{
                            borderRadius: 12,
                            margin: 0,
                            padding: '2px 10px',
                            fontWeight: 600,
                            fontSize: 12,
                        }}
                    >
                        {t('factoryOverview.modal.errorBadge', {
                            time: totalErrorHours ? `${totalErrorHours}h` : '0h',
                        }) || `${totalErrorHours || 0}h lỗi`}
                    </Tag>
                ) : (
                    <Tag
                        color="blue"
                        style={{
                            borderRadius: 12,
                            margin: 0,
                            padding: '2px 10px',
                            fontWeight: 500,
                            fontSize: 12,
                        }}
                    >
                        {totalMachinesCount} {t('factoryOverview.filter.machines') || 'thiết bị'}
                    </Tag>
                )}
            </div>
        );
    }
);

ModalHeader.displayName = 'ModalHeader';
