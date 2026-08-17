'use client';

import React from 'react';
import { Card, Col, Progress, Row, Tag, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    ClockCircleOutlined,
    FallOutlined,
    InboxOutlined,
    RiseOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import { KpiSummaryData } from '@/configs/mockData/productionOverviewMockData';

const { Text, Title } = Typography;

interface KpiCardsSectionProps {
    data: KpiSummaryData;
    isMachineView?: boolean;
    machineCode?: string;
}

export const KpiCardsSection: React.FC<KpiCardsSectionProps> = ({
    data,
    isMachineView = false,
    machineCode,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    // Determine color based on efficiency
    const getEfficiencyColor = (oee: number) => {
        if (oee >= 85) {
            return {
                color: token.colorSuccess,
                borderColor: token.colorSuccess,
                backgroundColor: token.colorSuccessBg,
            };
        }
        if (oee >= 70) {
            return {
                color: token.colorWarning,
                borderColor: token.colorWarning,
                backgroundColor: token.colorWarningBg,
            };
        }
        return {
            color: token.colorError,
            borderColor: token.colorError,
            backgroundColor: token.colorErrorBg,
        };
    };

    const effColors = getEfficiencyColor(data.oee.current);

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {/* Card 1: HIỆU SUẤT TỔNG NHÀ MÁY / HIỆU SUẤT MÁY */}
            <Col xs={24} sm={12} lg={6}>
                <Card
                    variant="borderless"
                    hoverable
                    style={{
                        height: '100%',
                        borderRadius: 12,
                        borderColor: effColors.borderColor,
                        border: `1px solid ${effColors.borderColor}`,
                        backgroundColor: effColors.backgroundColor,
                        boxShadow: token.boxShadowSecondary,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative corner */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background: `${effColors.borderColor}15`,
                            borderBottomLeftRadius: '100%',
                        }}
                    />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color: effColors.color,
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {isMachineView
                                        ? t('productionOverview.kpi.machineEfficiency')
                                        : t('productionOverview.kpi.overallPlantOee')}
                                </Text>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextSecondary,
                                        marginTop: 2,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('productionOverview.kpi.target')}: {data.oee.target}%
                                </div>
                            </div>
                            <Tag color="warning" style={{ borderRadius: 6, fontSize: 11, margin: 0, fontWeight: 600 }}>
                                <FallOutlined /> {data.oee.yesterdayDiff}%
                            </Tag>
                        </div>

                        <div
                            style={{
                                margin: '12px 0 8px 0',
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 6,
                            }}
                        >
                            <Title
                                level={2}
                                style={{ margin: 0, fontWeight: 800, color: effColors.color }}
                            >
                                {data.oee.current} %
                            </Title>
                            <Text style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>
                                {t('productionOverview.kpi.vsYesterday')}
                            </Text>
                        </div>

                        {/* Progress Bar with target marker */}
                        <div style={{ marginTop: 8 }}>
                            <Progress
                                percent={data.oee.current}
                                strokeColor={effColors.color}
                                trailColor={token.colorFillSecondary}
                                showInfo={false}
                                size={['100%', 8]}
                            />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: 10,
                            }}
                        >
                            <Tag
                                color="orange"
                                style={{
                                    borderRadius: 12,
                                    fontWeight: 600,
                                    fontSize: 11,
                                    padding: '2px 8px',
                                }}
                            >
                                ▲ {data.oee.statusTag}
                            </Tag>
                            <Text style={{ fontSize: 11, color: token.colorTextSecondary, fontWeight: 600 }}>
                                {data.oee.target}%
                            </Text>
                        </div>
                    </div>
                </Card>
            </Col>

            {/* Card 2: TỔNG THỜI GIAN DỪNG */}
            <Col xs={24} sm={12} lg={6}>
                <Card
                    variant="borderless"
                    hoverable
                    style={{
                        height: '100%',
                        borderRadius: 12,
                        borderColor: token.colorError,
                        border: `1px solid ${token.colorError}`,
                        backgroundColor: token.colorErrorBg,
                        boxShadow: token.boxShadowSecondary,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative corner */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background: `${token.colorError}15`,
                            borderBottomLeftRadius: '100%',
                        }}
                    />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: token.colorError,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t('productionOverview.kpi.totalDowntime')}
                            </Text>
                            <ClockCircleOutlined style={{ fontSize: 18, color: token.colorError }} />
                        </div>

                        <div
                            style={{
                                margin: '16px 0 8px 0',
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 6,
                            }}
                        >
                            <Title
                                level={2}
                                style={{ margin: 0, fontWeight: 800, color: token.colorError }}
                            >
                                {data.downtimeMinutes.current}
                            </Title>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: token.colorErrorText,
                                }}
                            >
                                {t('productionOverview.kpi.minutes')}
                            </Text>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <Text style={{ fontSize: 12, color: token.colorError, fontWeight: 600 }}>
                                <FallOutlined /> +{data.downtimeMinutes.overTargetMinutes}{' '}
                                {t('productionOverview.kpi.minutesOverTarget')}
                            </Text>
                        </div>
                    </div>
                </Card>
            </Col>

            {/* Card 3: TỶ LỆ SẢN LƯỢNG */}
            <Col xs={24} sm={12} lg={6}>
                <Card
                    variant="borderless"
                    hoverable
                    style={{
                        height: '100%',
                        borderRadius: 12,
                        borderColor: token.colorInfo,
                        border: `1px solid ${token.colorInfo}`,
                        backgroundColor: token.colorInfoBg,
                        boxShadow: token.boxShadowSecondary,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative corner */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background: `${token.colorInfo}15`,
                            borderBottomLeftRadius: '100%',
                        }}
                    />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: token.colorInfo,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t('productionOverview.kpi.yieldRate')}
                            </Text>
                            <InboxOutlined style={{ fontSize: 18, color: token.colorInfo }} />
                        </div>

                        <div
                            style={{
                                margin: '16px 0 8px 0',
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 6,
                            }}
                        >
                            <Title
                                level={2}
                                style={{ margin: 0, fontWeight: 800, color: token.colorInfo }}
                            >
                                {data.yieldRate.current} %
                            </Title>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <Text style={{ fontSize: 12, color: token.colorInfoText, fontWeight: 600 }}>
                                <RiseOutlined style={{ color: token.colorSuccess, marginRight: 4 }} />
                                {t('productionOverview.kpi.vsPlan')}
                            </Text>
                        </div>
                    </div>
                </Card>
            </Col>

            {/* Card 4: SẢN LƯỢNG THỰC TẾ */}
            <Col xs={24} sm={12} lg={6}>
                <Card
                    variant="borderless"
                    hoverable
                    style={{
                        height: '100%',
                        borderRadius: 12,
                        borderColor: token.colorSuccess,
                        border: `1px solid ${token.colorSuccess}`,
                        backgroundColor: token.colorSuccessBg,
                        boxShadow: token.boxShadowSecondary,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative corner */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background: `${token.colorSuccess}15`,
                            borderBottomLeftRadius: '100%',
                        }}
                    />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: token.colorSuccess,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t('productionOverview.kpi.actualProduction')}
                            </Text>
                            <BarChartOutlined style={{ fontSize: 18, color: token.colorSuccess }} />
                        </div>

                        <div
                            style={{
                                margin: '16px 0 8px 0',
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 6,
                            }}
                        >
                            <Title
                                level={2}
                                style={{ margin: 0, fontWeight: 800, color: token.colorSuccess }}
                            >
                                {data.actualProduction.current.toLocaleString()}
                            </Title>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: token.colorSuccessText,
                                }}
                            >
                                {data.actualProduction.unit}
                            </Text>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <Text style={{ fontSize: 12, color: token.colorSuccessText, fontWeight: 600 }}>
                                {t('productionOverview.kpi.planShort')}:{' '}
                                <span style={{ fontWeight: 700, color: token.colorSuccess }}>
                                    {data.actualProduction.target.toLocaleString()}
                                </span>{' '}
                                {data.actualProduction.unit}
                            </Text>
                        </div>
                    </div>
                </Card>
            </Col>
        </Row>
    );
};
