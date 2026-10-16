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
    formattedTotalDowntime?: string;
    plantTotalDowntime?: string;
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
        formattedTotalDowntime,
        plantTotalDowntime,
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
            ? `${t('productionOverview.downtimeModal.title')} — ${machineName || machineId || ''}`
            : t('productionOverview.downtimeModal.title');

        const subtitlePlant =
            (isSingleMachineMode ? workshopName : spaceName) ||
            spaceName ||
            t('common.allPlant', 'Toàn nhà máy');

        const dateRangeText = isDateRange
            ? `${startDate} • ${endDate}`
            : startDate || t('filters.today', 'Hôm nay');

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
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        minWidth: 0,
                        flex: 1,
                    }}
                >
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: token.borderRadiusSM,
                            backgroundColor: token.colorPrimaryBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: token.colorPrimary,
                            flexShrink: 0,
                        }}
                    >
                        <FieldTimeOutlined style={{ fontSize: 18 }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <Title
                            level={4}
                            style={{
                                margin: 0,
                                lineHeight: 1.25,
                                fontSize: isMobile ? 15 : 16.5,
                                fontWeight: 700,
                            }}
                            ellipsis={{ tooltip: titleText }}
                        >
                            {titleText}
                        </Title>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: 2,
                            }}
                        >
                            {subtitlePlant} • {dateRangeText}
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
                        {formattedTotalDowntime || '0m'}
                    </Tag>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                        }}
                    >
                        {plantTotalDowntime && (
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
                                {t('productionOverview.downtimeModal.totalDowntime', {
                                    time: plantTotalDowntime,
                                })}
                            </Tag>
                        )}
                        <Tag
                            color="blue"
                            style={{
                                borderRadius: 12,
                                margin: 0,
                                padding: '2px 10px',
                                fontWeight: 600,
                                fontSize: 12,
                            }}
                        >
                            {t('productionOverview.downtimeModal.machinesCount', {
                                count: totalMachinesCount,
                            })}
                        </Tag>
                    </div>
                )}
            </div>
        );
    }
);

ModalHeader.displayName = 'ModalHeader';
