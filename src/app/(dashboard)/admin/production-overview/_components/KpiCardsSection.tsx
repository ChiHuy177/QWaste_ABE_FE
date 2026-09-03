'use client';

import React from 'react';
import { Card, Col, Progress, Row, Tag, Tooltip, Typography, theme } from 'antd';
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
    onDowntimeClick?: () => void;
}

export const KpiCardsSection: React.FC<KpiCardsSectionProps> = ({
    data,
    isMachineView = false,
    machineCode: _machineCode,
    onDowntimeClick,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const cardThemes = React.useMemo(
        () => ({
            operatingRate: {
                main: token.colorSuccess,
                border: token.colorSuccessBorder,
                bg: token.colorSuccessBg,
                text: token.colorSuccessText,
                icon: token.colorSuccess,
            },
            maxCapacity: {
                main: token.colorPrimary,
                border: token.colorPrimaryBorder,
                bg: token.colorPrimaryBg,
                text: token.colorPrimaryText,
                icon: token.colorPrimary,
            },
            downtime: {
                main: token.colorError,
                border: token.colorErrorBorder,
                bg: token.colorErrorBg,
                text: token.colorErrorText,
                icon: token.colorError,
            },
            actualProduction: {
                main: token.cyan,
                border: token.cyan3,
                bg: token.cyan1,
                text: token.cyan8,
                icon: token.cyan,
            },
            actualCapacity: {
                main: token.colorWarning,
                border: token.colorWarningBorder,
                bg: token.colorWarningBg,
                text: token.colorWarningText,
                icon: token.colorWarning,
            },
            yieldRate: {
                main: token.purple,
                border: token.purple3,
                bg: token.purple1,
                text: token.purple8,
                icon: token.purple,
            },
        }),
        [token]
    );

    const maxCapacityValue = data.maxCapacity?.current ?? 180;
    const maxCapacityUnit = data.maxCapacity?.unit ?? 'sp/h';
    const actualCapacityValue =
        data.actualCapacity?.current ?? Math.round((data.actualProduction.current || 1000) / 8);
    const actualCapacityUnit = data.actualCapacity?.unit ?? 'sp/h';
    const actualRateVsMax =
        data.actualCapacity?.rateVsMax ??
        Math.min(100, Math.round((actualCapacityValue / maxCapacityValue) * 100));

    const totalDowntimeMinutes = data.downtimeMinutes?.current ?? 0;
    const downtimeHours = Math.floor(totalDowntimeMinutes / 60);
    const downtimeMins = totalDowntimeMinutes % 60;

    const renderDowntimeOverTarget = (totalMinutes: number) => {
        if (!totalMinutes || totalMinutes <= 0) {
            return t('productionOverview.kpi.withinLimit');
        }
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        let formattedText = '';
        if (h > 0 && m > 0) {
            formattedText = `+${h.toLocaleString()} ${t('productionOverview.kpi.hours', 'giờ')} ${m} ${t('productionOverview.kpi.minutes', 'phút')} ${t('productionOverview.kpi.overTarget', 'vượt mục tiêu')}`;
        } else if (h > 0) {
            formattedText = `+${h.toLocaleString()} ${t('productionOverview.kpi.hoursOverTarget', 'giờ vượt mục tiêu')}`;
        } else {
            formattedText = `+${m} ${t('productionOverview.kpi.minutesOverTarget', 'phút vượt mục tiêu')}`;
        }
        return (
            <>
                <FallOutlined /> {formattedText}
            </>
        );
    };

    if (isMachineView) {
        return (
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="stretch">
                <Col xs={24} sm={12} md={7} lg={7}>
                    <Card
                        variant="borderless"
                        hoverable
                        style={{
                            height: '100%',
                            minHeight: 250,
                            borderRadius: 12,
                            borderColor: cardThemes.operatingRate.border,
                            border: `1px solid ${cardThemes.operatingRate.border}`,
                            backgroundColor: cardThemes.operatingRate.bg,
                            boxShadow: token.boxShadowSecondary,
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 80,
                                height: 80,
                                background: `${cardThemes.operatingRate.main}15`,
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
                                            color: cardThemes.operatingRate.main,
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
                                    style={{
                                        margin: 0,
                                        fontWeight: 800,
                                        color: cardThemes.operatingRate.main,
                                    }}
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

                            <div style={{ marginTop: 10 }}>
                                <Progress
                                    percent={data.oee.current}
                                    strokeColor={cardThemes.operatingRate.main}
                                    railColor={token.colorFillSecondary}
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
                                    color="success"
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

                <Col xs={24} sm={12} md={5} lg={5}>
                    <Card
                        variant="borderless"
                        hoverable
                        style={{
                            height: '100%',
                            minHeight: 250,
                            borderRadius: 12,
                            borderColor: cardThemes.maxCapacity.border,
                            border: `1px solid ${cardThemes.maxCapacity.border}`,
                            backgroundColor: cardThemes.maxCapacity.bg,
                            boxShadow: token.boxShadowSecondary,
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 80,
                                height: 80,
                                background: `${cardThemes.maxCapacity.main}15`,
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
                                        color: cardThemes.maxCapacity.text,
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {t('productionOverview.kpi.maxCapacity')}
                                </Text>
                                <DashboardOutlined
                                    style={{ fontSize: 18, color: cardThemes.maxCapacity.icon }}
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
                                        color: cardThemes.maxCapacity.main,
                                    }}
                                >
                                    {maxCapacityValue.toLocaleString()}
                                </Title>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: cardThemes.maxCapacity.text,
                                    }}
                                >
                                    {maxCapacityUnit}
                                </Text>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <Progress
                                    percent={100}
                                    strokeColor={cardThemes.maxCapacity.main}
                                    railColor={token.colorFillSecondary}
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
                                    {t('productionOverview.kpi.designBenchmark')}
                                </Tag>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6} lg={6}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            height: '100%',
                        }}
                    >
                        <Card
                            variant="borderless"
                            hoverable
                            onClick={onDowntimeClick}
                            style={{
                                cursor: 'pointer',
                                flex: 1,
                                borderRadius: 12,
                                borderColor: cardThemes.downtime.border,
                                border: `1px solid ${cardThemes.downtime.border}`,
                                backgroundColor: cardThemes.downtime.bg,
                                boxShadow: token.boxShadowSecondary,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 60,
                                    height: 60,
                                    background: `${cardThemes.downtime.main}15`,
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
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: cardThemes.downtime.main,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {t('productionOverview.kpi.downtimeDuration')}
                                    </Text>
                                    <ClockCircleOutlined
                                        style={{ fontSize: 16, color: cardThemes.downtime.icon }}
                                    />
                                </div>

                                <div
                                    style={{
                                        margin: '8px 0 4px 0',
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 5,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {downtimeHours > 0 ? (
                                        <>
                                            <Title
                                                level={3}
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 800,
                                                    color: cardThemes.downtime.main,
                                                }}
                                            >
                                                {downtimeHours.toLocaleString()}
                                            </Title>
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: cardThemes.downtime.text,
                                                }}
                                            >
                                                {t('productionOverview.kpi.hours', 'giờ')}
                                            </Text>
                                            {downtimeMins > 0 && (
                                                <>
                                                    <Title
                                                        level={4}
                                                        style={{
                                                            margin: 0,
                                                            fontWeight: 700,
                                                            color: cardThemes.downtime.main,
                                                        }}
                                                    >
                                                        {downtimeMins}
                                                    </Title>
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            color: cardThemes.downtime.text,
                                                        }}
                                                    >
                                                        {t(
                                                            'productionOverview.kpi.minutes',
                                                            'phút'
                                                        )}
                                                    </Text>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Title
                                                level={3}
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 800,
                                                    color: cardThemes.downtime.main,
                                                }}
                                            >
                                                {downtimeMins}
                                            </Title>
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: cardThemes.downtime.text,
                                                }}
                                            >
                                                {t('productionOverview.kpi.minutes', 'phút')}
                                            </Text>
                                        </>
                                    )}
                                </div>

                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: cardThemes.downtime.text,
                                        fontWeight: 600,
                                    }}
                                >
                                    {renderDowntimeOverTarget(
                                        data.downtimeMinutes.overTargetMinutes
                                    )}
                                </Text>
                            </div>
                        </Card>

                        <Card
                            variant="borderless"
                            hoverable
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                borderColor: cardThemes.actualProduction.border,
                                border: `1px solid ${cardThemes.actualProduction.border}`,
                                backgroundColor: cardThemes.actualProduction.bg,
                                boxShadow: token.boxShadowSecondary,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 60,
                                    height: 60,
                                    background: `${cardThemes.actualProduction.main}15`,
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
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: cardThemes.actualProduction.text,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {t('productionOverview.kpi.actualProduction')}
                                    </Text>
                                    <BarChartOutlined
                                        style={{
                                            fontSize: 16,
                                            color: cardThemes.actualProduction.icon,
                                        }}
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
                                            color: cardThemes.actualProduction.main,
                                        }}
                                    >
                                        {data.actualProduction.current.toLocaleString()}
                                    </Title>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: cardThemes.actualProduction.text,
                                        }}
                                    >
                                        {data.actualProduction.unit}
                                    </Text>
                                </div>

                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: cardThemes.actualProduction.text,
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('productionOverview.kpi.planShort')}:{' '}
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            color: cardThemes.actualProduction.main,
                                        }}
                                    >
                                        {data.actualProduction.target.toLocaleString()}
                                    </span>{' '}
                                    {data.actualProduction.unit}
                                </Text>
                            </div>
                        </Card>
                    </div>
                </Col>

                <Col xs={24} sm={12} md={6} lg={6}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            height: '100%',
                        }}
                    >
                        <Card
                            variant="borderless"
                            hoverable
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                borderColor: cardThemes.actualCapacity.border,
                                border: `1px solid ${cardThemes.actualCapacity.border}`,
                                backgroundColor: cardThemes.actualCapacity.bg,
                                boxShadow: token.boxShadowSecondary,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 60,
                                    height: 60,
                                    background: `${cardThemes.actualCapacity.main}15`,
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
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: cardThemes.actualCapacity.text,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {t('productionOverview.kpi.actualCapacity')}
                                    </Text>
                                    <ThunderboltOutlined
                                        style={{
                                            fontSize: 16,
                                            color: cardThemes.actualCapacity.icon,
                                        }}
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
                                            color: cardThemes.actualCapacity.main,
                                        }}
                                    >
                                        {actualCapacityValue.toLocaleString()}
                                    </Title>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: cardThemes.actualCapacity.text,
                                        }}
                                    >
                                        {actualCapacityUnit}
                                    </Text>
                                </div>

                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: cardThemes.actualCapacity.text,
                                        fontWeight: 600,
                                    }}
                                >
                                    <RiseOutlined
                                        style={{
                                            color: cardThemes.actualCapacity.main,
                                            marginRight: 4,
                                        }}
                                    />
                                    {actualRateVsMax}% {t('productionOverview.kpi.vsMaxCapacity')}
                                </Text>
                            </div>
                        </Card>

                        <Card
                            variant="borderless"
                            hoverable
                            style={{
                                flex: 1,
                                borderRadius: 12,
                                borderColor: cardThemes.yieldRate.border,
                                border: `1px solid ${cardThemes.yieldRate.border}`,
                                backgroundColor: cardThemes.yieldRate.bg,
                                boxShadow: token.boxShadowSecondary,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 60,
                                    height: 60,
                                    background: `${cardThemes.yieldRate.main}15`,
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
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: cardThemes.yieldRate.text,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {t('productionOverview.kpi.yieldRate')}
                                    </Text>
                                    <InboxOutlined
                                        style={{ fontSize: 16, color: cardThemes.yieldRate.icon }}
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
                                            color: cardThemes.yieldRate.main,
                                        }}
                                    >
                                        {data.yieldRate.current} %
                                    </Title>
                                </div>

                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: cardThemes.yieldRate.text,
                                        fontWeight: 600,
                                    }}
                                >
                                    <RiseOutlined
                                        style={{
                                            color: cardThemes.yieldRate.main,
                                            marginRight: 4,
                                        }}
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

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} lg={6}>
                <Card
                    variant="borderless"
                    hoverable
                    style={{
                        height: '100%',
                        borderRadius: 12,
                        borderColor: cardThemes.operatingRate.border,
                        border: `1px solid ${cardThemes.operatingRate.border}`,
                        backgroundColor: cardThemes.operatingRate.bg,
                        boxShadow: token.boxShadowSecondary,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background: `${cardThemes.operatingRate.main}15`,
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
                                        color: cardThemes.operatingRate.main,
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
                                color={data.oee.yesterdayDiff >= 0 ? 'success' : 'warning'}
                                style={{
                                    borderRadius: 6,
                                    fontSize: 11,
                                    margin: 0,
                                    fontWeight: 600,
                                }}
                            >
                                {data.oee.yesterdayDiff >= 0 ? <RiseOutlined /> : <FallOutlined />}{' '}
                                {data.oee.yesterdayDiff >= 0
                                    ? `+${data.oee.yesterdayDiff}`
                                    : data.oee.yesterdayDiff}
                                %
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
                                style={{
                                    margin: 0,
                                    fontWeight: 800,
                                    color: cardThemes.operatingRate.main,
                                }}
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

                        <div style={{ marginTop: 8 }}>
                            <Progress
                                percent={data.oee.current}
                                strokeColor={cardThemes.operatingRate.main}
                                railColor={token.colorFillSecondary}
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
                                color="success"
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

            <Col xs={24} sm={12} lg={6}>
                <Card
                    variant="borderless"
                    hoverable
                    onClick={onDowntimeClick}
                    style={{
                        cursor: 'pointer',
                        height: '100%',
                        borderRadius: 12,
                        borderColor: cardThemes.downtime.border,
                        border: `1px solid ${cardThemes.downtime.border}`,
                        backgroundColor: cardThemes.downtime.bg,
                        boxShadow: token.boxShadowSecondary,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background: `${cardThemes.downtime.main}15`,
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
                                    color: cardThemes.downtime.main,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t('productionOverview.kpi.totalDowntime')}
                            </Text>
                            <ClockCircleOutlined
                                style={{ fontSize: 18, color: cardThemes.downtime.icon }}
                            />
                        </div>

                        <div
                            style={{
                                margin: '16px 0 8px 0',
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 6,
                                flexWrap: 'wrap',
                            }}
                        >
                            {downtimeHours > 0 ? (
                                <>
                                    <Title
                                        level={2}
                                        style={{
                                            margin: 0,
                                            fontWeight: 800,
                                            color: cardThemes.downtime.main,
                                        }}
                                    >
                                        {downtimeHours.toLocaleString()}
                                    </Title>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: cardThemes.downtime.text,
                                        }}
                                    >
                                        {t('productionOverview.kpi.hours', 'giờ')}
                                    </Text>
                                    {downtimeMins > 0 && (
                                        <>
                                            <Title
                                                level={3}
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 700,
                                                    color: cardThemes.downtime.main,
                                                }}
                                            >
                                                {downtimeMins}
                                            </Title>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: cardThemes.downtime.text,
                                                }}
                                            >
                                                {t('productionOverview.kpi.minutes', 'phút')}
                                            </Text>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Title
                                        level={2}
                                        style={{
                                            margin: 0,
                                            fontWeight: 800,
                                            color: cardThemes.downtime.main,
                                        }}
                                    >
                                        {downtimeMins}
                                    </Title>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: cardThemes.downtime.text,
                                        }}
                                    >
                                        {t('productionOverview.kpi.minutes', 'phút')}
                                    </Text>
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: cardThemes.downtime.text,
                                    fontWeight: 600,
                                }}
                            >
                                {renderDowntimeOverTarget(data.downtimeMinutes.overTargetMinutes)}
                            </Text>
                        </div>
                    </div>
                </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
                <Card
                    variant="borderless"
                    hoverable
                    style={{
                        height: '100%',
                        borderRadius: 12,
                        borderColor: cardThemes.yieldRate.border,
                        border: `1px solid ${cardThemes.yieldRate.border}`,
                        backgroundColor: cardThemes.yieldRate.bg,
                        boxShadow: token.boxShadowSecondary,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background: `${cardThemes.yieldRate.main}15`,
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
                                    color: cardThemes.yieldRate.text,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t('productionOverview.kpi.yieldRate')}
                            </Text>
                            <InboxOutlined
                                style={{ fontSize: 18, color: cardThemes.yieldRate.icon }}
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
                                style={{
                                    margin: 0,
                                    fontWeight: 800,
                                    color: cardThemes.yieldRate.main,
                                }}
                            >
                                {data.yieldRate.current} %
                            </Title>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: cardThemes.yieldRate.text,
                                    fontWeight: 600,
                                }}
                            >
                                <RiseOutlined
                                    style={{ color: cardThemes.yieldRate.main, marginRight: 4 }}
                                />
                                {t('productionOverview.kpi.vsPlan')}
                            </Text>
                        </div>
                    </div>
                </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
                <Card
                    variant="borderless"
                    hoverable
                    style={{
                        height: '100%',
                        borderRadius: 12,
                        borderColor: cardThemes.actualProduction.border,
                        border: `1px solid ${cardThemes.actualProduction.border}`,
                        backgroundColor: cardThemes.actualProduction.bg,
                        boxShadow: token.boxShadowSecondary,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 80,
                            height: 80,
                            background: `${cardThemes.actualProduction.main}15`,
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
                                    color: cardThemes.actualProduction.text,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {t('productionOverview.kpi.actualProduction')}
                            </Text>
                            <BarChartOutlined
                                style={{
                                    fontSize: 18,
                                    color: cardThemes.actualProduction.icon,
                                }}
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
                                style={{
                                    margin: 0,
                                    fontWeight: 800,
                                    color: cardThemes.actualProduction.main,
                                }}
                            >
                                {data.actualProduction.current.toLocaleString()}
                            </Title>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: cardThemes.actualProduction.text,
                                }}
                            >
                                {data.actualProduction.unit}
                            </Text>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: cardThemes.actualProduction.text,
                                    fontWeight: 600,
                                }}
                            >
                                {t('productionOverview.kpi.planShort')}:{' '}
                                <span
                                    style={{
                                        fontWeight: 700,
                                        color: cardThemes.actualProduction.main,
                                    }}
                                >
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
