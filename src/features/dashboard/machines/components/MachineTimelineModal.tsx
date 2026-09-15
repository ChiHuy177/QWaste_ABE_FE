'use client';

import React, { useMemo } from 'react';
import { Modal, Typography, Tag, Flex, Empty, Row, Col, Divider, Space, Spin } from 'antd';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined,
    StopOutlined,
    ThunderboltOutlined,
    FieldTimeOutlined,
    UserOutlined,
    CheckCircleOutlined,
    RiseOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { theme } from 'antd';
import { MachineOverview } from '@/types/Machine';
const { Title, Text } = Typography;

interface MachineTimelineModalProps {
    open: boolean;
    onClose: () => void;
    machine: MachineOverview | null;
    loading?: boolean;
    filterInfo?: {
        factoryName?: string;
        zoneCode?: string;
        timePeriod?: string;
        timePeriodValue?: string;
    };
}

const MachineTimelineModal: React.FC<MachineTimelineModalProps> = ({
    open,
    onClose,
    machine,
    loading,
    filterInfo,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    // Muted, professional color palette
    const statusConfig = useMemo(
        () => ({
            RUNTIME: {
                color: '#3D8A6B', // Muted green
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(61, 138, 107, 0.08)',
                text: t('machineManagement.statuses.running') || 'Vận hành',
                icon: PlayCircleOutlined,
            },
            IDLE: {
                color: '#C4883A', // Muted amber/orange
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(196, 136, 58, 0.08)',
                text: t('machineManagement.statuses.idle') || 'Chờ',
                icon: PauseCircleOutlined,
            },
            ERROR: {
                color: '#C75454', // Muted red
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(199, 84, 84, 0.08)',
                text: t('machineManagement.statuses.error') || 'Lỗi',
                icon: CloseCircleOutlined,
            },
            OFFLINE: {
                color: token.colorTextTertiary,
                bgColor: token.colorBgContainer,
                lightBg: token.colorBgLayout,
                text: t('machineManagement.statuses.offline') || 'Offline',
                icon: StopOutlined,
            },
            COMPLETE: {
                color: '#3D8A6B', // Muted green
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(61, 138, 107, 0.08)',
                text: t('machineManagement.statuses.complete') || 'Hoàn thành',
                icon: CheckCircleOutlined,
            },
            TEMPORARY_STOP: {
                color: '#C4883A', // Muted amber/orange
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(196, 136, 58, 0.08)',
                text: t('machineManagement.statuses.temporaryStop') || 'Tạm dừng',
                icon: PauseCircleOutlined,
            },
            OPEN_DOOR: {
                color: token.colorInfo,
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(24, 144, 255, 0.08)',
                text: t('machineManagement.statuses.openDoor') || 'Mở cửa',
                icon: StopOutlined,
            },
            WARNING: {
                color: '#faad14',
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(250, 173, 20, 0.08)',
                text: t('machineManagement.statuses.warning') || 'Cảnh báo',
                icon: WarningOutlined,
            },
            UNKNOWN: {
                color: token.colorTextTertiary,
                bgColor: token.colorBgContainer,
                lightBg: token.colorBgLayout,
                text: t('machineManagement.timeline.unknown'),
                icon: StopOutlined,
            },
        }),
        [t, token]
    );

    const getStatusConfig = (status: string) => {
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.UNKNOWN;
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    };

    // Check if runtimeByStatus is empty
    const hasTimeData = useMemo(() => {
        if (!machine?.runtimeByStatus) return false;
        if (machine.runtimeByStatus instanceof Map) {
            return machine.runtimeByStatus.size > 0;
        }
        return Object.keys(machine.runtimeByStatus).length > 0;
    }, [machine?.runtimeByStatus]);

    const statsData = useMemo(() => {
        // If no runtimeByStatus data, return zeros
        if (!machine?.runtimeByStatus) {
            return {
                runtime: 0,
                idle: 0,
                error: 0,
                offline: 0,
                totalActive: 0,
                total: 0,
                runtimePercent: 0,
                idlePercent: 0,
                errorPercent: 0,
            };
        }

        // Helper function to get value from either Map or object
        const getRuntimeValue = (status: string): number => {
            if (machine.runtimeByStatus instanceof Map) {
                return machine.runtimeByStatus.get(status) || 0;
            }
            return (machine.runtimeByStatus as Record<string, number | undefined>)[status] || 0;
        };

        const totalRuntime = getRuntimeValue('RUNTIME');
        const totalIdle = getRuntimeValue('IDLE');
        const totalError = getRuntimeValue('ERROR');
        const totalOffline = getRuntimeValue('OFFLINE');

        const totalActiveSeconds = totalRuntime + totalIdle + totalError;
        const totalSeconds = totalActiveSeconds + totalOffline;

        return {
            runtime: totalRuntime,
            idle: totalIdle,
            error: totalError,
            offline: totalOffline,
            totalActive: totalActiveSeconds,
            total: totalSeconds,
            runtimePercent:
                totalActiveSeconds > 0
                    ? Number(((totalRuntime / totalActiveSeconds) * 100).toFixed(2))
                    : 0,
            idlePercent:
                totalActiveSeconds > 0
                    ? Number(((totalIdle / totalActiveSeconds) * 100).toFixed(2))
                    : 0,
            errorPercent:
                totalActiveSeconds > 0
                    ? Number(((totalError / totalActiveSeconds) * 100).toFixed(2))
                    : 0,
        };
    }, [machine?.runtimeByStatus]);

    const renderStats = () => {
        if (!statsData) {
            return <Empty description={t('machineManagement.timeline.noActivityData')} />;
        }

        // Check if machine is completely offline (no active time)
        const isCompletelyOffline = statsData.totalActive === 0 && statsData.offline > 0;

        const activeStatItems = [
            { status: 'RUNTIME', duration: statsData.runtime, percent: statsData.runtimePercent },
            { status: 'IDLE', duration: statsData.idle, percent: statsData.idlePercent },
            { status: 'ERROR', duration: statsData.error, percent: statsData.errorPercent },
        ];

        return (
            <div>
                {/* Progress Bar - Clean design - Only show if machine has active time */}
                {!isCompletelyOffline && (
                    <div style={{ marginBottom: token.marginLG }}>
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{ marginBottom: token.marginSM }}
                        >
                            <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
                                {t('machineManagement.timeline.timeDistribution')}
                            </Text>
                            <Text style={{ color: token.colorTextTertiary, fontSize: 12 }}>
                                {t('machineManagement.timeline.excludingOffline')}
                            </Text>
                        </Flex>

                        <Flex
                            style={{
                                width: '100%',
                                height: 32,
                                background: token.colorBgLayout,
                                borderRadius: token.borderRadius,
                                overflow: 'hidden',
                            }}
                            align="center"
                            justify="center"
                        >
                            {!hasTimeData ? (
                                <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
                                    {t('machineManagement.timeline.noTimeData')}
                                </Text>
                            ) : (
                                activeStatItems.map((item, index) => {
                                    const config = getStatusConfig(item.status);
                                    if (item.percent === 0) return null;

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                width: `${item.percent}%`,
                                                height: '100%',
                                                background: config.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'width 0.3s ease',
                                            }}
                                            title={`${config.text}: ${item.percent}%`}
                                        >
                                            {item.percent > 12 && (
                                                <Text
                                                    style={{
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {item.percent}%
                                                </Text>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </Flex>

                        {/* Legend */}
                        <Flex
                            gap={token.marginMD}
                            style={{ marginTop: token.marginSM }}
                            wrap="wrap"
                        >
                            {activeStatItems.map((item, index) => {
                                const config = getStatusConfig(item.status);
                                return (
                                    <Flex key={index} align="center" gap={6}>
                                        <div
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 2,
                                                background: config.color,
                                            }}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: token.colorTextSecondary,
                                            }}
                                        >
                                            {config.text}
                                        </Text>
                                    </Flex>
                                );
                            })}
                        </Flex>
                    </div>
                )}

                {/* Online/Offline Status Bar */}
                <div style={{ marginBottom: token.marginLG }}>
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ marginBottom: token.marginSM }}
                    >
                        <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
                            {t('machineManagement.timeline.onlineStatus')}
                        </Text>
                        <Text style={{ color: token.colorTextTertiary, fontSize: 12 }}>
                            {t('machineManagement.timeline.totalTime')}
                        </Text>
                    </Flex>

                    <Flex
                        style={{
                            width: '100%',
                            height: 32,
                            background: token.colorBgLayout,
                            borderRadius: token.borderRadius,
                            overflow: 'hidden',
                        }}
                        align="center"
                        justify="center"
                    >
                        {!hasTimeData ? (
                            <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
                                {t('machineManagement.timeline.noTimeData')}
                            </Text>
                        ) : (
                            <>
                                {/* Online portion */}
                                {statsData.totalActive > 0 && (
                                    <div
                                        style={{
                                            width: `${Math.round(
                                                (statsData.totalActive / statsData.total) * 100
                                            )}%`,
                                            height: '100%',
                                            background: token.colorSuccess,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'width 0.3s ease',
                                        }}
                                        title={`${t('machineManagement.timeline.online')}: ${Math.round(
                                            (statsData.totalActive / statsData.total) * 100
                                        )}%`}
                                    >
                                        {Math.round(
                                            (statsData.totalActive / statsData.total) * 100
                                        ) > 12 && (
                                                <Text
                                                    style={{
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {Math.round(
                                                        (statsData.totalActive / statsData.total) * 100
                                                    )}
                                                    %
                                                </Text>
                                            )}
                                    </div>
                                )}
                                {/* Offline portion */}
                                {statsData.offline > 0 && (
                                    <div
                                        style={{
                                            width: `${Math.round(
                                                (statsData.offline / statsData.total) * 100
                                            )}%`,
                                            height: '100%',
                                            background: token.colorTextDisabled,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'width 0.3s ease',
                                        }}
                                        title={`${t('machineManagement.statuses.offline')}: ${Math.round(
                                            (statsData.offline / statsData.total) * 100
                                        )}%`}
                                    >
                                        {Math.round((statsData.offline / statsData.total) * 100) >
                                            12 && (
                                                <Text
                                                    style={{
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {Math.round(
                                                        (statsData.offline / statsData.total) * 100
                                                    )}
                                                    %
                                                </Text>
                                            )}
                                    </div>
                                )}
                            </>
                        )}
                    </Flex>

                    {/* Legend */}
                    <Flex gap={token.marginMD} style={{ marginTop: token.marginSM }} wrap="wrap">
                        <Flex align="center" gap={6}>
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 2,
                                    background: token.colorSuccess,
                                }}
                            />
                            <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                {t('machineManagement.timeline.online')}
                            </Text>
                        </Flex>
                        <Flex align="center" gap={6}>
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 2,
                                    background: token.colorTextDisabled,
                                }}
                            />
                            <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                {t('machineManagement.statuses.offline')}
                            </Text>
                        </Flex>
                    </Flex>
                </div>

                {/* Stats Cards - Clean, minimal */}
                <Row gutter={[16, 16]}>
                    {activeStatItems.map((item, index) => {
                        const config = getStatusConfig(item.status);
                        const IconComp = config.icon;

                        return (
                            <Col xs={24} sm={8} key={index}>
                                <div
                                    style={{
                                        padding: token.padding,
                                        background: config.lightBg,
                                        borderRadius: token.borderRadius,
                                        borderLeft: `3px solid ${config.color}`,
                                    }}
                                >
                                    <Flex align="center" gap={10} style={{ marginBottom: 12 }}>
                                        <IconComp style={{ color: config.color, fontSize: 18 }} />
                                        <Text
                                            style={{
                                                color: config.color,
                                                fontWeight: 500,
                                                fontSize: 14,
                                            }}
                                        >
                                            {config.text}
                                        </Text>
                                    </Flex>

                                    <Flex justify="space-between" align="baseline">
                                        <div>
                                            <Text
                                                style={{
                                                    fontSize: 24,
                                                    fontWeight: 600,
                                                    color: token.colorText,
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}
                                            >
                                                {item.percent}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: token.colorTextTertiary,
                                                    marginLeft: 2,
                                                }}
                                            >
                                                %
                                            </Text>
                                        </div>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                color: token.colorTextSecondary,
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {formatDuration(item.duration)}
                                        </Text>
                                    </Flex>
                                </div>
                            </Col>
                        );
                    })}
                </Row>

                {/* Offline Card - Subtle */}
                {statsData.offline > 0 && (
                    <div
                        style={{
                            marginTop: token.margin,
                            padding: `${token.paddingSM}px ${token.padding}px`,
                            background: token.colorBgLayout,
                            borderRadius: token.borderRadius,
                        }}
                    >
                        <Flex align="center" justify="space-between">
                            <Flex align="center" gap={10}>
                                <StopOutlined
                                    style={{ color: token.colorTextTertiary, fontSize: 16 }}
                                />
                                <div>
                                    <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
                                        {t('machineManagement.statuses.offline')}
                                    </Text>
                                    <Text
                                        style={{
                                            display: 'block',
                                            fontSize: 11,
                                            color: token.colorTextTertiary,
                                        }}
                                    >
                                        {t('machineManagement.timeline.offlineNote')}
                                    </Text>
                                </div>
                            </Flex>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: token.colorTextSecondary,
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {formatDuration(statsData.offline)}
                            </Text>
                        </Flex>
                    </div>
                )}

                {/* Production Metrics Section */}
                <Divider style={{ margin: `${token.marginLG}px 0` }} />
                <div>
                    <Text
                        style={{
                            display: 'block',
                            fontSize: 14,
                            fontWeight: 500,
                            color: token.colorText,
                            marginBottom: token.marginMD,
                        }}
                    >
                        {t('machineManagement.timeline.productionMetrics')}
                    </Text>
                    <Row gutter={[16, 16]}>
                        {/* Operator Count */}
                        <Col xs={24} sm={8}>
                            <div
                                style={{
                                    padding: token.padding,
                                    background: token.colorBgContainer,
                                    borderRadius: token.borderRadius,
                                    border: `1px solid ${token.colorBorder}`,
                                }}
                            >
                                <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
                                    <UserOutlined
                                        style={{ color: token.colorPrimary, fontSize: 16 }}
                                    />
                                    <Text
                                        style={{
                                            color: token.colorTextSecondary,
                                            fontSize: 13,
                                        }}
                                    >
                                        {t('machineManagement.timeline.operatorCount')}
                                    </Text>
                                </Flex>
                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 600,
                                        color: token.colorText,
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {machine?.operatorCount || 0}
                                </Text>
                            </div>
                        </Col>

                        {/* Production Count */}
                        <Col xs={24} sm={8}>
                            <div
                                style={{
                                    padding: token.padding,
                                    background: token.colorBgContainer,
                                    borderRadius: token.borderRadius,
                                    border: `1px solid ${token.colorBorder}`,
                                }}
                            >
                                <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
                                    <CheckCircleOutlined
                                        style={{ color: token.colorSuccess, fontSize: 16 }}
                                    />
                                    <Text
                                        style={{
                                            color: token.colorTextSecondary,
                                            fontSize: 13,
                                        }}
                                    >
                                        {t('machineManagement.timeline.totalProductions')}
                                    </Text>
                                </Flex>
                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 600,
                                        color: token.colorText,
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {machine?.totalProductions || 0}
                                </Text>
                            </div>
                        </Col>

                        {/* Yields */}
                        <Col xs={24} sm={8}>
                            <div
                                style={{
                                    padding: token.padding,
                                    background: token.colorBgContainer,
                                    borderRadius: token.borderRadius,
                                    border: `1px solid ${token.colorBorder}`,
                                }}
                            >
                                <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
                                    <RiseOutlined
                                        style={{ color: token.colorWarning, fontSize: 16 }}
                                    />
                                    <Text
                                        style={{
                                            color: token.colorTextSecondary,
                                            fontSize: 13,
                                        }}
                                    >
                                        {t('machineManagement.timeline.yields')}
                                    </Text>
                                </Flex>
                                <Flex align="baseline" gap={4}>
                                    <Text
                                        style={{
                                            fontSize: 24,
                                            fontWeight: 600,
                                            color: token.colorText,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {/* {machine?.operatorCount && machine?.totalProductions
                                            ? (
                                                  machine.totalProductions / machine.operatorCount
                                              ).toFixed(1)
                                            : '0.0'} */}
                                        100%
                                    </Text>
                                    {/* <Text
                                        style={{
                                            fontSize: 13,
                                            color: token.colorTextTertiary,
                                        }}
                                    >
                                        {t('machineManagement.timeline.unitsPerOperator')}
                                    </Text> */}
                                </Flex>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Total Active Time - Highlighted */}
                <div
                    style={{
                        marginTop: token.marginLG,
                        padding: token.padding,
                        background: `${token.colorSuccess}40`,
                        borderRadius: token.borderRadius,
                        border: `1px solid ${token.colorSuccess}30`,
                    }}
                >
                    <Flex justify="space-between" align="center">
                        <Flex align="center" gap={10}>
                            <FieldTimeOutlined
                                style={{ color: token.colorSuccess, fontSize: 20 }}
                            />
                            <div>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: token.colorText,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('machineManagement.timeline.totalActiveTime')}
                                </Text>
                                <Text
                                    style={{
                                        display: 'block',
                                        fontSize: 12,
                                        color: token.colorTextTertiary,
                                    }}
                                >
                                    {t('machineManagement.timeline.excludingOffline')}
                                </Text>
                            </div>
                        </Flex>
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: 600,
                                color: token.colorPrimary,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {formatDuration(statsData.totalActive)}
                        </Text>
                    </Flex>
                </div>
            </div>
        );
    };

    const currentStatusConfig = machine?.currentStatus
        ? getStatusConfig(machine.currentStatus)
        : null;

    return (
        <Modal
            title={
                <Flex
                    align="center"
                    justify="space-between"
                    gap={16}
                    wrap="wrap"
                    style={{ paddingBottom: 8 }}
                >
                    <Flex align="center" gap={12}>
                        <Title level={5} style={{ margin: 0 }}>
                            {machine?.machineName || t('machineManagement.timeline.machineDetails')}
                        </Title>
                        {currentStatusConfig && (
                            <Tag
                                style={{
                                    color: currentStatusConfig.color,
                                    background: currentStatusConfig.lightBg,
                                    border: `1px solid ${currentStatusConfig.color}30`,
                                    fontWeight: 500,
                                    fontSize: 12,
                                }}
                            >
                                {currentStatusConfig.text}
                            </Tag>
                        )}
                    </Flex>
                    {filterInfo && (
                        <Flex gap={8} wrap="wrap" align="center" style={{ paddingRight: 32 }}>
                            {filterInfo.timePeriod && (
                                <Tag
                                    style={{
                                        margin: 0,
                                        fontSize: 12,
                                        background: token.colorBgLayout,
                                        border: `1px solid ${token.colorBorder}`,
                                        color: token.colorTextSecondary,
                                    }}
                                >
                                    {filterInfo.timePeriod}
                                </Tag>
                            )}
                            {filterInfo.factoryName && (
                                <Tag
                                    style={{
                                        margin: 0,
                                        fontSize: 12,
                                        background: token.colorBgLayout,
                                        border: `1px solid ${token.colorBorder}`,
                                        color: token.colorTextSecondary,
                                    }}
                                >
                                    {filterInfo.factoryName}
                                </Tag>
                            )}
                            {filterInfo.zoneCode && (
                                <Tag
                                    style={{
                                        margin: 0,
                                        fontSize: 12,
                                        background: token.colorBgLayout,
                                        border: `1px solid ${token.colorBorder}`,
                                        color: token.colorTextSecondary,
                                    }}
                                >
                                    {filterInfo.zoneCode}
                                </Tag>
                            )}
                        </Flex>
                    )}
                </Flex>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width="95%"
            style={{ maxWidth: 900 }}
            centered
            styles={{
                body: { padding: token.paddingLG },
                header: { borderBottom: `1px solid ${token.colorBorderSecondary}` },
            }}
        >
            {loading ? (
                <Flex align="center" justify="center" style={{ padding: '60px 0' }}>
                    <Spin />
                </Flex>
            ) : machine ? (
                <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* Machine Info */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8} lg={5}>
                            <Text
                                style={{
                                    display: 'block',
                                    fontSize: 12,
                                    color: token.colorTextTertiary,
                                    marginBottom: 4,
                                }}
                            >
                                {t('machineManagement.timeline.machineCode')}
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: 500, color: token.colorText }}>
                                {machine.machineCode || t('common.notAvailable')}
                            </Text>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={5}>
                            <Text
                                style={{
                                    display: 'block',
                                    fontSize: 12,
                                    color: token.colorTextTertiary,
                                    marginBottom: 4,
                                }}
                            >
                                {t('machineManagement.timeline.power')}
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: 500, color: token.colorText }}>
                                {/* {machine.power ? `${machine.power} kW` : t('common.notAvailable')} */}
                                {machine.power ? `${machine.power} kW` : 10 + ' kW'}
                            </Text>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={5}>
                            <Text
                                style={{
                                    display: 'block',
                                    fontSize: 12,
                                    color: token.colorTextTertiary,
                                    marginBottom: 4,
                                }}
                            >
                                {t('machineManagement.timeline.energy')}
                            </Text>
                            <Flex align="center" gap={6}>
                                <ThunderboltOutlined
                                    style={{ color: token.colorPrimary, fontSize: 14 }}
                                />
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 500,
                                        color: token.colorText,
                                    }}
                                >
                                    {(() => {
                                        const power = machine.power || 0;
                                        const hours = statsData ? statsData.totalActive / 3600 : 0;
                                        const energy = power * hours;
                                        return energy > 0
                                            ? `${energy.toLocaleString('en-US', {
                                                maximumFractionDigits: 1,
                                            })} kWh`
                                            : t('common.notAvailable');
                                    })()}
                                </Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Text
                                style={{
                                    display: 'block',
                                    fontSize: 12,
                                    color: token.colorTextTertiary,
                                    marginBottom: 4,
                                }}
                            >
                                {t('machineManagement.timeline.measuredEnergy')}
                            </Text>
                            <Flex align="center" gap={6}>
                                <ThunderboltOutlined
                                    style={{ color: token.colorWarning, fontSize: 14 }}
                                />
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 500,
                                        color: token.colorText,
                                    }}
                                >
                                    {/* TODO: Replace with actual measured energy value */}
                                    {machine.currentEnergyConsumption} kW
                                </Text>
                            </Flex>
                        </Col>
                    </Row>

                    <Divider style={{ margin: 0 }} />

                    {/* Statistics */}
                    <div>
                        <Text
                            style={{
                                display: 'block',
                                fontSize: 15,
                                fontWeight: 500,
                                marginBottom: token.margin,
                                color: token.colorText,
                            }}
                        >
                            {t('machineManagement.timeline.statistics')}
                        </Text>
                        {renderStats()}
                    </div>
                </Space>
            ) : (
                <Empty description={t('machineManagement.timeline.noMachineData')} />
            )}
        </Modal>
    );
};

export default MachineTimelineModal;
