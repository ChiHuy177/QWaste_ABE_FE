'use client';
import type { IncidentReport, IncidentStatus } from '@/types/IncidentReport';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    RobotOutlined,
    BuildOutlined,
} from '@ant-design/icons';
import type { TFunction } from 'i18next';
import dayjs from 'dayjs';

const { Text } = Typography;

export type IncidentColumnProps = {
    t?: TFunction;
    // onView?: (record: IncidentReport) => void;
    onEdit?: (record: IncidentReport) => void;
    onDelete?: (record: IncidentReport) => void;
    isMobile?: boolean;
};

const STATUS_I18N_KEY: Record<IncidentStatus, string> = {
    ALL: 'maintenance.status.all',
    OPEN: 'maintenance.status.open',
    IN_PROGRESS: 'maintenance.status.inProgress',
    RESOLVED: 'maintenance.status.resolved',
};

export const STATUS_TAG_COLOR: Record<IncidentStatus, string> = {
    ALL: 'default',
    OPEN: 'orange',
    IN_PROGRESS: 'blue',
    RESOLVED: 'green',
};

export const STATUS_LABEL: Record<IncidentStatus, string> = {
    ALL: 'All Statuses',
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
};

export const STATUS_BAR_COLOR: Record<IncidentStatus, string> = {
    ALL: '#8C8C8C',
    OPEN: '#d46b08',
    IN_PROGRESS: '#074695',
    RESOLVED: '#1F7A4D',
};

const StatusDot = ({ status }: { status: IncidentStatus }) => {
    const isActive = status === 'OPEN' || status === 'IN_PROGRESS';
    const color = STATUS_BAR_COLOR[status];
    return (
        <span
            style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: color,
                marginRight: 6,
                flexShrink: 0,
                boxShadow: isActive ? `0 0 0 3px ${color}33` : undefined,
            }}
        />
    );
};

export const getIncidentColumns = (props?: IncidentColumnProps): ColumnsType<IncidentReport> => {
    const columns: ColumnsType<IncidentReport> = [
        // ── Report No. ───────────────────────────────────────────────────────
        {
            title: props?.t?.('maintenance.list.table.reportNo') ?? 'Report No.',
            dataIndex: 'reportNumber',
            key: 'reportNumber',
            width: 155,
            fixed: 'left',
            render: (text: string, record: IncidentReport) => (
                <a
                    // onClick={() => props?.onView?.(record)}
                    style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}
                >
                    {text}
                </a>
            ),
        },

        // ── Machine / Mold ───────────────────────────────────────────────────
        {
            title: props?.t?.('maintenance.list.table.machineMold') ?? 'Machine / Mold',
            key: 'target',
            width: 210,
            ellipsis: { showTitle: false },
            render: (_: unknown, record: IncidentReport) => {
                const isMachine = record.classification === 'MACHINE';
                const name = record.machine?.machineName ?? record.mold?.moldName ?? '-';
                const code = record.machine?.machineCode ?? record.mold?.moldCode;
                return (
                    <Tooltip title={code ? `${name} (#${code})` : name}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    backgroundColor: isMachine ? '#e8f0fe' : '#f3e8fd',
                                    flexShrink: 0,
                                    fontSize: 14,
                                    color: isMachine ? '#1a56db' : '#7c3aed',
                                }}
                            >
                                {isMachine ? <RobotOutlined /> : <BuildOutlined />}
                            </span>
                            <div style={{ minWidth: 0 }}>
                                <Text strong style={{ fontSize: 13, display: 'block' }}>
                                    {name}
                                </Text>
                                {code && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        #{code}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </Tooltip>
                );
            },
        },

        // ── Error Group ──────────────────────────────────────────────────────
        {
            title: props?.t?.('maintenance.list.table.errorGroup') ?? 'Error Group',
            dataIndex: ['errorGroup', 'errorGroupName'],
            key: 'errorGroup',
            width: 175,
            ellipsis: { showTitle: false },
            render: (text: string) => (
                <Tooltip title={text}>
                    <Tag
                        color="volcano"
                        style={{
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            verticalAlign: 'middle',
                            marginInlineEnd: 0,
                        }}
                    >
                        {text}
                    </Tag>
                </Tooltip>
            ),
        },

        // ── Error Detail ─────────────────────────────────────────────────────
        {
            title: props?.t?.('maintenance.list.table.errorDetail') ?? 'Error Detail',
            key: 'errorDetail',
            width: 200,
            ellipsis: { showTitle: false },
            render: (_: unknown, record: IncidentReport) => (
                <Tooltip
                    title={`[${record.errorDetail.errorCode}] ${record.errorDetail.errorName}`}
                >
                    <div>
                        <Text style={{ fontSize: 13, display: 'block' }}>
                            {record.errorDetail.errorName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            {record.errorDetail.errorCode}
                        </Text>
                    </div>
                </Tooltip>
            ),
        },

        // ── Description ──────────────────────────────────────────────────────
        {
            title: props?.t?.('maintenance.list.table.description') ?? 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 210,
            ellipsis: { showTitle: false },
            render: (text: string) => (
                <Tooltip title={text}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },

        // ── Status ───────────────────────────────────────────────────────────
        {
            title: props?.t?.('maintenance.list.table.status') ?? 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            align: 'center',
            render: (value: IncidentStatus) => (
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        borderRadius: 20,
                        border: `1px solid ${STATUS_BAR_COLOR[value]}44`,
                        backgroundColor: `${STATUS_BAR_COLOR[value]}11`,
                        gap: 0,
                    }}
                >
                    <StatusDot status={value} />
                    <Text style={{ fontSize: 12, fontWeight: 500, color: STATUS_BAR_COLOR[value] }}>
                        {props?.t?.(STATUS_I18N_KEY[value]) ?? STATUS_LABEL[value]}
                    </Text>
                </div>
            ),
        },

        // ── Reported By ──────────────────────────────────────────────────────
        {
            title: props?.t?.('maintenance.list.table.reportedBy') ?? 'Reported By',
            dataIndex: 'reportedByName',
            key: 'reportedByName',
            width: 140,
            ellipsis: { showTitle: false },
            render: (text: string) => (
                <Tooltip title={text}>
                    <Text style={{ fontSize: 13 }}>{text}</Text>
                </Tooltip>
            ),
        },

        // ── Reported At ──────────────────────────────────────────────────────
        {
            title: props?.t?.('maintenance.list.table.reportedAt') ?? 'Reported At',
            dataIndex: 'reportedAt',
            key: 'reportedAt',
            width: 140,
            sorter: (a, b) => a.reportedAt.localeCompare(b.reportedAt),
            defaultSortOrder: 'descend',
            render: (value: string) => (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {dayjs(value).format('DD/MM/YYYY HH:mm')}
                </Text>
            ),
        },

        // ── Actions ──────────────────────────────────────────────────────────
        {
            title: '',
            key: 'actions',
            width: 110,
            align: 'center',
            fixed: 'right',
            render: (_: unknown, record: IncidentReport) => (
                <Space size={4}>
                    {/* <Tooltip title="View details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => props?.onView?.(record)}
                            style={{ color: '#595959' }}
                        />
                    </Tooltip> */}
                    <Tooltip title="Edit report">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => props?.onEdit?.(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => props?.onDelete?.(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return columns;
};
