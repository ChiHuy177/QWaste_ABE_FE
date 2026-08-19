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
    DashboardOutlined,
    ThunderboltOutlined,
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
    machineCode: _machineCode,
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

    // Derived values for maxCapacity and actualCapacity in Machine View
    const maxCapacityValue = data.maxCapacity?.current ?? 180;
    const maxCapacityUnit = data.maxCapacity?.unit ?? 'sp/h';
    const actualCapacityValue =
        data.actualCapacity?.current ?? Math.round((data.actualProduction.current || 1000) / 8);
    const actualCapacityUnit = data.actualCapacity?.unit ?? 'sp/h';
    const actualRateVsMax =
        data.actualCapacity?.rateVsMax ??
        Math.min(100, Math.round((actualCapacityValue / maxCapacityValue) * 100));

    // If Machine Detail View -> Render 4 Columns with 6 Stats matching sketch
    if (isMachineView) {
        return (
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="stretch">
                {/* Column 1: TỈ LỆ HOẠT ĐỘNG (Full Height) */}
                <Col xs={24} sm={12} md={7} lg={7}>
                    <Card
                        variant="borderless"
                        hoverable
                        style={{
                            height: '100%',
                            minHeight: 250,
                            borderRadius: 12,
                            borderColor: effColors.borderColor,
                            border: `1px solid ${effColors.borderColor}`,
                            backgroundColor: effColors.backgroundColor,
                            boxShadow: token.boxShadowSecondary,
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
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
                                        {t('productionOverview.kpi.operatingRate')}
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
                                <Tag
                                    color={data.oee.yesterdayDiff >= 0 ? 'success' : 'warning'}
                                    style={{
                                        borderRadius: 6,
                                        fontSize: 11,
                                        margin: 0,
                                        fontWeight: 600,
                                    }}
                                >
                                    {data.oee.yesterdayDiff >= 0 ? (
                                        <RiseOutlined />
                                    ) : (
                                        <FallOutlined />
                                    )}{' '}
                                    {data.oee.yesterdayDiff >= 0
                                        ? `+${data.oee.yesterdayDiff}`
                                        : data.oee.yesterdayDiff}
                                    %
                                </Tag>
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
                                    style={{ margin: 0, fontWeight: 800, color: effColors.color }}
                                >
                                    {data.oee.current} %
                                </Title>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: token.colorTextSecondary,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('productionOverview.kpi.vsYesterday')}
                                </Text>
                            </div>

                            {/* Progress Bar with target marker */}
                            <div style={{ marginTop: 10 }}>
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
                                    marginTop: 14,
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
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextSecondary,
                                        fontWeight: 600,
                                    }}
                                >
                                    {data.oee.target}%
                                </Text>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Column 2: NĂNG LỰC TỐI ĐA (Full Height) */}
                <Col xs={24} sm={12} md={5} lg={5}>
                    <Card
                        variant="borderless"
                        hoverable
                        style={{
                            height: '100%',
                            minHeight: 250,
                            borderRadius: 12,
                            borderColor: token.colorPrimaryBorder,
                            border: `1px solid ${token.colorPrimaryBorder}`,
                            backgroundColor: token.colorPrimaryBg,
                            boxShadow: token.boxShadowSecondary,
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
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
                                background: `${token.colorPrimary}15`,
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
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color: token.colorPrimaryText,
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {t('productionOverview.kpi.maxCapacity')}
                                </Text>
                                <DashboardOutlined
                                    style={{ fontSize: 18, color: token.colorPrimary }}
                                />
                            </div>

                            <div
                                style={{
                                    margin: '20px 0 8px 0',
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: 6,
                                }}
                            >
                                <Title
                                    level={2}
                                    style={{
                                        margin: 0,
                                        fontWeight: 800,
                                        color: token.colorPrimary,
                                    }}
                                >
                                    {maxCapacityValue.toLocaleString()}
                                </Title>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: token.colorPrimaryText,
                                    }}
                                >
                                    {maxCapacityUnit}
                                </Text>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <Progress
                                    percent={100}
                                    strokeColor={token.colorPrimary}
                                    trailColor={token.colorFillSecondary}
                                    showInfo={false}
                                    size={['100%', 6]}
                                />
                            </div>

                            <div style={{ marginTop: 14 }}>
                                <Tag
                                    color="blue"
                                    style={{
                                        borderRadius: 12,
                                        fontWeight: 600,
                                        fontSize: 11,
                                        padding: '2px 8px',
                                    }}
                                >
                                    100% định mức thiết kế
                                </Tag>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Column 3: Stack of 2 Cards (THỜI GIAN DOWNTIME & SẢN LƯỢNG THỰC TẾ) */}
                <Col xs={24} sm={12} md={6} lg={6}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            height: '100%',
                        }}
                    >
                        {/* Top: THỜI GIAN DOWNTIME */}
                        <Card
                            variant="borderless"
                            hoverable
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                borderColor: token.colorError,
                                border: `1px solid ${token.colorError}`,
                                backgroundColor: token.colorErrorBg,
                                boxShadow: token.boxShadowSecondary,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
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
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: token.colorError,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {t('productionOverview.kpi.downtimeDuration')}
                                    </Text>
                                    <ClockCircleOutlined
                                        style={{ fontSize: 16, color: token.colorError }}
                                    />
                                </div>

                                <div
                                    style={{
                                        margin: '8px 0 4px 0',
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 6,
                                    }}
                                >
                                    <Title
                                        level={3}
                                        style={{
                                            margin: 0,
                                            fontWeight: 800,
                                            color: token.colorError,
                                        }}
                                    >
                                        {data.downtimeMinutes.current}
                                    </Title>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: token.colorErrorText,
                                        }}
                                    >
                                        {t('productionOverview.kpi.minutes')}
                                    </Text>
                                </div>

                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: token.colorError,
                                        fontWeight: 600,
                                    }}
                                >
                                    {data.downtimeMinutes.overTargetMinutes > 0 ? (
                                        <>
                                            <FallOutlined /> +
                                            {data.downtimeMinutes.overTargetMinutes}{' '}
                                            {t('productionOverview.kpi.minutesOverTarget')}
                                        </>
                                    ) : (
                                        'Trong giới hạn cho phép'
                                    )}
                                </Text>
                            </div>
                        </Card>

                        {/* Bottom: SẢN LƯỢNG THỰC TẾ */}
                        <Card
                            variant="borderless"
                            hoverable
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                borderColor: token.colorSuccess,
                                border: `1px solid ${token.colorSuccess}`,
                                backgroundColor: token.colorSuccessBg,
                                boxShadow: token.boxShadowSecondary,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
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
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: token.colorSuccess,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {t('productionOverview.kpi.actualProduction')}
                                    </Text>
                                    <BarChartOutlined
                                        style={{ fontSize: 16, color: token.colorSuccess }}
                                    />
                                </div>

                                <div
                                    style={{
                                        margin: '8px 0 4px 0',
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 6,
                                    }}
                                >
                                    <Title
                                        level={3}
                                        style={{
                                            margin: 0,
                                            fontWeight: 800,
                                            color: token.colorSuccess,
                                        }}
                                    >
                                        {data.actualProduction.current.toLocaleString()}
                                    </Title>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: token.colorSuccessText,
                                        }}
                                    >
                                        {data.actualProduction.unit}
                                    </Text>
                                </div>

                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: token.colorSuccessText,
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('productionOverview.kpi.planShort')}:{' '}
                                    <span style={{ fontWeight: 700, color: token.colorSuccess }}>
                                        {data.actualProduction.target.toLocaleString()}
                                    </span>{' '}
                                    {data.actualProduction.unit}
                                </Text>
                            </div>
                        </Card>
                    </div>
                </Col>

                {/* Column 4: Stack of 2 Cards (NĂNG LỰC THỰC TẾ & TỶ LỆ SẢN LƯỢNG) */}
                <Col xs={24} sm={12} md={6} lg={6}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            height: '100%',
                        }}
                    >
                        {/* Top: NĂNG LỰC THỰC TẾ */}
                        <Card
                            variant="borderless"
                            hoverable
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                borderColor: token.colorInfoBorder,
                                border: `1px solid ${token.colorInfoBorder}`,
                                backgroundColor: token.colorInfoBg,
                                boxShadow: token.boxShadowSecondary,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
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
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: token.colorInfoText,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {t('productionOverview.kpi.actualCapacity')}
                                    </Text>
                                    <ThunderboltOutlined
                                        style={{ fontSize: 16, color: token.colorInfo }}
                                    />
                                </div>

                                <div
                                    style={{
                                        margin: '8px 0 4px 0',
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 6,
                                    }}
                                >
                                    <Title
                                        level={3}
                                        style={{
                                            margin: 0,
                                            fontWeight: 800,
                                            color: token.colorInfo,
                                        }}
                                    >
                                        {actualCapacityValue.toLocaleString()}
                                    </Title>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: token.colorInfoText,
                                        }}
                                    >
                                        {actualCapacityUnit}
                                    </Text>
                                </div>

                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: token.colorInfoText,
                                        fontWeight: 600,
                                    }}
                                >
                                    <RiseOutlined
                                        style={{ color: token.colorSuccess, marginRight: 4 }}
                                    />
                                    {actualRateVsMax}% {t('productionOverview.kpi.vsMaxCapacity')}
                                </Text>
                            </div>
                        </Card>

                        {/* Bottom: TỶ LỆ SẢN LƯỢNG */}
                        <Card
                            variant="borderless"
                            hoverable
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                borderColor: token.colorInfo,
                                border: `1px solid ${token.colorInfo}`,
                                backgroundColor: token.colorInfoBg,
                                boxShadow: token.boxShadowSecondary,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
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
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: token.colorInfo,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {t('productionOverview.kpi.yieldRate')}
                                    </Text>
                                    <InboxOutlined
                                        style={{ fontSize: 16, color: token.colorInfo }}
                                    />
                                </div>

                                <div
                                    style={{
                                        margin: '8px 0 4px 0',
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 6,
                                    }}
                                >
                                    <Title
                                        level={3}
                                        style={{
                                            margin: 0,
                                            fontWeight: 800,
                                            color: token.colorInfo,
                                        }}
                                    >
                                        {data.yieldRate.current} %
                                    </Title>
                                </div>

                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: token.colorInfoText,
                                        fontWeight: 600,
                                    }}
                                >
                                    <RiseOutlined
                                        style={{ color: token.colorSuccess, marginRight: 4 }}
                                    />
                                    {t('productionOverview.kpi.vsPlan')}
                                </Text>
                            </div>
                        </Card>
                    </div>
                </Col>
            </Row>
        );
    }

    // Default Overview View (4 cards)
    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {/* Card 1: HIỆU SUẤT TỔNG NHÀ MÁY */}
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
                                    {t('productionOverview.kpi.overallPlantOee')}
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
                            <Tag
                                color="warning"
                                style={{
                                    borderRadius: 6,
                                    fontSize: 11,
                                    margin: 0,
                                    fontWeight: 600,
                                }}
                            >
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
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: token.colorTextSecondary,
                                    fontWeight: 500,
                                }}
                            >
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
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: token.colorTextSecondary,
                                    fontWeight: 600,
                                }}
                            >
                                {data.oee.target}%
                            </Text>
                        </div>
                    </div>
                </Card>
            </Col>

            {/* Card 2: THỜI GIAN DOWNTIME */}
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
                            <ClockCircleOutlined
                                style={{ fontSize: 18, color: token.colorError }}
                            />
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
                            <Text
                                style={{ fontSize: 12, color: token.colorError, fontWeight: 600 }}
                            >
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
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: token.colorInfoText,
                                    fontWeight: 600,
                                }}
                            >
                                <RiseOutlined
                                    style={{ color: token.colorSuccess, marginRight: 4 }}
                                />
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
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: token.colorSuccessText,
                                    fontWeight: 600,
                                }}
                            >
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
