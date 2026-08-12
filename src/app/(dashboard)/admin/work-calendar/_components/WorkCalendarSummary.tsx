'use client';

import React from 'react';
import { Card, Col, Row, Statistic, Skeleton, theme } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, CoffeeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { WorkCalendarSummaryResponse } from '@/types/WorkCalendar';
import { statusColors } from '@/configs/antdTheme';

interface WorkCalendarSummaryProps {
    summary?: WorkCalendarSummaryResponse;
    loading?: boolean;
}

export const WorkCalendarSummary = React.memo<WorkCalendarSummaryProps>(
    ({ summary, loading = false }) => {
        const { t } = useTranslation('common');
        const { token } = theme.useToken();
        const isDark = token.colorBgContainer !== '#ffffff';
        const sc = isDark ? statusColors.dark : statusColors.light;

        const workingDays = summary?.totalWorkingDays ?? 0;
        const offDays = summary?.totalOffDays ?? 0;
        const plannedHours = summary?.totalPlannedHours ?? 0;

        if (loading) {
            return (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {[1, 2, 3].map((key) => (
                        <Col xs={24} sm={8} key={key}>
                            <Card
                                variant="borderless"
                                style={{
                                    borderRadius: 12,
                                    height: 104,
                                    boxShadow: token.boxShadow,
                                    background: token.colorBgContainer,
                                }}
                                styles={{ body: { padding: 20 } }}
                            >
                                <Skeleton.Input
                                    active
                                    size="small"
                                    style={{
                                        width: '55%',
                                        height: 16,
                                        marginBottom: 12,
                                        display: 'block',
                                    }}
                                />
                                <Skeleton.Input
                                    active
                                    style={{ width: '35%', height: 32, display: 'block' }}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            );
        }

        return (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {/* Working Days */}
                <Col xs={24} sm={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: 12,
                            height: 104,
                            background: sc.runtime.bg,
                            border: `1px solid ${sc.runtime.border}`,
                            boxShadow: token.boxShadow,
                        }}
                        styles={{ body: { padding: 20 } }}
                    >
                        <Statistic
                            title={
                                <span style={{ color: token.colorTextSecondary, fontWeight: 500 }}>
                                    {t('workCalendar.summary.workingDays')}
                                </span>
                            }
                            value={workingDays}
                            suffix={t('workCalendar.summary.unitDays')}
                            styles={{
                                content: { color: sc.runtime.base, fontWeight: 700, fontSize: 28 },
                            }}
                            prefix={
                                <CalendarOutlined
                                    style={{ marginRight: 8, color: sc.runtime.base }}
                                />
                            }
                        />
                    </Card>
                </Col>

                {/* Off Days */}
                <Col xs={24} sm={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: 12,
                            height: 104,
                            background: sc.idle.bg,
                            border: `1px solid ${sc.idle.border}`,
                            boxShadow: token.boxShadow,
                        }}
                        styles={{ body: { padding: 20 } }}
                    >
                        <Statistic
                            title={
                                <span style={{ color: token.colorTextSecondary, fontWeight: 500 }}>
                                    {t('workCalendar.summary.offDays')}
                                </span>
                            }
                            value={offDays}
                            suffix={t('workCalendar.summary.unitDays')}
                            styles={{
                                content: { color: sc.idle.base, fontWeight: 700, fontSize: 28 },
                            }}
                            prefix={
                                <CoffeeOutlined style={{ marginRight: 8, color: sc.idle.base }} />
                            }
                        />
                    </Card>
                </Col>

                {/* Total Planned Hours */}
                <Col xs={24} sm={8}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: 12,
                            height: 104,
                            background: isDark
                                ? 'rgba(61, 125, 210, 0.14)'
                                : 'rgba(7, 70, 149, 0.08)',
                            border: `1px solid ${token.colorPrimaryBorder}`,
                            boxShadow: token.boxShadow,
                        }}
                        styles={{ body: { padding: 20 } }}
                    >
                        <Statistic
                            title={
                                <span style={{ color: token.colorTextSecondary, fontWeight: 500 }}>
                                    {t('workCalendar.summary.plannedHours')}
                                </span>
                            }
                            value={plannedHours}
                            suffix={t('workCalendar.summary.unitHours')}
                            precision={1}
                            styles={{
                                content: {
                                    color: token.colorPrimary,
                                    fontWeight: 700,
                                    fontSize: 28,
                                },
                            }}
                            prefix={
                                <ClockCircleOutlined
                                    style={{ marginRight: 8, color: token.colorPrimary }}
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
