'use client';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, Col, Flex, Grid, Row, Spin, Table, Tag, Typography, theme } from 'antd';
import type { TableColumnsType } from 'antd';
import { LoadingOutlined, ToolOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePageTitle } from '@/hooks/usePageTitle';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { EntityFormModal } from '@/components/shared/FormModal';
import type { FormFieldConfig } from '@/components/shared/FormModal';
import { ImageUploadField } from '../_components/ImageUploadField';

import {
    DemoIncidentReportService,
    DemoMoldService,
    DemoErrorGroupService,
    DemoErrorDetailService,
    DemoMachineAlertService,
} from '@/mockData/maintenance';
import { DemoMachineService } from '@/mockData/admin/factory';

import type {
    IncidentClassification,
    IncidentReport,
    IncidentReportFormData,
    IncidentReportUpdateData,
    IncidentStatus,
} from '@/types/IncidentReport';

import { IncidentStatsCards } from '../_components/IncidentStatsCards';
import { MaintenanceCharts } from '../_components/MaintenanceCharts';
import { OverviewKanban } from '../_components/OverviewKanban';
import { OverviewDetailPanel } from '../_components/OverviewDetailPanel';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const QK = {
    all: ['incidents', 'all'] as const,
};

const STATUS_VALUES: IncidentStatus[] = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'];
const CLASS_VALUES: IncidentClassification[] = ['MACHINE', 'MOLD'];
const STATUS_COLOR: Record<string, string> = {
    OPEN: 'orange',
    IN_PROGRESS: 'blue',
    RESOLVED: 'green',
};

const toFormData = (r: IncidentReport): IncidentReportFormData & { status: IncidentStatus } => ({
    classification: r.classification,
    machineId: r.machine?.machineId,
    moldId: r.mold?.moldId,
    errorGroupId: r.errorGroup.errorGroupId,
    errorDetailId: r.errorDetail.errorDetailId,
    description: r.description,
    imageUrls: r.imageUrls,
    rootCause: r.rootCause,
    status: r.status,
});

