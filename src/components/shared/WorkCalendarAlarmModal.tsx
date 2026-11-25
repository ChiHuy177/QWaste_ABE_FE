'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Typography, Tag, theme } from 'antd';
import {
    WarningFilled,
    ArrowRightOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { WorkCalendarService } from '@/services/WorkCalendarService';
import { statusColors } from '@/configs/antdTheme';
import { useTheme } from '@/hooks/useTheme';
import dayjs from 'dayjs';

const { Paragraph, Text, Title } = Typography;

interface UnconfirmedMonthItem {
    year: number;
    month: number;
}

export const WorkCalendarAlarmModal: React.FC = () => {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const { resolvedTheme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isDark = resolvedTheme === 'dark';
    const sc = isDark ? statusColors.dark : statusColors.light;

    const [open, setOpen] = useState<boolean>(false);
    const [unconfirmedMonths, setUnconfirmedMonths] = useState<UnconfirmedMonthItem[]>([]);
    const lastCheckedUserIdRef = useRef<number | string | null>(null);

    const isWorkCalendarPage = Boolean(pathname?.startsWith('/admin/work-calendar'));
    const isPlanner = Boolean(user?.roles?.some((r) => r.toLowerCase() === 'planner'));

    const today = dayjs();
    const candidateMonths: UnconfirmedMonthItem[] = [
        {
            year: today.year(),
            month: today.month() + 1,
        },
    ];

    if (today.date() >= 25) {
        const nextMonthDate = today.add(1, 'month');
        candidateMonths.push({
            year: nextMonthDate.year(),
            month: nextMonthDate.month() + 1,
        });
    }

    const sessionKey = `has_seen_calendar_popup_${user?.userId ?? ''}_${candidateMonths.map((m) => `${m.year}-${m.month}`).join('_')}`;

    useEffect(() => {
        if (!isPlanner || isWorkCalendarPage) return;
        if (lastCheckedUserIdRef.current === (user?.userId ?? null)) return;
        lastCheckedUserIdRef.current = user?.userId ?? null;

        if (sessionStorage.getItem(sessionKey) === 'true') {
            return;
        }

        const runCheck = async () => {
            const unconfirmedList: UnconfirmedMonthItem[] = [];

            for (const item of candidateMonths) {
                try {
                    const monthData = await WorkCalendarService.getMonthCalendar(
                        item.year,
                        item.month
                    );
                    if (!monthData?.isConfirmed) {
                        unconfirmedList.push(item);
                    }
                } catch {}
            }

            if (unconfirmedList.length === 0) {
                setOpen(false);
                setUnconfirmedMonths([]);
                return;
            }

            setUnconfirmedMonths(unconfirmedList);
            setOpen(true);
        };

        runCheck();
    }, [isPlanner, isWorkCalendarPage, sessionKey, user?.userId]);

    if (!isPlanner || isWorkCalendarPage || !open || unconfirmedMonths.length === 0) {
        return null;
    }

    const handleDismiss = () => {
        sessionStorage.setItem(sessionKey, 'true');
        setOpen(false);
    };

    const handleNavigateToMonth = (year: number, month: number) => {
        handleDismiss();
        router.push(`/admin/work-calendar?year=${year}&month=${month}`);
    };

    const handleConfigureNow = () => {
        if (unconfirmedMonths.length > 0) {
            handleNavigateToMonth(unconfirmedMonths[0].year, unconfirmedMonths[0].month);
        } else {
            handleDismiss();
        }
    };

    const handleCloseLater = () => {
        handleDismiss();
    };

    const monthsString = unconfirmedMonths
        .map((item) =>
            t('workCalendar.alarm.monthYearFormat', {
                month: item.month,
                year: item.year,
                defaultValue: `Tháng ${item.month}/${item.year}`,
            })
        )
        .join(', ');

    return (
        <Modal
            open={open}
            onCancel={handleCloseLater}
            footer={null}
            destroyOnHidden
            centered
            width={460}
            styles={{
                body: {
                    padding: '28px 24px',
                    borderRadius: token.borderRadiusLG,
                },
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: token.colorWarningBg,
                            border: `1px solid ${token.colorWarningBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <WarningFilled style={{ fontSize: 30, color: token.colorWarning }} />
                    </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                    <Tag
                        bordered
                        style={{
                            borderRadius: token.borderRadiusSM,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            background: token.colorWarningBg,
                            borderColor: token.colorWarningBorder,
                            color: sc.idle.base,
                        }}
                    >
                        {t('workCalendar.alarm.eyebrow')}
                    </Tag>
                </div>

                <Title level={4} style={{ margin: '0 0 12px 0', color: token.colorTextHeading }}>
                    {t('workCalendar.alarm.modalTitle')}
                </Title>

                {unconfirmedMonths.length === 1 ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            borderRadius: token.borderRadius,
                            margin: '16px 0 20px 0',
                            background: sc.idle.bg,
                            border: `1px solid ${sc.idle.border}`,
                            textAlign: 'left',
                        }}
                    >
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: token.borderRadiusSM,
                                background: token.colorWarningBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <CalendarOutlined style={{ fontSize: 18, color: sc.idle.base }} />
                        </div>
                        <div>
                            <Text
                                strong
                                style={{
                                    fontSize: 14,
                                    color: token.colorTextHeading,
                                    display: 'block',
                                }}
                            >
                                {t('workCalendar.alarm.targetNotice', {
                                    month: unconfirmedMonths[0].month,
                                    year: unconfirmedMonths[0].year,
                                })}
                            </Text>
                            <Text
                                type="secondary"
                                style={{ fontSize: 12, color: token.colorTextSecondary }}
                            >
                                {t('workCalendar.alarm.targetSub', {
                                    month: unconfirmedMonths[0].month,
                                })}
                            </Text>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            margin: '16px 0 20px 0',
                        }}
                    >
                        <div
                            style={{
                                padding: '8px 12px',
                                borderRadius: token.borderRadiusSM,
                                background: token.colorWarningBg,
                                border: `1px solid ${token.colorWarningBorder}`,
                                textAlign: 'left',
                                marginBottom: 2,
                            }}
                        >
                            <Text strong style={{ fontSize: 13, color: sc.idle.base }}>
                                {t('workCalendar.alarm.targetNoticeMultiple', {
                                    count: unconfirmedMonths.length,
                                    defaultValue: `Có ${unconfirmedMonths.length} tháng chưa chốt lịch làm việc`,
                                })}
                            </Text>
                        </div>
                        {unconfirmedMonths.map((item) => (
                            <div
                                key={`${item.year}-${item.month}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    borderRadius: token.borderRadius,
                                    background: sc.idle.bg,
                                    border: `1px solid ${sc.idle.border}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CalendarOutlined
                                        style={{ fontSize: 18, color: sc.idle.base }}
                                    />
                                    <div style={{ textAlign: 'left' }}>
                                        <Text
                                            strong
                                            style={{
                                                fontSize: 13.5,
                                                color: token.colorTextHeading,
                                                display: 'block',
                                            }}
                                        >
                                            {t('workCalendar.alarm.monthYearFormat', {
                                                month: item.month,
                                                year: item.year,
                                                defaultValue: `Tháng ${item.month}/${item.year}`,
                                            })}
                                        </Text>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 11.5,
                                                color: token.colorTextSecondary,
                                            }}
                                        >
                                            {t('workCalendar.alarm.targetSub', {
                                                month: item.month,
                                            })}
                                        </Text>
                                    </div>
                                </div>
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => handleNavigateToMonth(item.year, item.month)}
                                    style={{ padding: 0, fontWeight: 600 }}
                                >
                                    {t('workCalendar.alarm.btnGoToConfigure', 'Cấu hình')} &rarr;
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <Paragraph
                    style={{
                        color: token.colorTextSecondary,
                        fontSize: 14,
                        lineHeight: 1.5,
                        margin: '0 0 24px 0',
                    }}
                >
                    {unconfirmedMonths.length > 1
                        ? t('workCalendar.alarm.modalDescMultiple', {
                              months: monthsString,
                              defaultValue: `Lịch làm việc cho (${monthsString}) chưa được chốt. Vui lòng rà soát và chốt lịch để hệ thống tính hiệu suất chính xác.`,
                          })
                        : t('workCalendar.alarm.modalDesc', {
                              month: unconfirmedMonths[0]?.month,
                          })}
                </Paragraph>

                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                    <Button
                        onClick={handleCloseLater}
                        icon={<ClockCircleOutlined />}
                        style={{
                            flex: 1,
                            height: 40,
                            borderRadius: token.borderRadius,
                            fontWeight: 500,
                        }}
                    >
                        {t('workCalendar.alarm.btnCloseLater')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleConfigureNow}
                        icon={<ArrowRightOutlined />}
                        iconPlacement="end"
                        style={{
                            flex: 1.3,
                            height: 40,
                            borderRadius: token.borderRadius,
                            fontWeight: 600,
                            boxShadow: token.boxShadowSecondary,
                        }}
                    >
                        {t('workCalendar.alarm.btnConfigureNow')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
