'use client';

import React from 'react';
import { Card, Col, Row, Statistic, Skeleton, Grid, theme } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, CoffeeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { WorkCalendarSummaryResponse } from '@/types/WorkCalendar';
import { statusColors } from '@/configs/antdTheme';

const { useBreakpoint } = Grid;

interface WorkCalendarSummaryProps {
    summary?: WorkCalendarSummaryResponse;
    loading?: boolean;
}

export const WorkCalendarSummary = React.memo<WorkCalendarSummaryProps>(
    ({ summary, loading = false }) => {
        const { t } = useTranslation('common');
        const { token } = theme.useToken();
        const screens = useBreakpoint();
        const isMobile = !screens.md;
        const isDark = token.colorBgContainer !== '#ffffff';
        const sc = isDark ? statusColors.dark : statusColors.light;

        const workingDays = summary?.totalWorkingDays ?? 0;
        const offDays = summary?.totalOffDays ?? 0;
        const plannedHours = summary?.totalPlannedHours ?? 0;

        if (loading) {
            return (
                <Row
                    gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}
                    style={{ marginBottom: isMobile ? 12 : 24 }}
                >
                    {[1, 2, 3].map((key) => (
                        <Col xs={8} sm={8} key={key}>
                            <Card
                                variant="borderless"
                                style={{
                                    borderRadius: token.borderRadiusLG,
                                    height: isMobile ? 76 : 104,
                                    boxShadow: token.boxShadow,
                                    background: token.colorBgContainer,
                                }}
                                styles={{ body: { padding: isMobile ? '8px 6px' : 20 } }}
                            >
                                <Skeleton.Input
                                    active
                                    size="small"
                                    style={{
                                        width: '70%',
                                        height: isMobile ? 12 : 16,
                                        marginBottom: isMobile ? 6 : 12,
                                        display: 'block',
                                    }}
                                />
                                <Skeleton.Input
                                    active
                                    style={{
                                        width: '50%',
                                        height: isMobile ? 22 : 32,
                                        display: 'block',
                                    }}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            );
        }

        return (
            <Row
                gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}
                style={{ marginBottom: isMobile ? 12 : 24 }}
            >
                {/* Working Days */}
                <Col xs={8} sm={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: token.borderRadiusLG,
                            height: isMobile ? 76 : 104,
                            background: sc.runtime.bg,
                            border: `1px solid ${sc.runtime.border}`,
                            boxShadow: token.boxShadow,
                        }}
                        styles={{ body: { padding: isMobile ? '8px 6px' : 20 } }}
                    >
                        <Statistic
                            title={
                                <span
                                    style={{
                                        color: token.colorTextSecondary,
                                        fontWeight: 500,
                                        fontSize: isMobile ? 10 : 14,
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {t('workCalendar.summary.workingDays')}
                                </span>
                            }
                            value={workingDays}
                            suffix={
                                <span style={{ fontSize: isMobile ? 10 : 14 }}>
                                    {t('workCalendar.summary.unitDays')}
                                </span>
                            }
                            styles={{
                                content: {
                                    color: sc.runtime.base,
                                    fontWeight: 700,
                                    fontSize: isMobile ? 18 : 28,
                                    lineHeight: 1.2,
                                },
                            }}
                            prefix={
                                <CalendarOutlined
                                    style={{
                                        marginRight: isMobile ? 4 : 8,
                                        fontSize: isMobile ? 13 : 16,
                                        color: sc.runtime.base,
                                    }}
                                />
                            }
                        />
                    </Card>
                </Col>

                {/* Off Days */}
                <Col xs={8} sm={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: token.borderRadiusLG,
                            height: isMobile ? 76 : 104,
                            background: sc.idle.bg,
                            border: `1px solid ${sc.idle.border}`,
                            boxShadow: token.boxShadow,
                        }}
                        styles={{ body: { padding: isMobile ? '8px 6px' : 20 } }}
                    >
                        <Statistic
                            title={
                                <span
                                    style={{
                                        color: token.colorTextSecondary,
                                        fontWeight: 500,
                                        fontSize: isMobile ? 10 : 14,
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {t('workCalendar.summary.offDays')}
                                </span>
                            }
                            value={offDays}
                            suffix={
                                <span style={{ fontSize: isMobile ? 10 : 14 }}>
                                    {t('workCalendar.summary.unitDays')}
                                </span>
                            }
                            styles={{
                                content: {
                                    color: sc.idle.base,
                                    fontWeight: 700,
                                    fontSize: isMobile ? 18 : 28,
                                    lineHeight: 1.2,
                                },
                            }}
                            prefix={
                                <CoffeeOutlined
                                    style={{
                                        marginRight: isMobile ? 4 : 8,
                                        fontSize: isMobile ? 13 : 16,
                                        color: sc.idle.base,
                                    }}
                                />
                            }
                        />
                    </Card>
                </Col>

                {/* Total Planned Hours */}
                <Col xs={8} sm={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: token.borderRadiusLG,
                            height: isMobile ? 76 : 104,
                            background: isDark
                                ? 'rgba(61, 125, 210, 0.14)'
                                : 'rgba(7, 70, 149, 0.08)',
                            border: `1px solid ${token.colorPrimaryBorder}`,
                            boxShadow: token.boxShadow,
                        }}
                        styles={{ body: { padding: isMobile ? '8px 6px' : 20 } }}
                    >
                        <Statistic
                            title={
                                <span
                                    style={{
                                        color: token.colorTextSecondary,
                                        fontWeight: 500,
                                        fontSize: isMobile ? 10 : 14,
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {t('workCalendar.summary.plannedHours')}
                                </span>
                            }
                            value={plannedHours}
                            suffix={
                                <span style={{ fontSize: isMobile ? 10 : 14 }}>
                                    {t('workCalendar.summary.unitHours')}
                                </span>
                            }
                            precision={1}
                            styles={{
                                content: {
                                    color: token.colorPrimary,
                                    fontWeight: 700,
                                    fontSize: isMobile ? 18 : 28,
                                    lineHeight: 1.2,
                                },
                            }}
                            prefix={
                                <ClockCircleOutlined
                                    style={{
                                        marginRight: isMobile ? 4 : 8,
                                        fontSize: isMobile ? 13 : 16,
                                        color: token.colorPrimary,
                                    }}
                                />
                            }
                        />
                    </Card>
                </Col>
            </Row>
        );
    }
);
WorkCalendarSummary.displayName = 'WorkCalendarSummary';