export default function IncidentOverviewPage() {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.lg;
    const queryClient = useQueryClient();
    const { handleError } = useApiErrorHandler();
    usePageTitle('Incident Reports');

    const [statusFilter, setStatusFilter] = useState<IncidentStatus>('ALL');
    const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
    const [formCls, setFormCls] = useState<IncidentClassification>('MACHINE');
    const [formEgId, setFormEgId] = useState<number | undefined>();

    const [editModal, setEditModal] = useState<{
        open: boolean;
        data: (IncidentReportFormData & { status?: IncidentStatus; reportId?: number }) | null;
    }>({ open: false, data: null });

    const [confirm, setConfirm] = useState<{
        open: boolean;
        type: ConfirmationType;
        action: (() => Promise<void>) | null;
    }>({ open: false, type: 'delete', action: null });

    // ── Queries ────────────────────────────────────────────────────────────────
    const allQ = useQuery({
        queryKey: QK.all,
        queryFn: () => DemoIncidentReportService.getAllIncidentReports(),
    });
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

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const all = allQ.data ?? [];
        return {
            total: all.length,
            open: all.filter((r) => r.status === 'OPEN').length,
            inProgress: all.filter((r) => r.status === 'IN_PROGRESS').length,
            resolved: all.filter((r) => r.status === 'RESOLVED').length,
        };
    }, [allQ.data]);

    const filteredIncidents = useMemo(() => {
        const all = allQ.data ?? [];
        if (statusFilter === 'ALL') return all;
        return all.filter((r) => r.status === statusFilter);
    }, [allQ.data, statusFilter]);

    // ── Form options ───────────────────────────────────────────────────────────
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

    const statusFormOpts = useMemo(
        () =>
            STATUS_VALUES.filter((v) => v !== 'ALL').map((v) => ({
                value: v,
                label:
                    v === 'IN_PROGRESS'
                        ? t('maintenance.status.inProgress')
                        : t(`maintenance.status.${v.toLowerCase()}`),
            })),
        [t]
    );

    const clsOpts = useMemo(
        () =>
            CLASS_VALUES.map((v) => ({
                value: v,
                label:
                    v === 'MACHINE'
                        ? t('maintenance.classification.machine')
                        : t('maintenance.classification.mold'),
            })),
        [t]
    );

    // ── Edit form fields ───────────────────────────────────────────────────────
    const editFields = useMemo(
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
                allowClear: true,
                span: { xs: 24, md: 12 },
            },
            {
                name: 'errorGroupId',
                label: t('maintenance.form.fields.errorGroup'),
                type: 'select',
                required: true,
                options: egOpts,
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
                span: { xs: 24, md: 12 },
            },
            {
                name: 'description',
                label: t('maintenance.form.fields.description'),
                type: 'textarea',
                required: true,
                rows: 3,
                maxLength: 500,
                showCount: true,
                span: { xs: 24 },
            },
            {
                name: 'rootCause',
                label: t('maintenance.form.fields.rootCause'),
                type: 'textarea',
                rows: 3,
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
            {
                name: 'status',
                label: t('maintenance.form.fields.status'),
                type: 'select',
                required: true,
                defaultValue: 'OPEN',
                options: statusFormOpts,
                span: { xs: 24, md: 12 },
            },
        ],
        [t, clsOpts, formCls, formEgId, machineOpts, moldOpts, egOpts, edOpts, statusFormOpts]
    );

    // ── Mutations ──────────────────────────────────────────────────────────────
    const { mutateAsync: updateIncident } = useMutation({
        mutationFn: (d: IncidentReportUpdateData) =>
            DemoIncidentReportService.updateIncidentReport(d),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QK.all }),
    });
    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleCardClick = useCallback((r: IncidentReport) => {
        setSelectedReport((prev) => (prev?.reportId === r.reportId ? null : r));
    }, []);

    const handleEditOpen = useCallback((r: IncidentReport) => {
        setFormCls(r.classification);
        setFormEgId(r.errorGroup.errorGroupId);
        setEditModal({ open: true, data: { ...toFormData(r), reportId: r.reportId } });
    }, []);

    const handleStatusChange = useCallback(
        async (r: IncidentReport, s: IncidentStatus) => {
            try {
                await updateIncident({ ...toFormData(r), reportId: r.reportId, status: s });
                if (selectedReport?.reportId === r.reportId) {
                    setSelectedReport((prev) => (prev ? { ...prev, status: s } : null));
                }
                if (s === 'RESOLVED') {
                    DemoMachineAlertService.resolveByReportId(r.reportId);
                }
            } catch (err) {
                handleError(err, { fallbackKey: 'common.error' });
            }
        },
        [updateIncident, selectedReport, handleError]
    );

    const handleEditSubmit = async (data: IncidentReportFormData & { status?: IncidentStatus }) => {
        setConfirm({
            open: true,
            type: 'edit',
            action: async () => {
                try {
                    const id = (editModal.data as any)?.reportId;
                    if (id) {
                        await updateIncident({
                            ...data,
                            reportId: id,
                            status: data.status ?? 'OPEN',
                        } as IncidentReportUpdateData);
                        toast.success(t('maintenance.messages.updated'));
                    }
                } catch (err) {
                    handleError(err, { fallbackKey: 'common.error' });
                    throw err;
                }
            },
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const handleConfirm = async () => {
        if (!confirm.action) return;
        try {
            setConfirm((p) => ({ ...p, open: false }));
            await confirm.action();
            setEditModal((p) => ({ ...p, open: false }));
        } catch {
            /* handled */
        } finally {
            setConfirm({ open: false, type: 'delete', action: null });
        }
    };

    const allIncidents = allQ.data ?? [];
    const panelOpen = !!selectedReport && !isMobile;

    const tableColumns = useMemo(
        (): TableColumnsType<IncidentReport> => [
            {
                title: t('maintenance.list.table.reportNo'),
                dataIndex: 'reportNumber',
                key: 'reportNumber',
                width: 120,
            },
            {
                title: t('maintenance.form.fields.classification'),
                dataIndex: 'classification',
                key: 'classification',
                width: 100,
                render: (v: IncidentClassification) => (
                    <Tag color={v === 'MACHINE' ? 'blue' : 'purple'}>
                        {v === 'MACHINE'
                            ? t('maintenance.classification.machine')
                            : t('maintenance.classification.mold')}
                    </Tag>
                ),
            },
            {
                title: t('maintenance.list.table.machineMold'),
                key: 'asset',
                ellipsis: true,
                render: (_: unknown, r: IncidentReport) =>
                    r.machine?.machineName ?? r.mold?.moldName ?? '—',
            },
            {
                title: t('maintenance.list.table.errorDetail'),
                key: 'error',
                ellipsis: true,
                render: (_: unknown, r: IncidentReport) =>
                    `[${r.errorDetail.errorCode}] ${r.errorDetail.errorName}`,
            },
            {
                title: t('maintenance.list.table.status'),
                dataIndex: 'status',
                key: 'status',
                width: 130,
                render: (v: IncidentStatus) => {
                    const label =
                        v === 'IN_PROGRESS'
                            ? t('maintenance.status.inProgress')
                            : t(`maintenance.status.${v.toLowerCase()}`);
                    return <Tag color={STATUS_COLOR[v] ?? 'default'}>{label}</Tag>;
                },
            },
            {
                title: t('maintenance.list.table.reportedAt'),
                dataIndex: 'reportedAt',
                key: 'reportedAt',
                width: 130,
                render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
            },
        ],
        [t]
    );

    // Compact stat chips shown in left column when panel is open
    const compactStats = (
        <Flex gap={8} wrap="wrap" style={{ marginBottom: 12 }}>
            {[
                {
                    label: t('maintenance.stats.totalReports'),
                    value: stats.total,
                    color: token.colorPrimary,
                    bg: token.colorPrimaryBg,
                    filter: 'ALL' as IncidentStatus,
                },
                {
                    label: t('maintenance.stats.open'),
                    value: stats.open,
                    color: '#d97706',
                    bg: '#fffbeb',
                    filter: 'OPEN' as IncidentStatus,
                },
                {
                    label: t('maintenance.stats.inProgress'),
                    value: stats.inProgress,
                    color: token.colorInfo,
                    bg: token.colorInfoBg,
                    filter: 'IN_PROGRESS' as IncidentStatus,
                },
                {
                    label: t('maintenance.stats.resolved'),
                    value: stats.resolved,
                    color: token.colorSuccess,
                    bg: token.colorSuccessBg,
                    filter: 'RESOLVED' as IncidentStatus,
                },
            ].map((chip) => {
                const active = statusFilter === chip.filter;
                return (
                    <div
                        key={chip.label}
                        onClick={() =>
                            setStatusFilter((prev) => (prev === chip.filter ? 'ALL' : chip.filter))
                        }
                        style={{
                            padding: '4px 12px',
                            borderRadius: 20,
                            cursor: 'pointer',
                            border: `1.5px solid ${active ? chip.color : chip.color + '44'}`,
                            background: active ? chip.color + '22' : chip.bg,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s',
                        }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: 700, color: chip.color }}>
                            {chip.value}
                        </Text>
                        <Text style={{ fontSize: 12, color: chip.color }}>{chip.label}</Text>
                    </div>
                );
            })}
        </Flex>
    );

    return (
        <div>
            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
                <Title level={2} style={{ margin: 0, fontSize: 24 }}>
                    <ToolOutlined style={{ marginRight: 10, color: token.colorPrimary }} />
                    {t('sidebar.navigation.incidentOverview')}
                </Title>
            </div>

            {/* ── Normal stats cards (only when panel is closed) ───────────── */}
            {!panelOpen && (
                <IncidentStatsCards
                    stats={stats}
                    statusFilter={statusFilter}
                    onFilterChange={(next) =>
                        setStatusFilter((prev) => (prev === next ? 'ALL' : next))
                    }
                />
            )}

            {/* ── Main split layout ─────────────────────────────────────────── */}
            <Row gutter={[16, 0]} align="stretch" wrap={false}>
                {/* Left column: (compact stats +) Kanban + Charts */}
                <Col
                    flex={panelOpen ? '0 0 58%' : '1 1 100%'}
                    style={{ transition: 'all 0.25s ease', minWidth: 0, overflow: 'hidden' }}
                >
                    {/* Compact chips only when panel is open */}
                    {panelOpen && compactStats}

                    {/* Kanban */}
                    <Card
                        style={{ borderRadius: 10, marginBottom: 16 }}
                        styles={{ body: { padding: '16px', overflowX: 'auto' } }}
                    >
                        {allQ.isLoading ? (
                            <Flex justify="center" style={{ padding: '80px 0' }}>
                                <Spin
                                    indicator={<LoadingOutlined spin style={{ fontSize: 32 }} />}
                                />
                            </Flex>
                        ) : (
                            <OverviewKanban
                                incidents={filteredIncidents}
                                selectedReportId={selectedReport?.reportId}
                                onView={handleCardClick}
                                onEdit={handleEditOpen}
                                onStatusChange={handleStatusChange}
                                onAddClick={() => router.push('/maintenance/incidents/create')}
                            />
                        )}
                    </Card>

                    <Card
                        style={{ borderRadius: 10, marginBottom: 16 }}
                        styles={{ body: { padding: '16px' } }}
                    >
                        <Table<IncidentReport>
                            dataSource={filteredIncidents}
                            rowKey="reportId"
                            columns={tableColumns}
                            pagination={{ pageSize: 4, showSizeChanger: false }}
                            size="small"
                            onRow={(record) => ({
                                onClick: () => handleCardClick(record),
                                style: {
                                    cursor: 'pointer',
                                    background:
                                        selectedReport?.reportId === record.reportId
                                            ? token.colorPrimaryBg
                                            : undefined,
                                    borderLeft:
                                        selectedReport?.reportId === record.reportId
                                            ? `3px solid ${token.colorPrimary}`
                                            : '3px solid transparent',
                                    transition: 'background 0.2s',
                                },
                            })}
                        />
                    </Card>
                    {/* Charts */}
                    <MaintenanceCharts incidents={allIncidents} />
                </Col>

                {/* Right column: Detail panel — sticky, full viewport height */}
                {panelOpen && (
                    <Col flex="0 0 42%" style={{ transition: 'all 0.25s ease', paddingLeft: 16 }}>
                        <div
                            style={{
                                position: 'sticky',
                                top: 8,
                                height: 'calc(100vh - 90px)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <OverviewDetailPanel
                                data={selectedReport}
                                onClose={() => setSelectedReport(null)}
                                onEdit={handleEditOpen}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                    </Col>
                )}
            </Row>

            {/* ── Edit modal ────────────────────────────────────────────────── */}
            <EntityFormModal<IncidentReportFormData & { status?: IncidentStatus }>
                open={editModal.open}
                onOpenChange={(o) => setEditModal((p) => ({ ...p, open: o }))}
                onSubmit={handleEditSubmit}
                mode="edit"
                initialData={editModal.data}
                fields={editFields}
                title={{ create: '', edit: t('maintenance.form.editTitle') }}
                description={{ create: '', edit: t('maintenance.form.editDescription') }}
                buttonLabels={{
                    cancel: t('maintenance.form.buttons.cancel'),
                    create: '',
                    edit: t('maintenance.form.buttons.edit'),
                    saving: t('maintenance.form.buttons.saving'),
                }}
                width={{ xs: '95%', sm: '80%', md: 720 }}
                auditMetaData={null}
            />

            {/* ── Confirm modal ─────────────────────────────────────────────── */}
            <ConfirmModal
                open={confirm.open}
                type={confirm.type}
                onConfirm={handleConfirm}
                onCancel={() => setConfirm({ open: false, type: 'delete', action: null })}
                t={t}
            />
        </div>
    );
}
