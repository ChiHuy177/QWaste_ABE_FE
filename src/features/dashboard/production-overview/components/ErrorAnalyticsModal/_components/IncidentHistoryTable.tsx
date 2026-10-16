'use client';

import React, { useMemo } from 'react';
import { Table, Typography, Tag, DatePicker, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    HistoryOutlined,
    CalendarOutlined,
    WarningOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { DowntimeMachineIncidentItem } from '@/types/Downtime';
import { formatIncidentTimeRange, formatMinutesToDuration } from '../errorAnalyticsUtils';

const { Text } = Typography;

export interface IncidentHistoryTableProps {
    incidents: DowntimeMachineIncidentItem[];
    totalIncidents?: number;
    loading: boolean;
    errorDateRange: [Dayjs | null, Dayjs | null] | null;
    onErrorDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
    disabledDate: (current: Dayjs) => boolean;
    startDate?: string;
    endDate?: string;
    isMobile: boolean;
}

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = React.memo(
    ({
        incidents,
        totalIncidents,
        loading,
        errorDateRange,
        onErrorDateRangeChange,
        disabledDate,
        startDate,
        endDate,
        isMobile,
    }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        // Columns definition for the Incident / Error Table
        const errorColumns: ColumnsType<DowntimeMachineIncidentItem> = useMemo(
            () => [
                {
                    title: t('productionOverview.downtimeModal.colIncidentCode', 'Mã sự cố'),
                    dataIndex: 'incidentCode',
                    key: 'incidentCode',
                    width: isMobile ? 115 : 135,
                    render: (code: string) => (
                        <Text strong style={{ fontSize: 12.5, color: token.colorPrimary }}>
                            {code || '—'}
                        </Text>
                    ),
                },
                {
                    title: t('productionOverview.downtimeModal.colStart'),
                    key: 'startTime',
                    width: isMobile ? 150 : 175,
                    sorter: (a, b) =>
                        new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime(),
                    render: (_: any, record: DowntimeMachineIncidentItem) => {
                        const { time, date, isOngoing } = formatIncidentTimeRange(
                            record.startTime,
                            record.endTime
                        );
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                    minWidth: 0,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CalendarOutlined
                                        style={{
                                            fontSize: 12,
                                            color: token.colorPrimary,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 12.5,
                                            color: token.colorTextHeading,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {date || '—'}
                                    </Text>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        paddingLeft: 18,
                                    }}
                                >
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {time}
                                    </Text>
                                    {isOngoing && (
                                        <Tag
                                            color="error"
                                            bordered={false}
                                            style={{
                                                fontSize: 10.5,
                                                padding: '0 5px',
                                                borderRadius: 4,
                                                lineHeight: '16px',
                                                margin: 0,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {t('productionOverview.downtimeModal.ongoing')}
                                        </Tag>
                                    )}
                                </div>
                            </div>
                        );
                    },
                },
                {
                    title: t('productionOverview.downtimeModal.colRootCause'),
                    dataIndex: 'rootCause',
                    key: 'rootCause',
                    ellipsis: true,
                    render: (rootCause: string | null) => {
                        const isRecorded = Boolean(rootCause?.trim());
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    minWidth: 0,
                                }}
                            >
                                <WarningOutlined
                                    style={{
                                        color: isRecorded
                                            ? token.colorError
                                            : token.colorTextQuaternary,
                                        fontSize: 13,
                                        flexShrink: 0,
                                    }}
                                />
                                <Text
                                    type={isRecorded ? undefined : 'secondary'}
                                    style={{
                                        fontSize: 12.5,
                                        color: isRecorded
                                            ? token.colorText
                                            : token.colorTextTertiary,
                                    }}
                                    ellipsis={{
                                        tooltip:
                                            rootCause ||
                                            t('productionOverview.downtimeModal.unrecordedReason'),
                                    }}
                                >
                                    {rootCause ||
                                        t('productionOverview.downtimeModal.unrecordedReason')}
                                </Text>
                            </div>
                        );
                    },
                },
                {
                    title: t('productionOverview.downtimeModal.colDuration'),
                    key: 'duration',
                    align: 'right' as const,
                    width: isMobile ? 85 : 95,
                    sorter: (a, b) => (a.durationMinutes || 0) - (b.durationMinutes || 0),
                    render: (_: any, record: DowntimeMachineIncidentItem) => {
                        const durationText =
                            record.formattedDuration ||
                            formatMinutesToDuration(record.durationMinutes);
                        const isHighDuration = (record.durationMinutes || 0) >= 120;
                        return (
                            <Tag
                                color={isHighDuration ? 'error' : 'warning'}
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    borderRadius: 6,
                                    fontWeight: 600,
                                    padding: '0 6px',
                                }}
                            >
                                {durationText}
                            </Tag>
                        );
                    },
                },
            ],
            [token, t, isMobile]
        );

        const displayedCount = totalIncidents ?? incidents.length;

        return (
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadiusLG,
                    overflow: 'hidden',
                    minHeight: 0,
                    background: token.colorBgContainer,
                }}
            >
                {/* Header toolbar */}
                <div
                    style={{
                        padding: isMobile ? '8px 12px' : '10px 16px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        background: token.colorFillAlter,
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'stretch' : 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        gap: isMobile ? 8 : 12,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            minWidth: 0,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <HistoryOutlined
                                style={{
                                    color: token.colorPrimary,
                                    fontSize: 15,
                                    flexShrink: 0,
                                }}
                            />
                            <Text
                                strong
                                style={{
                                    fontSize: isMobile ? 13 : 14,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {t('productionOverview.downtimeModal.incidentHistory')}
                            </Text>
                        </div>
                        <Tag
                            color={displayedCount > 0 ? 'error' : 'success'}
                            style={{
                                borderRadius: 10,
                                margin: 0,
                                fontSize: 11,
                                fontWeight: 600,
                                flexShrink: 0,
                            }}
                        >
                            {t('productionOverview.downtimeModal.incidentCount', {
                                count: displayedCount,
                            })}
                        </Tag>
                    </div>

                    {/* Date range picker locked within outer bounds */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: isMobile ? '100%' : 'auto',
                        }}
                    >
                        <DatePicker.RangePicker
                            size="small"
                            value={errorDateRange}
                            onChange={(dates) =>
                                onErrorDateRangeChange(dates as [Dayjs | null, Dayjs | null] | null)
                            }
                            disabledDate={disabledDate}
                            minDate={startDate ? dayjs(startDate).startOf('day') : undefined}
                            maxDate={endDate ? dayjs(endDate).endOf('day') : undefined}
                            format="DD/MM/YYYY"
                            placeholder={[
                                t('productionOverview.downtimeModal.startDate'),
                                t('productionOverview.downtimeModal.endDate'),
                            ]}
                            allowClear
                            style={{
                                width: isMobile ? '100%' : 220,
                                borderRadius: token.borderRadiusSM,
                            }}
                        />
                    </div>
                </div>

                {/* Ant Design Table */}
                <Table<DowntimeMachineIncidentItem>
                    className="full-height-table"
                    loading={loading}
                    columns={errorColumns}
                    dataSource={incidents}
                    rowKey={(record) =>
                        record.incidentCode || `${record.startTime}_${record.durationMinutes}`
                    }
                    pagination={
                        incidents.length > 10
                            ? {
                                  pageSize: 10,
                                  size: 'small',
                                  showSizeChanger: false,
                                  style: {
                                      textAlign: 'center',
                                      display: 'flex',
                                      justifyContent: 'center',
                                      width: '100%',
                                      padding: '6px 0',
                                  },
                              }
                            : false
                    }
                    size="small"
                    scroll={{
                        x: isMobile ? 500 : undefined,
                        y: isMobile ? 'calc(100vh - 380px)' : 'calc(88vh - 270px)',
                    }}
                    style={{
                        height: isMobile ? 'auto' : '100%',
                        margin: 0,
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '24px 16px' }}>
                                <CheckCircleOutlined
                                    style={{
                                        fontSize: 28,
                                        color: token.colorSuccess,
                                        marginBottom: 8,
                                    }}
                                />
                                <div
                                    style={{
                                        fontWeight: 500,
                                        color: token.colorText,
                                        fontSize: 13,
                                    }}
                                >
                                    {t('productionOverview.downtimeModal.noIncidents')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: token.colorTextSecondary,
                                        marginTop: 4,
                                    }}
                                >
                                    {t('productionOverview.downtimeModal.operatingNormally')}
                                </div>
                            </div>
                        ),
                    }}
                />
            </div>
        );
    }
);

IncidentHistoryTable.displayName = 'IncidentHistoryTable';
