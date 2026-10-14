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
import { DowntimeMachineInfo } from '@/types/Downtime';

const { Title } = Typography;

export interface MachineHeroHeaderProps {
    machineInfo: DowntimeMachineInfo;
    workshopName?: string;
    isXs?: boolean;
    isMobile?: boolean;
}

export const MachineHeroHeader: React.FC<MachineHeroHeaderProps> = React.memo(
    ({ machineInfo, workshopName, isXs, isMobile }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        const resolvedWorkshop =
            workshopName ||
            (machineInfo.location ? machineInfo.location.split('-')[1]?.trim() : '') ||
            t('productionOverview.downtimeModal.workshopTag', 'Xưởng');

        const hasDowntime = (machineInfo.totalDowntimeMinutes || 0) > 0;

        return (
            <div
                style={{
                    padding: isMobile ? '10px 12px' : '12px 16px',
                    borderRadius: token.borderRadiusLG,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    flexWrap: isMobile || isXs ? 'wrap' : 'nowrap',
                    gap: isMobile ? 8 : 12,
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
                                fontWeight: 700,
                            }}
                            ellipsis={{ tooltip: machineInfo.machineName }}
                        >
                            {machineInfo.machineName}
                        </Title>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 4,
                                flexWrap: 'wrap',
                            }}
                        >
                            {resolvedWorkshop && (
                                <Tag
                                    color="blue"
                                    icon={<ShopOutlined />}
                                    style={{
                                        margin: 0,
                                        fontSize: 11.5,
                                        borderRadius: 4,
                                    }}
                                >
                                    {resolvedWorkshop}
                                </Tag>
                            )}
                            {machineInfo.machineCode &&
                                !/^[0-9a-fA-F-]{36}$/.test(machineInfo.machineCode) && (
                                    <Tag
                                        bordered={false}
                                        style={{
                                            margin: 0,
                                            fontSize: 11.5,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {machineInfo.machineCode}
                                    </Tag>
                                )}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexShrink: 0,
                    }}
                >
                    {machineInfo.totalIncidents !== undefined && (
                        <Tag
                            style={{
                                padding: '4px 10px',
                                borderRadius: 12,
                                fontWeight: 600,
                                fontSize: 12,
                                margin: 0,
                                background: token.colorBgContainer,
                            }}
                        >
                            {t('productionOverview.downtimeModal.incidentCount', {
                                count: machineInfo.totalIncidents,
                            })}
                        </Tag>
                    )}
                    {hasDowntime ? (
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
                            {t('productionOverview.downtimeModal.totalErrorTime', {
                                time:
                                    machineInfo.formattedTotalDowntime ||
                                    `${machineInfo.totalDowntimeMinutes}m`,
                            })}
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
                            {t('productionOverview.downtimeModal.operatingNormally')}
                        </Tag>
                    )}
                </div>
            </div>
        );
    }
);

MachineHeroHeader.displayName = 'MachineHeroHeader';
