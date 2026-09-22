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
import { MachineErrorDetailItem } from '@/types/Monitoring';
import { formatHours, formatIncidentTimeRange } from '../errorAnalyticsUtils';

const { Text } = Typography;

export interface IncidentHistoryTableProps {
    filteredErrorDetails: MachineErrorDetailItem[];
    loading: boolean;
    errorDateRange: [Dayjs | null, Dayjs | null] | null;
    onErrorDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
    disabledDate: (current: Dayjs) => boolean;
    startDate: string;
    endDate: string;
    isMobile: boolean;
}

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = React.memo(
    ({
        filteredErrorDetails,
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
        const errorColumns: ColumnsType<MachineErrorDetailItem> = useMemo(
            () => [
                {
                    title: t('factoryOverview.table.header.start') || 'Thời gian sự cố',
                    key: 'timeRange',
                    width: isMobile ? 155 : 175,
                    sorter: (a, b) =>
                        new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime(),
                    render: (_: any, record: MachineErrorDetailItem) => {
                        const { time, date } = formatIncidentTimeRange(
                            record.startTime,
                            record.endTime
                        );
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    minWidth: 0,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <CalendarOutlined
                                        style={{
                                            fontSize: 11,
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
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 12,
                                        paddingLeft: 16,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {time}
                                </Text>
                            </div>
                        );
                    },
                },
                {
                    title: t('factoryOverview.table.header.errorName') || 'Tên lỗi',
                    dataIndex: 'errorName',
                    key: 'errorName',
                    width: isMobile ? 150 : 175,
                    ellipsis: true,
                    render: (name: string) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <WarningOutlined
                                style={{ color: token.colorError, fontSize: 13, flexShrink: 0 }}
                            />
                            <Text
                                style={{ fontSize: 12.5, color: token.colorTextHeading }}
                                ellipsis={{ tooltip: name }}
                            >
                                {name ||
                                    t('factoryOverview.modal.unknownIncident') ||
                                    'Sự cố dừng máy không xác định'}
                            </Text>
                        </div>
                    ),
                },
                {
                    title: t('factoryOverview.table.header.errorReason') || 'Nguyên nhân lỗi',
                    dataIndex: 'reason',
                    key: 'reason',
                    ellipsis: true,
                    render: (_: any, record: MachineErrorDetailItem) => {
                        const reasonText =
                            record.reason ||
                            record.errorReason ||
                            record.cause ||
                            record.description ||
                            t('factoryOverview.modal.unrecordedReason') ||
                            'Chưa ghi nhận';
                        return (
                            <Text
                                type={record.reason ? undefined : 'secondary'}
                                style={{ fontSize: 12.5 }}
                                ellipsis={{ tooltip: reasonText }}
                            >
                                {reasonText}
                            </Text>
                        );
                    },
                },
                {
                    title: t('factoryOverview.table.header.duration') || 'Thời gian',
                    dataIndex: 'durationHours',
                    key: 'durationHours',
                    align: 'right' as const,
                    width: isMobile ? 85 : 95,
                    sorter: (a, b) =>
                        (Number(a.durationHours) || 0) - (Number(b.durationHours) || 0),
                    render: (v: number) => {
                        const hours = Number(v) || 0;
                        return (
                            <Tag
                                color={hours >= 2 ? 'error' : 'warning'}
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    borderRadius: 6,
                                    fontWeight: 600,
                                    padding: '0 6px',
                                }}
                            >
                                {formatHours(hours)}
                            </Tag>
                        );
                    },
                },
            ],
            [token, t, isMobile]
        );

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
                                {t('factoryOverview.modal.errorHistoryTitle') ||
                                    t('factoryOverview.table.title.errorHistory') ||
                                    'Lịch sử sự cố & cảnh báo'}
                            </Text>
                        </div>
                        <Tag
                            color={filteredErrorDetails.length > 0 ? 'error' : 'success'}
                            style={{
                                borderRadius: 10,
                                margin: 0,
                                fontSize: 11,
                                fontWeight: 600,
                                flexShrink: 0,
                            }}
                        >
                            {t('factoryOverview.modal.incidentCount', {
                                count: filteredErrorDetails.length,
                            }) || `${filteredErrorDetails.length} sự cố`}
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
                                t('factoryOverview.filter.startDate') || 'Từ ngày',
                                t('factoryOverview.filter.endDate') || 'Đến ngày',
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
                <Table<MachineErrorDetailItem>
                    className="full-height-table"
                    loading={loading}
                    columns={errorColumns}
                    dataSource={filteredErrorDetails}
                    rowKey={(record, index) => record.id?.toString() || index?.toString() || ''}
                    pagination={
                        filteredErrorDetails.length > 10
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
                        x: isMobile ? 510 : undefined,
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
                                    {errorDateRange && errorDateRange[0] && errorDateRange[1]
                                        ? t('factoryOverview.modal.noIncidentsInRange') ||
                                          'Không có sự cố trong khoảng ngày đã chọn'
                                        : t('factoryOverview.modal.noErrorData') ||
                                          t('factoryOverview.table.noErrorData') ||
                                          'Không phát sinh sự cố lỗi'}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: token.colorTextSecondary,
                                        marginTop: 4,
                                    }}
                                >
                                    {t('factoryOverview.modal.stableOperationDesc') ||
                                        'Thiết bị hoạt động ổn định trong khoảng thời gian đã chọn'}
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
