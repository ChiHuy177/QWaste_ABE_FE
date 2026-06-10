'use client';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Button,
    Card,
    Col,
    Empty,
    Flex,
    Grid,
    Input,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    AlertOutlined,
    BuildOutlined,
    CheckCircleOutlined,
    FilterOutlined,
    PlusOutlined,
    ReloadOutlined,
    RobotOutlined,
    SearchOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { ImageUploadField } from './_components/ImageUploadField';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePageTitle } from '@/hooks/usePageTitle';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { EntityFormModal } from '@/components/shared/FormModal';
import type { FormFieldConfig } from '@/components/shared/FormModal';

import {
    DemoMachineAlertService,
    DemoIncidentReportService,
    DemoMoldService,
    DemoErrorGroupService,
    DemoErrorDetailService,
} from '@/mockData/maintenance';
import { DemoMachineService } from '@/mockData/admin/factory';

import type { MachineAlert, AlertSeverity, AlertStatus } from '@/types/MachineAlert';
import type { IncidentClassification, IncidentReportFormData } from '@/types/IncidentReport';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

function formatAge(iso: string): string {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 1) return '< 1m ago';
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60),
        m = mins % 60;
    return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export default function IncidentAlertsPage() {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const queryClient = useQueryClient();
    const { handleError } = useApiErrorHandler();
    usePageTitle(t('maintenance.alerts.pageTitle'));

    // ── Severity style (uses theme tokens) ───────────────────────────────────
    const SEVERITY_STYLE = useMemo(
        () => ({
            CRITICAL: {
                color: token.colorError,
                bg: token.colorErrorBg,
                border: token.colorErrorBorder,
                tagColor: 'error',
            },
            HIGH: {
                color: token.colorWarning,
                bg: token.colorWarningBg,
                border: token.colorWarningBorder,
                tagColor: 'warning',
            },
            MEDIUM: { color: '#7c6000', bg: '#fffbe6', border: '#ffe58f', tagColor: 'gold' },
        }),
        [token]
    );

    // ── State ─────────────────────────────────────────────────────────────────
    const [alerts, setAlerts] = useState<MachineAlert[]>(() =>
        DemoMachineAlertService.getAllAlerts()
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
    const [clsFilter, setClsFilter] = useState<IncidentClassification | undefined>();

    const [formCls, setFormCls] = useState<IncidentClassification>('MACHINE');
    const [formEgId, setFormEgId] = useState<number | undefined>();
    const [createModal, setCreateModal] = useState<{
        open: boolean;
        alertId: string | null;
        initialData: Partial<IncidentReportFormData> | null;
    }>({ open: false, alertId: null, initialData: null });

    // ── Queries ───────────────────────────────────────────────────────────────
    const machineQ = useQuery({
        queryKey: ['machines', 'all'],
        queryFn: () => DemoMachineService.getAllMachines(),
    });
    const moldQ = useQuery({
        queryKey: ['molds', 'active'],
        queryFn: () => DemoMoldService.getActiveMolds(),
    });
    const egQ = useQuery({
        queryKey: ['errorGroups', 'active'],
        queryFn: () => DemoErrorGroupService.getActiveErrorGroups(),
    });
    const edQ = useQuery({
        queryKey: ['errorDetails', 'all'],
        queryFn: () => DemoErrorDetailService.getAllErrorDetails(),
    });

    const machineOpts = useMemo(
        () =>
            (machineQ.data ?? []).map((m) => ({
                value: m.machineId,
                label: `${m.machineName} (${m.machineCode})`,
            })),
        [machineQ.data]
    );
    const moldOpts = useMemo(
        () =>
            (moldQ.data ?? []).map((m) => ({
                value: m.moldId,
                label: `${m.moldName} (${m.moldCode})`,
            })),
        [moldQ.data]
    );
    const egOpts = useMemo(
        () => (egQ.data ?? []).map((g) => ({ value: g.errorGroupId, label: g.errorGroupName })),
        [egQ.data]
    );
    const edOpts = useMemo(() => {
        const all = edQ.data ?? [];
        return (
            formEgId
                ? all.filter((d) => d.errorGroupId === formEgId && d.status === 'ACTIVE')
                : all.filter((d) => d.status === 'ACTIVE')
        ).map((d) => ({ value: d.errorDetailId, label: `[${d.errorCode}] ${d.errorName}` }));
    }, [edQ.data, formEgId]);

    const clsOpts = useMemo(
        () => [
            { value: 'MACHINE' as const, label: t('maintenance.classification.machine') },
            { value: 'MOLD' as const, label: t('maintenance.classification.mold') },
        ],
        [t]
    );

    // ── Form fields ───────────────────────────────────────────────────────────
    const formFields = useMemo(
        (): FormFieldConfig[] => [
            {
                name: 'classification',
                label: t('maintenance.form.fields.classification'),
                type: 'select',
                required: true,
                defaultValue: 'MACHINE',
                options: clsOpts,
                onChange: (v: IncidentClassification, f) => {
                    setFormCls(v);
                    f?.setFieldValue('machineId', undefined);
                    f?.setFieldValue('moldId', undefined);
                },
                span: { xs: 24, md: 12 },
            },
            {
                name: 'machineId',
                label: t('maintenance.form.fields.machine'),
                type: 'select',
                required: formCls === 'MACHINE',
                hidden: formCls !== 'MACHINE',
                options: machineOpts,
                placeholder: t('maintenance.form.placeholders.selectMachine'),
                allowClear: true,
                span: { xs: 24, md: 12 },
            },
            {
                name: 'moldId',
                label: t('maintenance.form.fields.mold'),
                type: 'select',
                required: formCls === 'MOLD',
                hidden: formCls !== 'MOLD',
                options: moldOpts,
                placeholder: t('maintenance.form.placeholders.selectMold'),
                allowClear: true,
                span: { xs: 24, md: 12 },
            },
            {
                name: 'errorGroupId',
                label: t('maintenance.form.fields.errorGroup'),
                type: 'select',
                required: true,
                options: egOpts,
                placeholder: t('maintenance.form.placeholders.selectErrorGroup'),
                allowClear: true,
                onChange: (v: number, f) => {
                    setFormEgId(v);
                    f?.setFieldValue('errorDetailId', undefined);
                },
                span: { xs: 24, md: 12 },
            },
            {
                name: 'errorDetailId',
                label: t('maintenance.form.fields.errorDetail'),
                type: 'select',
                required: true,
                options: edOpts,
                allowClear: true,
                placeholder: formEgId
                    ? t('maintenance.form.placeholders.selectErrorDetail')
                    : t('maintenance.form.placeholders.selectErrorGroupFirst'),
                span: { xs: 24, md: 12 },
            },
            {
                name: 'description',
                label: t('maintenance.form.fields.description'),
                type: 'textarea',
                required: true,
                placeholder: t('maintenance.form.placeholders.description'),
                rows: 3,
                maxLength: 500,
                showCount: true,
                span: { xs: 24 },
            },
            {
                name: 'rootCause',
                label: t('maintenance.form.fields.rootCause'),
                type: 'textarea',
                placeholder: t('maintenance.form.placeholders.rootCause'),
                rows: 2,
                maxLength: 500,
                showCount: true,
                span: { xs: 24 },
            },
            {
                name: 'imageUrls',
                label: t('maintenance.form.fields.imageUrl'),
                type: 'custom',
                render: () => <ImageUploadField />,
                span: { xs: 24 },
            },
        ],
        [t, clsOpts, formCls, formEgId, machineOpts, moldOpts, egOpts, edOpts]
    );

    // ── Mutation ──────────────────────────────────────────────────────────────
    const { mutateAsync: createIncident } = useMutation({
        mutationFn: (data: IncidentReportFormData) =>
            DemoIncidentReportService.createIncidentReport(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
    });

    // ── Derived ───────────────────────────────────────────────────────────────
    const refresh = useCallback(() => setAlerts(DemoMachineAlertService.getAllAlerts()), []);

    const applyFilters = useCallback(
        (list: MachineAlert[]) => {
            const q = searchQuery.toLowerCase().trim();
            return list.filter((a) => {
                const matchQ =
                    !q ||
                    (a.machine?.machineName ?? a.mold?.moldName ?? '').toLowerCase().includes(q) ||
                    a.errorDetail.errorName.toLowerCase().includes(q) ||
                    a.errorDetail.errorCode.toLowerCase().includes(q) ||
                    a.errorGroup.errorGroupName.toLowerCase().includes(q);
                const matchS = severityFilter === 'ALL' || a.severity === severityFilter;
                const matchC = !clsFilter || a.classification === clsFilter;
                return matchQ && matchS && matchC;
            });
        },
        [searchQuery, severityFilter, clsFilter]
    );

    const activeAlerts = useMemo(
        () => applyFilters(alerts.filter((a) => a.status !== 'RESOLVED')),
        [alerts, applyFilters]
    );
    const resolvedAlerts = useMemo(
        () => applyFilters(alerts.filter((a) => a.status === 'RESOLVED')),
        [alerts, applyFilters]
    );

    const stats = useMemo(
        () => ({
            total: alerts.length,
            critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
            high: alerts.filter((a) => a.severity === 'HIGH').length,
            medium: alerts.filter((a) => a.severity === 'MEDIUM').length,
        }),
        [alerts]
    );

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleCreateReport = useCallback((alert: MachineAlert) => {
        setFormCls(alert.classification);
        setFormEgId(alert.errorGroup.errorGroupId);
        setCreateModal({
            open: true,
            alertId: alert.alertId,
            initialData: {
                classification: alert.classification,
                machineId: alert.machine?.machineId,
                moldId: alert.mold?.moldId,
                errorGroupId: alert.errorGroup.errorGroupId,
                errorDetailId: alert.errorDetail.errorDetailId,
            },
        });
    }, []);

    const handleSubmit = async (data: IncidentReportFormData) => {
        try {
            const report = await createIncident(data);
            if (createModal.alertId) {
                DemoMachineAlertService.markAsReported(createModal.alertId, report.reportId);
                refresh();
            }
            toast.success(t('maintenance.alerts.messages.reportCreated'));
        } catch (err) {
            handleError(err, { fallbackKey: 'common.error' });
            throw err;
        }
    };

    // ── Label helpers ─────────────────────────────────────────────────────────
    const severityLabel = (s: AlertSeverity) => t(`maintenance.alerts.severity.${s.toLowerCase()}`);
    const statusLabel = (s: AlertStatus) => t(`maintenance.alerts.status.${s.toLowerCase()}`);

    // ── Shared column builders ────────────────────────────────────────────────
    const buildColumns = (showActions: boolean): ColumnsType<MachineAlert> => [
        {
            key: 'severity',
            title: t('maintenance.alerts.table.severity'),
            width: 110,
            render: (_, a) => {
                const s = SEVERITY_STYLE[a.severity];
                return (
                    <Tag
                        style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: 11,
                            color: s.color,
                            background: s.bg,
                            borderColor: s.border,
                        }}
                    >
                        <WarningOutlined style={{ marginRight: 3 }} />
                        {severityLabel(a.severity)}
                    </Tag>
                );
            },
        },
        {
            key: 'target',
            title: t('maintenance.alerts.table.target'),
            width: 220,
            render: (_, a) => {
                const isMch = a.classification === 'MACHINE';
                return (
                    <Flex align="center" gap={8}>
                        {isMch ? (
                            <RobotOutlined style={{ color: token.colorInfo, fontSize: 16 }} />
                        ) : (
                            <BuildOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                        )}
                        <div>
                            <Text strong style={{ fontSize: 13, display: 'block' }}>
                                {isMch ? a.machine?.machineName : a.mold?.moldName}
                            </Text>
                            <Text
                                type="secondary"
                                style={{ fontSize: 11, fontFamily: 'monospace' }}
                            >
                                #{isMch ? a.machine?.machineCode : a.mold?.moldCode}
                            </Text>
                        </div>
                    </Flex>
                );
            },
        },
        {
            key: 'error',
            title: t('maintenance.alerts.table.error'),
            render: (_, a) => (
                <Space direction="vertical" size={2}>
                    <Tag color="volcano" style={{ fontSize: 11 }}>
                        {a.errorGroup.errorGroupName}
                    </Tag>
                    <Flex align="center" gap={6}>
                        <Text
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 11,
                                color: token.colorTextSecondary,
                            }}
                        >
                            {a.errorDetail.errorCode}
                        </Text>
                        <Text style={{ fontSize: 12 }}>{a.errorDetail.errorName}</Text>
                    </Flex>
                </Space>
            ),
        },
        {
            key: 'detectedAt',
            title: t('maintenance.alerts.table.detectedAt'),
            width: 130,
            render: (_, a) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 12 }}>
                        {formatAge(a.detectedAt)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(a.detectedAt).format('DD/MM HH:mm')}
                    </Text>
                </Space>
            ),
        },
        {
            key: 'status',
            title: t('maintenance.alerts.table.status'),
            width: 120,
            render: (_, a) => {
                if (a.status === 'ACTIVE') return <Tag>{statusLabel('ACTIVE')}</Tag>;
                if (a.status === 'REPORTED')
                    return (
                        <Tag color="blue" icon={<CheckCircleOutlined />}>
                            {statusLabel('REPORTED')}
                        </Tag>
                    );
                return (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        {statusLabel('RESOLVED')}
                    </Tag>
                );
            },
        },
        ...(showActions
            ? [
                  {
                      key: 'actions',
                      title: '',
                      width: 140,
                      align: 'center' as const,
                      render: (_: unknown, a: MachineAlert) => {
                          if (a.status !== 'ACTIVE') return null;
                          return (
                              <Button
                                  type="primary"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  style={{
                                      background: SEVERITY_STYLE[a.severity].color,
                                      borderColor: SEVERITY_STYLE[a.severity].color,
                                  }}
                                  onClick={() => handleCreateReport(a)}
                              >
                                  {t('maintenance.alerts.card.createReport')}
                              </Button>
                          );
                      },
                  },
              ]
            : []),
    ];

    const activeColumns = useMemo(
        () => buildColumns(true),
        [t, token, SEVERITY_STYLE, handleCreateReport]
    );
    const resolvedColumns = useMemo(() => buildColumns(false), [t, token, SEVERITY_STYLE]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <ResponsivePageHeader
                title={t('maintenance.alerts.pageTitle')}
                icon={<AlertOutlined />}
            />

            {/* ── Stats chips ──────────────────────────────────────────────── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {[
                    {
                        key: 'total',
                        label: t('maintenance.alerts.stats.total'),
                        value: stats.total,
                        sv: 'ALL',
                        color: token.colorPrimary,
                        bg: token.colorPrimaryBg,
                    },
                    {
                        key: 'critical',
                        label: t('maintenance.alerts.stats.critical'),
                        value: stats.critical,
                        sv: 'CRITICAL',
                        color: token.colorError,
                        bg: token.colorErrorBg,
                    },
                    {
                        key: 'high',
                        label: t('maintenance.alerts.stats.high'),
                        value: stats.high,
                        sv: 'HIGH',
                        color: token.colorWarning,
                        bg: token.colorWarningBg,
                    },
                    {
                        key: 'medium',
                        label: t('maintenance.alerts.stats.medium'),
                        value: stats.medium,
                        sv: 'MEDIUM',
                        color: '#7c6000',
                        bg: '#fffbe6',
                    },
                ].map((chip) => {
                    const active = severityFilter === chip.sv;
                    return (
                        <Col xs={12} sm={6} key={chip.key}>
                            <Card
                                hoverable
                                onClick={() =>
                                    setSeverityFilter(
                                        (prev) =>
                                            (prev === chip.sv ? 'ALL' : chip.sv) as
                                                | AlertSeverity
                                                | 'ALL'
                                    )
                                }
                                styles={{ body: { padding: '14px 18px' } }}
                                style={{
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    border: `1px solid ${chip.color}44`,
                                    background: active ? `${chip.color}18` : chip.bg,
                                    boxShadow: active
                                        ? `0 0 0 2px ${chip.color}`
                                        : token.boxShadowTertiary,
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: 60,
                                        height: 60,
                                        background: `${chip.color}12`,
                                        borderBottomLeftRadius: '100%',
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: chip.color,
                                        fontWeight: 500,
                                        display: 'block',
                                    }}
                                >
                                    {chip.label}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: isMobile ? 24 : 32,
                                        fontWeight: 700,
                                        color: chip.color,
                                        lineHeight: 1.2,
                                        display: 'block',
                                    }}
                                >
                                    {chip.value}
                                </Text>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* ── Filter bar ───────────────────────────────────────────────── */}
            <Card styles={{ body: { padding: 16 } }} style={{ marginBottom: 16, borderRadius: 8 }}>
                <Flex align="center" gap={12} wrap="wrap">
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder={t('maintenance.alerts.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        style={{ flex: 1, minWidth: 200 }}
                    />
                    <Flex align="center" gap={8} wrap="wrap">
                        <FilterOutlined style={{ color: token.colorTextQuaternary }} />
                        <Select
                            value={severityFilter}
                            onChange={setSeverityFilter}
                            style={{ width: 140 }}
                            options={[
                                { value: 'ALL', label: t('maintenance.alerts.severity.all') },
                                {
                                    value: 'CRITICAL',
                                    label: t('maintenance.alerts.severity.critical'),
                                },
                                { value: 'HIGH', label: t('maintenance.alerts.severity.high') },
                                { value: 'MEDIUM', label: t('maintenance.alerts.severity.medium') },
                            ]}
                        />
                        <Select
                            value={clsFilter}
                            onChange={setClsFilter}
                            placeholder={t('maintenance.classification.allTypes')}
                            allowClear
                            style={{ width: 122 }}
                            options={clsOpts}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                DemoMachineAlertService.reset();
                                refresh();
                            }}
                        >
                            {!isMobile && t('maintenance.list.refresh')}
                        </Button>
                    </Flex>
                </Flex>
            </Card>

            {/* ── Table 1: Active / Reported ───────────────────────────────── */}
            <Card
                style={{ borderRadius: 8, marginBottom: 16 }}
                styles={{ body: { padding: 0 } }}
                title={
                    <Flex align="center" gap={8}>
                        <AlertOutlined style={{ color: token.colorError }} />
                        <Title level={5} style={{ margin: 0 }}>
                            {t('maintenance.alerts.section.active')}
                        </Title>
                        <Tag color="error">{activeAlerts.length}</Tag>
                    </Flex>
                }
            >
                {activeAlerts.length === 0 ? (
                    <Empty
                        description={
                            <Flex vertical align="center" gap={4}>
                                <Text strong>{t('maintenance.alerts.empty.title')}</Text>
                                <Text type="secondary">{t('maintenance.alerts.empty.desc')}</Text>
                            </Flex>
                        }
                        style={{ padding: '40px 0' }}
                    />
                ) : (
                    <Table<MachineAlert>
                        columns={activeColumns}
                        dataSource={activeAlerts}
                        rowKey="alertId"
                        size="middle"
                        scroll={{ x: 'max-content' }}
                        pagination={
                            activeAlerts.length > 10
                                ? { pageSize: 10, showSizeChanger: true }
                                : false
                        }
                        onRow={(a) => ({
                            style: { borderLeft: `3px solid ${SEVERITY_STYLE[a.severity].color}` },
                        })}
                    />
                )}
            </Card>

            {/* ── Table 2: Resolved ────────────────────────────────────────── */}
            <Card
                style={{ borderRadius: 8 }}
                styles={{ body: { padding: 0 } }}
                title={
                    <Flex align="center" gap={8}>
                        <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                        <Title level={5} style={{ margin: 0 }}>
                            {t('maintenance.alerts.section.resolved')}
                        </Title>
                        <Tag color="success">{resolvedAlerts.length}</Tag>
                    </Flex>
                }
            >
                {resolvedAlerts.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ padding: '24px 0' }}
                        description={
                            <Text type="secondary">{t('maintenance.alerts.empty.noResolved')}</Text>
                        }
                    />
                ) : (
                    <Table<MachineAlert>
                        columns={resolvedColumns}
                        dataSource={resolvedAlerts}
                        rowKey="alertId"
                        size="small"
                        scroll={{ x: 'max-content' }}
                        pagination={resolvedAlerts.length > 10 ? { pageSize: 10 } : false}
                        rowClassName={() => 'opacity-70'}
                        style={{ opacity: 0.85 }}
                    />
                )}
            </Card>

            {/* ── Create Report Modal ──────────────────────────────────────── */}
            <EntityFormModal<IncidentReportFormData>
                open={createModal.open}
                onOpenChange={(open) => {
                    if (!open) setCreateModal({ open: false, alertId: null, initialData: null });
                }}
                onSubmit={handleSubmit}
                mode="create"
                initialData={createModal.initialData as IncidentReportFormData}
                fields={formFields}
                title={{ create: t('maintenance.form.createTitle'), edit: '' }}
                description={{ create: t('maintenance.form.createDescription'), edit: '' }}
                buttonLabels={{
                    cancel: t('maintenance.form.buttons.cancel'),
                    create: t('maintenance.form.buttons.create'),
                    edit: '',
                    saving: t('maintenance.form.buttons.saving'),
                }}
                width={{ xs: '95%', sm: '80%', md: 720 }}
                auditMetaData={null}
            />
        </>
    );
}
