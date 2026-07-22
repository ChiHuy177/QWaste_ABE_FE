'use client';

import { type CSSProperties, useMemo } from 'react';
import { Badge, Button, Card, Col, Collapse, Flex, Input, Row, Tabs, Tooltip, Typography, theme } from 'antd';
import { CaretRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionPlanMonitorActions } from '@/stores/ProductionPlanMonitorStore';
import { MONITOR_GROUP_ORDER, type MonitorGroupKey } from '../_utils/planMappers';
import type { MonitorRowVM } from '../_components/types';
import ProductDetailModal from '../_components/ProductDetailModal';
import IncidentConfirmModal from '../_components/IncidentConfirmModal';
import { useMoldOptions } from '../_hooks/useMoldOptions';
import MonitorKanbanTab from './_components/MonitorKanbanTab';
import MonitorTimelineTab from './_components/MonitorTimelineTab';
import {
    useMonitorColumns,
    useMonitorData,
    useMonitorGroups,
    useMonitorMachineGroups,
} from './hooks';
import styles from '../_components/ProductionPlanTable.module.css';

const { Text } = Typography;
const { Search } = Input;

const formatNumber = (v: number) => v.toLocaleString('vi-VN');

export default function ProductionMonitorPage() {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { checkPermission } = usePermissionCheck();
    const dispatch = useAppDispatch();

    usePageTitle(t('productionPlan.monitor.title'));

    const selectedRowId = useAppSelector((state) => state.productionPlanMonitor.selectedRowId);
    const incidentRowId = useAppSelector((state) => state.productionPlanMonitor.incidentRowId);

    const { products, isLoading, refresh, isConnected, lastUpdate } = useMonitorData();
    const { molds, moldOptions } = useMoldOptions();

    const {
        setSearchText,
        activeKeys,
        setActiveKeys,
        statConfigs,
        statusCounts,
        filteredByKeyword,
        grouped,
        groupedFlatRows,
        displayedActiveKeys,
    } = useMonitorGroups({ products });

    const selectedRow = useMemo(
        () => products.find((row) => row.productionPlanId === selectedRowId) ?? null,
        [products, selectedRowId]
    );
    const incidentRow = useMemo(
        () => products.find((row) => row.productionPlanId === incidentRowId) ?? null,
        [products, incidentRowId]
    );

    // Tra trên toàn bộ list (kể cả mold hết ACTIVE) vì plan cũ vẫn giữ khuôn cũ.
    const incidentCurrentMoldId = useMemo(() => {
        if (!incidentRow?.moldCode) return undefined;
        return molds.find((m) => m.moldCode === incidentRow.moldCode)?.moldId;
    }, [incidentRow, molds]);

    const openIncidentModal = (row: MonitorRowVM) => {
        if (!checkPermission('incident', 'production_plan')) return;
        dispatch(productionPlanMonitorActions.openIncidentModal(row.productionPlanId));
    };

    const selectRow = (row: MonitorRowVM) =>
        dispatch(productionPlanMonitorActions.selectRow(row.productionPlanId));

    const { collapseItems } = useMonitorColumns({
        statConfigs,
        grouped,
        groupedFlatRows,
        loading: isLoading,
        onOpenIncident: openIncidentModal,
        onSelectRow: selectRow,
    });

    const machineGroups = useMonitorMachineGroups(filteredByKeyword);

    const planThemeVars = useMemo(
        () =>
            ({
                '--plan-color-primary': token.colorPrimary,
                '--plan-color-bg-container': token.colorBgContainer,
                '--plan-color-bg-muted': token.colorBgLayout,
                '--plan-color-border': token.colorBorder,
                '--plan-color-text': token.colorText,
                '--plan-color-text-secondary': token.colorTextSecondary,
                '--plan-color-text-tertiary': token.colorTextTertiary,
            }) as CSSProperties,
        [token]
    );

    const handleStatCardClick = (status: MonitorGroupKey) => {
        if (!activeKeys.includes(status)) {
            setActiveKeys([...activeKeys, status]);
        }
        requestAnimationFrame(() => {
            document
                .getElementById(`monitor-group-${status}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const headerExtra = (
        <Flex align="center" gap={8}>
            <Tooltip
                title={
                    isConnected
                        ? t('productionPlan.monitor.connected')
                        : t('productionPlan.monitor.disconnected')
                }
            >
                <Badge
                    status={isConnected ? 'processing' : 'error'}
                    text={
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {isConnected
                                ? t('productionPlan.monitor.connected')
                                : t('productionPlan.monitor.disconnected')}
                        </Text>
                    }
                />
            </Tooltip>
            {lastUpdate && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('productionPlan.monitor.lastSync', {
                        time: lastUpdate.toLocaleTimeString('vi-VN'),
                    })}
                </Text>
            )}
            <Tooltip title={t('productionPlan.monitor.refresh')}>
                <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    loading={isLoading}
                    onClick={refresh}
                />
            </Tooltip>
        </Flex>
    );

    const listTabContent = (
        <>
            {/* Stat cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statConfigs.map(({ status, icon: Icon, color, bg, border }) => (
                    <Col xs={24} sm={12} lg={6} key={status}>
                        <Card
                            variant="borderless"
                            hoverable
                            onClick={() => handleStatCardClick(status)}
                            style={{
                                height: '100%',
                                borderRadius: 12,
                                border: `1px solid ${border}`,
                                background: bg,
                                boxShadow: token.boxShadow,
                                cursor: 'pointer',
                            }}
                        >
                            <Flex align="center" gap={16} wrap="nowrap">
                                <span
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 8,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: token.colorBgContainer,
                                        color,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon style={{ fontSize: 22 }} />
                                </span>
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            color,
                                            fontSize: 14,
                                            fontWeight: 500,
                                            marginBottom: 4,
                                        }}
                                    >
                                        {t(`productionPlan.monitor.status.${status}`)}
                                    </div>
                                    <div
                                        style={{
                                            color,
                                            fontSize: 30,
                                            fontWeight: 700,
                                            lineHeight: 1,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {formatNumber(statusCounts[status])}
                                    </div>
                                </div>
                            </Flex>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Search */}
            <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                <Search
                    placeholder={t('productionPlan.monitor.searchPlaceholder')}
                    allowClear
                    onSearch={setSearchText}
                    onChange={(e) => !e.target.value && setSearchText('')}
                    style={{ width: 320 }}
                />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {t('productionPlan.monitor.showing', {
                        count: filteredByKeyword.length,
                        total: products.length,
                    })}
                </Text>
                <Flex gap={4} style={{ marginLeft: 'auto' }}>
                    <Button
                        type="text"
                        size="small"
                        onClick={() => setActiveKeys([...MONITOR_GROUP_ORDER])}
                    >
                        {t('productionPlan.monitor.expandAll')}
                    </Button>
                    <Button type="text" size="small" onClick={() => setActiveKeys([])}>
                        {t('productionPlan.monitor.collapseAll')}
                    </Button>
                </Flex>
            </Flex>

            {/* ClickUp-style collapsible status groups */}
            <Collapse
                ghost
                items={collapseItems}
                activeKey={displayedActiveKeys}
                onChange={(keys) => setActiveKeys(keys as MonitorGroupKey[])}
                collapsible="header"
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                classNames={{
                    header: styles.monitorGroupHeader,
                    body: styles.monitorGroupBody,
                }}
            />
        </>
    );

    const tabItems = [
        {
            key: 'list',
            label: t('productionPlan.monitor.tabs.list'),
            children: listTabContent,
        },
        {
            key: 'kanban',
            label: t('productionPlan.monitor.tabs.kanban'),
            children: (
                <MonitorKanbanTab
                    statConfigs={statConfigs}
                    grouped={grouped}
                    loading={isLoading}
                    onOpenIncident={openIncidentModal}
                    onSelectRow={selectRow}
                />
            ),
        },
        {
            key: 'timeline',
            label: t('productionPlan.monitor.tabs.timeline'),
            children: (
                <div className={styles.monitorTimelinePaneFill}>
                    <MonitorTimelineTab
                        groups={machineGroups}
                        products={filteredByKeyword}
                        loading={isLoading}
                        onOpenIncident={openIncidentModal}
                        onSelectRow={selectRow}
                    />
                </div>
            ),
        },
    ];

    return (
        <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ResponsivePageHeader
                title={t('productionPlan.monitor.title')}
                rightContent={headerExtra}
            />

            <Tabs items={tabItems} style={planThemeVars} className={styles.monitorTabsFill} />

            <ProductDetailModal
                row={selectedRow}
                open={!!selectedRow}
                onClose={() => dispatch(productionPlanMonitorActions.selectRow(null))}
            />

            <IncidentConfirmModal
                open={!!incidentRow}
                row={incidentRow}
                molds={molds}
                moldOptions={moldOptions}
                currentMoldId={incidentCurrentMoldId}
                onClose={() => dispatch(productionPlanMonitorActions.closeIncidentModal())}
                onDone={refresh}
            />
        </div>
    );
}
