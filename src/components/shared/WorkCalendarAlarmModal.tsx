'use client';

import React, { useEffect, useState } from 'react';
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
import { WorkCalendarAlarmResponse } from '@/types/WorkCalendar';
import { statusColors } from '@/configs/antdTheme';

const { Paragraph, Text, Title } = Typography;

export const WorkCalendarAlarmModal: React.FC = () => {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isDark = token.colorBgContainer !== '#ffffff';
    const sc = isDark ? statusColors.dark : statusColors.light;

    const [open, setOpen] = useState<boolean>(false);
    const [alarmData, setAlarmData] = useState<WorkCalendarAlarmResponse | null>(null);

    const isWorkCalendarPage = Boolean(pathname?.startsWith('/admin/work-calendar'));
    const isPlanner = Boolean(user?.roles?.some((r) => r.toLowerCase() === 'planner'));

    useEffect(() => {
        // ONLY users with PLANNER role receive/see the work calendar alarm popup
        if (!isPlanner || isWorkCalendarPage) return;

        const runCheck = async () => {
            try {
                const res = await WorkCalendarService.checkAlarm();
                if (!res?.shouldShowAlarm) return;

                // Dismissal is scoped to the specific target month: the reminder can point
                // at a different month later in the same tab session (e.g. crossing the
                // day-25 rollover), so a stale dismissal must not suppress a new one.
                const dismissKey = `has_seen_calendar_popup_${res.targetYear}-${res.targetMonth}`;
                if (sessionStorage.getItem(dismissKey) === 'true') return;

                setAlarmData(res);
                setOpen(true);
            } catch (err) {
                // Silently ignore alarm fetch errors on dashboard load
            }
        };

        runCheck();
    }, [isPlanner, isWorkCalendarPage]);

    if (!isPlanner || isWorkCalendarPage || !open || !alarmData?.shouldShowAlarm) {
        return null;
    }

    const targetYear = alarmData.targetYear;
    const targetMonth = alarmData.targetMonth;
    const dismissKey = `has_seen_calendar_popup_${targetYear}-${targetMonth}`;

    const handleConfigureNow = () => {
        sessionStorage.setItem(dismissKey, 'true');
        setOpen(false);
        router.push(`/admin/work-calendar?year=${targetYear}&month=${targetMonth}`);
    };

    const handleCloseLater = () => {
        sessionStorage.setItem(dismissKey, 'true');
        setOpen(false);
    };

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
                {/* Warning Icon Container using Theme Tokens */}
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

                {/* Eyebrow Tag */}
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

                {/* Modal Title */}
                <Title level={4} style={{ margin: '0 0 12px 0', color: token.colorTextHeading }}>
                    {t('workCalendar.alarm.modalTitle')}
                </Title>

                {/* Highlighted Target Month Banner Card using Theme Status Colors */}
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
                                month: targetMonth,
                                year: targetYear,
                            })}
                        </Text>
                        <Text
                            type="secondary"
                            style={{ fontSize: 12, color: token.colorTextSecondary }}
                        >
                            {t('workCalendar.alarm.targetSub', { month: targetMonth })}
                        </Text>
                    </div>
                </div>

                {/* Modal Description */}
                <Paragraph
                    style={{
                        color: token.colorTextSecondary,
                        fontSize: 14,
                        lineHeight: 1.5,
                        margin: '0 0 24px 0',
                    }}
                >
                    {t('workCalendar.alarm.modalDesc', { month: targetMonth })}
                </Paragraph>

                {/* Structured Action Buttons Layout */}
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
