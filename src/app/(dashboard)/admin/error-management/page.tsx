'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Flex,
    Grid,
    Popover,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography,
    theme,
} from 'antd';
import {
    CalendarOutlined,
    FileExcelOutlined,
    FilterOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import {
    MachineIncidentFilterParams,
    MachineIncidentItem,
    MachineIncidentStatus,
    MachineIncidentUpdateRequest,
} from '@/types/MachineIncident';
import { MachineIncidentService } from '@/services/MachineIncidentService';
import { getErrorTableColumns } from './_components/Column';
import { CreateOrEditErrorModal } from './_components/CreateOrEditErrorModal';
import { ErrorDetailModal } from './_components/ErrorDetailModal';
import { ErrorInfoBar } from './_components/ErrorInfoBar';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { IndustryFilter } from '@/types/IndustryFilter';
import {
    TimeFilterPopoverContent,
    PeriodFilterMode,
    TimeFilterApplyPayload,
    formatTimeFilterLabel,
} from '@/components/shared/filters/TimeFilterPopover';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 10;

function ErrorManagementContent() {
    const { t, i18n } = useTranslation();
    const { token } = theme.useToken();
    const router = useRouter();
    const searchParams = useSearchParams();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const incidentCodeParam = searchParams.get('incidentCode');
    const machineCodeParam = searchParams.get('machineCode');
    const fromParam = searchParams.get('from');
    const openEditParam = searchParams.get('openEdit');

    usePageTitle(t('errorManagement.title'));

    // Incident list & pagination
    const [incidents, setIncidents] = useState<MachineIncidentItem[]>([]);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [totalIncidents, setTotalIncidents] = useState<number>(0);
    const [activeIncidents, setActiveIncidents] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // Highlighting State
    const [highlightedCode, setHighlightedCode] = useState<string | null>(
        incidentCodeParam || null
    );
    const [highlightedMachineCode, setHighlightedMachineCode] = useState<string | null>(
        machineCodeParam || null
    );
    const hasHandledNavigationRef = useRef<boolean>(false);

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<MachineIncidentStatus | undefined>(undefined);

    // Time period filter state (default to all time)
    const [industryFilters, setIndustryFilters] = useState<IndustryFilter[]>([]);
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<number | null>(null);
    const [isTimeFilterOpen, setIsTimeFilterOpen] = useState<boolean>(false);
    const [timeFilterMode, setTimeFilterMode] = useState<PeriodFilterMode | null>(null);
    const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    // Dynamic table height hook
    const { tableContainerRef, tableScrollY } = useAntdTableScroll();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedIncident, setSelectedIncident] = useState<MachineIncidentItem | null>(null);
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);

    // Fetch industry filters for quick select
    useEffect(() => {
        const fetchIndustryFilters = async () => {
            try {
                const filters = await IndustryFilterService.getIndustryFiltersForPicking();
                setIndustryFilters(filters);
            } catch (error) {
                console.error('Failed to fetch industry filters:', error);
            }
        };
        fetchIndustryFilters();
    }, []);

    const timePeriodOptions = useMemo((): {
        label: string;
        value: number;
        category: IndustryFilter['category'];
    }[] => {
        const currentLang = i18n.language;

        return industryFilters.map((filter: IndustryFilter) => ({
            label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
            value: filter.filterId,
            category: filter.category,
        }));
    }, [industryFilters, i18n.language]);

    const groupedTimePeriodOptions = useMemo(
        () => ({
            PERIOD: timePeriodOptions.filter((option) => option.category === 'PERIOD'),
        }),
        [timePeriodOptions]
    );

    // Active time period label formatted using shared helper (showShifts: false)
    const activeTimePeriodLabel = useMemo(
        () =>
            formatTimeFilterLabel({
                mode: timeFilterMode,
                startDate: selectedStartDate,
                endDate: selectedEndDate,
                periodId: selectedTimePeriod,
                industryFilters,
                showShifts: false,
                lang: i18n.language,
                t,
            }),
        [
            timeFilterMode,
            selectedStartDate,
            selectedEndDate,
            selectedTimePeriod,
            industryFilters,
            i18n.language,
            t,
        ]
    );

    const handleApplyTimeFilter = useCallback((payload: TimeFilterApplyPayload) => {
        setTimeFilterMode(payload.mode);
        setSelectedTimePeriod(payload.primaryFilterId);
        setSelectedStartDate(payload.startDate);
        setSelectedEndDate(payload.endDate);
        setIsTimeFilterOpen(false);
        setPage(0);
    }, []);

    const handleResetTimeFilter = useCallback(() => {
        setTimeFilterMode(null);
        setSelectedTimePeriod(null);
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        setIsTimeFilterOpen(false);
        setPage(0);
    }, []);

    const timeFilterPopoverContent = useMemo(
        () => (
            <TimeFilterPopoverContent
                currentMode={timeFilterMode}
                currentPeriodId={selectedTimePeriod}
                currentStartDate={selectedStartDate}
                currentEndDate={selectedEndDate}
                groupedOptions={groupedTimePeriodOptions}
                industryFilters={industryFilters}
                showShifts={false}
                isMobile={isMobile}
                isOpen={isTimeFilterOpen}
                onApply={handleApplyTimeFilter}
                onReset={handleResetTimeFilter}
                onCancel={() => setIsTimeFilterOpen(false)}
            />
        ),
        [
            timeFilterMode,
            selectedTimePeriod,
            selectedStartDate,
            selectedEndDate,
            groupedTimePeriodOptions,
            industryFilters,
            isMobile,
            isTimeFilterOpen,
            handleApplyTimeFilter,
            handleResetTimeFilter,
        ]
    );

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value.trim());
        setPage(0);
    }, []);

    // Fetch data from backend
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const filterParams: MachineIncidentFilterParams = {
                search: searchTerm || undefined,
                status: statusFilter || undefined,
                startDate: selectedStartDate || undefined,
                endDate: selectedEndDate || undefined,
                page,
                size: pageSize,
                sort: 'startTime,DESC',
            };

            const response = await MachineIncidentService.getIncidents(filterParams);

            if (response?.page) {
                setIncidents(response.page.content || []);
                setTotalElements(response.page.totalElements || 0);
            } else {
                setIncidents([]);
                setTotalElements(0);
            }

            setTotalIncidents(response?.totalIncidents ?? 0);
            setActiveIncidents(response?.activeIncidents ?? 0);
        } catch (_err) {
            toast.error(t('errorManagement.messages.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, selectedStartDate, selectedEndDate, page, pageSize, t]);

    const handleSearchPressEnter = useCallback(
        (value: string) => {
            const trimmed = value.trim();
            if (trimmed === searchTerm) {
                loadData();
            } else {
                setSearchTerm(trimmed);
                setPage(0);
            }
        },
        [searchTerm, loadData]
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle navigation context (incidentCode / machineCode from Machine Status)
    useEffect(() => {
        if (
            !loading &&
            incidents.length > 0 &&
            (incidentCodeParam || machineCodeParam) &&
            !hasHandledNavigationRef.current
        ) {
            const target = incidents.find((i) => {
                const codeParam = (incidentCodeParam || '').trim().toLowerCase();
                const mCodeParam = (machineCodeParam || '').trim().toLowerCase();

                if (codeParam && i.incidentCode.toLowerCase() === codeParam) return true;
                if (mCodeParam) {
                    const itemCode = (i.machineCode || '').toLowerCase();
                    const itemName = (i.machineName || '').toLowerCase();
                    if (
                        itemCode === mCodeParam ||
                        itemName === mCodeParam ||
                        itemName.includes(mCodeParam)
                    ) {
                        return true;
                    }
                }
                return false;
            });

            if (target) {
                setHighlightedCode(target.incidentCode);
                setHighlightedMachineCode(target.machineCode);

                // Auto-switch to page containing the target incident
                const targetIndex = incidents.findIndex(
                    (i) => i.machineIncidentId === target.machineIncidentId
                );
                if (targetIndex !== -1) {
                    const targetPage = Math.floor(targetIndex / pageSize);
                    if (targetPage !== page) {
                        setPage(targetPage);
                    }
                }

                // Scroll to target row smoothly
                setTimeout(() => {
                    const element = document.getElementById(`incident-row-${target.incidentCode}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 350);

                if (openEditParam === 'true' && target.endTime) {
                    setSelectedIncident(target);
                    setIsModalOpen(true);
                }
            }
            hasHandledNavigationRef.current = true;
        }
    }, [loading, incidents, incidentCodeParam, machineCodeParam, openEditParam, pageSize, page]);

    // Status filter options for direct header Select
    const statusOptions = useMemo(
        () => [
            {
                value: '',
                label: t('errorManagement.filters.allStatuses', {
                    defaultValue: 'Tất cả trạng thái',
                }),
            },
            {
                value: 'IN_PROGRESS',
                label: (
                    <Space size={6}>
                        <Badge status="warning" />
                        <span>{t('errorManagement.statuses.IN_PROGRESS')}</span>
                    </Space>
                ),
            },
            {
                value: 'RESOLVED',
                label: (
                    <Space size={6}>
                        <Badge status="success" />
                        <span>{t('errorManagement.statuses.RESOLVED')}</span>
                    </Space>
                ),
            },
        ],
        [t]
    );

    const activeFilterCount = [statusFilter, timeFilterMode].filter(Boolean).length;

    // Actions
    const handleOpenEditModal = (record: MachineIncidentItem) => {
        if (!record.endTime) {
            toast.warning(t('errorManagement.table.cannotUpdateOngoing'));
            return;
        }
        setSelectedIncident(record);
        setIsModalOpen(true);
    };

    const handleOpenDetailModal = (record: MachineIncidentItem) => {
        setSelectedIncident(record);
        setIsDetailModalOpen(true);
    };

    const handleModalSubmit = async (values: MachineIncidentUpdateRequest) => {
        if (!selectedIncident) return;
        try {
            setModalSubmitting(true);
            await MachineIncidentService.updateIncident(selectedIncident.machineIncidentId, values);
            toast.success(t('errorManagement.messages.updateSuccess'));
            setIsModalOpen(false);
            await loadData();
        } catch (err: any) {
            const errorCode = err?.response?.data?.code || err?.code;
            if (errorCode === 1902) {
                toast.error(t('errorManagement.modal.cannotUpdateOngoing'));
            } else {
                toast.error(
                    err?.response?.data?.message ||
                        t('common.errorOccurred', {
                            defaultValue: 'Có lỗi xảy ra khi lưu thông tin',
                        })
                );
            }
        } finally {
            setModalSubmitting(false);
        }
    };

    // Export incidents to CSV format with UTF-8 BOM
    const handleExport = () => {
        try {
            setIsExporting(true);
            const headers = [
                t('errorManagement.table.columns.incidentCode'),
                t('errorManagement.table.columns.machine'),
                'Mã Thiết Bị',
                t('errorManagement.table.columns.location'),
                t('errorManagement.table.columns.status'),
                t('errorManagement.table.columns.startTime'),
                t('errorManagement.table.columns.endTime'),
                `${t('errorManagement.table.columns.duration')} (phút)`,
                t('errorManagement.table.columns.cause'),
                t('errorManagement.table.columns.resolution'),
            ];

            const rows = incidents.map((item) => [
                `"${item.incidentCode}"`,
                `"${item.machineName || ''}"`,
                `"${item.machineCode || ''}"`,
                `"${(item.location || '').replace(/"/g, '""')}"`,
                `"${item.status}"`,
                `"${item.startTime}"`,
                `"${item.endTime || t('errorManagement.table.ongoingBadge')}"`,
                item.durationMinutes ?? '',
                `"${(item.rootCause || '').replace(/"/g, '""')}"`,
                `"${(item.resolution || '').replace(/"/g, '""')}"`,
            ]);

            const csvContent =
                '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `QWaste_Machine_Incidents_${new Date().toISOString().substring(0, 10)}.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(t('errorManagement.messages.exportSuccess'));
        } catch (_err) {
            toast.error(t('common.errorOccurred', { defaultValue: 'Không thể xuất dữ liệu' }));
        } finally {
            setIsExporting(false);
        }
    };

    const isRowHighlighted = useCallback(
        (record: MachineIncidentItem) => {
            const targetCode = (highlightedCode || incidentCodeParam)?.trim().toLowerCase();
            const targetMachine = (highlightedMachineCode || machineCodeParam)
                ?.trim()
                .toLowerCase();

            if (targetCode && record.incidentCode.toLowerCase() === targetCode) {
                return true;
            }
            if (targetMachine) {
                const mCode = (record.machineCode || '').toLowerCase();
                const mName = (record.machineName || '').toLowerCase();
                if (
                    mCode === targetMachine ||
                    mName === targetMachine ||
                    mName.includes(targetMachine)
                ) {
                    return true;
                }
            }
            return false;
        },
        [highlightedCode, incidentCodeParam, highlightedMachineCode, machineCodeParam]
    );

    const columns = useMemo(
        () =>
            getErrorTableColumns({
                token,
                t,
                onViewDetail: handleOpenDetailModal,
                onEdit: handleOpenEditModal,
                highlightedCode,
                highlightedMachineCode,
                isRowHighlighted,
                isMobile,
            }),
        [token, t, highlightedCode, highlightedMachineCode, isRowHighlighted, isMobile]
    );

    const handleTableChange = (pagination: any) => {
        if (pagination) {
            setPage(pagination.current - 1);
            setPageSize(pagination.pageSize);
        }
    };

    const handleBack = useCallback(() => {
        if (fromParam === 'machines') {
            router.push('/admin/machines');
        } else {
            router.back();
        }
    }, [fromParam, router]);

    return (
        <div
            style={{
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header with Search, FilterDrawer, Refresh and Export (No Create Button) */}
            <ResponsivePageHeader
                title={t('errorManagement.title')}
                onBack={fromParam ? handleBack : undefined}
                backLabel={
                    fromParam
                        ? isMobile
                            ? undefined
                            : t('common.back', { defaultValue: 'Quay lại' })
                        : undefined
                }
                backTooltip={
                    fromParam === 'machines'
                        ? t('errorManagement.navigation.backToMachineStatus', {
                              defaultValue: 'Quay lại Trạng thái máy',
                          })
                        : t('common.back', { defaultValue: 'Quay lại' })
                }
                rightContent={
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* Search by incident code, machine name or code */}
                        <SearchInput
                            placeholder={t('errorManagement.filters.searchPlaceholder', {
                                defaultValue: 'Tìm theo mã sự cố, tên máy, mã thiết bị...',
                            })}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onPressEnter={handleSearchPressEnter}
                            debounceMs={500}
                            width={260}
                        />

                        {/* Quick Status Filter Dropdown directly on header */}
                        <Select
                            value={statusFilter ?? ''}
                            onChange={(val) => {
                                setStatusFilter(val ? (val as MachineIncidentStatus) : undefined);
                                setPage(0);
                            }}
                            style={{ width: 175 }}
                            options={statusOptions}
                        />

                        {/* Time Filter Popover */}
                        <Popover
                            open={isTimeFilterOpen}
                            onOpenChange={setIsTimeFilterOpen}
                            trigger="click"
                            placement="bottomRight"
                            content={timeFilterPopoverContent}
                        >
                            <Tooltip title={activeTimePeriodLabel}>
                                <Button
                                    icon={<CalendarOutlined />}
                                    style={{
                                        borderRadius: token.borderRadiusSM,
                                        width: 220,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        gap: 6,
                                    }}
                                >
                                    <span
                                        style={{ flexShrink: 0, color: token.colorTextSecondary }}
                                    >
                                        {t('timeFilter.time', { defaultValue: 'Thời gian' })}:
                                    </span>
                                    <Typography.Text
                                        ellipsis
                                        style={{
                                            maxWidth: 125,
                                            color: 'inherit',
                                            lineHeight: 'inherit',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {activeTimePeriodLabel ?? t('common.filter')}
                                    </Typography.Text>
                                </Button>
                            </Tooltip>
                        </Popover>

                        <Tooltip title={t('errorManagement.header.btnRefresh')}>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={loadData}
                                loading={loading}
                                style={{ borderRadius: token.borderRadiusSM }}
                                type="primary"
                            >
                                {isMobile ? t('errorManagement.header.btnRefresh') : null}
                            </Button>
                        </Tooltip>
                        {/* 
                        <Button
                            type="primary"
                            icon={<FileExcelOutlined />}
                            onClick={handleExport}
                            loading={isExporting}
                            style={{ borderRadius: token.borderRadiusSM }}
                        >
                            {t('common.exportExcel')}
                        </Button> */}
                    </div>
                }
            />

            {/* KPI Summary Bar */}
            <ErrorInfoBar totalIncidents={totalIncidents} activeIncidents={activeIncidents} />

            {/* Active Filter Tags */}
            {activeFilterCount > 0 && (
                <Flex gap={8} align="center" wrap style={{ marginBottom: 12 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <FilterOutlined style={{ marginRight: 4 }} />
                        {t('common.activeFilters')}:
                    </Typography.Text>
                    {timeFilterMode && (
                        <Tag closable onClose={handleResetTimeFilter} color="blue">
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            {activeTimePeriodLabel}
                        </Tag>
                    )}
                    {statusFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setStatusFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('errorManagement.table.columns.status')}:{' '}
                            {t(`errorManagement.statuses.${statusFilter}`)}
                        </Tag>
                    )}
                </Flex>
            )}

            {/* Main Table Card filling flex: 1 */}
            <Card
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                styles={{
                    body: {
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        paddingBottom: 0,
                    },
                }}
            >
                <div
                    ref={tableContainerRef}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                    }}
                >
                    <Table<MachineIncidentItem>
                        columns={columns}
                        dataSource={incidents}
                        loading={loading}
                        onChange={handleTableChange}
                        rowKey="machineIncidentId"
                        onRow={(record) => ({
                            id: `incident-row-${record.incidentCode}`,
                            'data-highlighted': isRowHighlighted(record) ? 'true' : undefined,
                        })}
                        rowClassName={(record) =>
                            isRowHighlighted(record) ? 'highlighted-incident-row' : ''
                        }
                        pagination={{
                            current: page + 1,
                            pageSize: pageSize,
                            total: totalElements,
                            hideOnSinglePage: false,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t(
                                    'common.items'
                                )}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            placement: ['bottomCenter'],
                        }}
                        scroll={{
                            x: 'max-content',
                            y: tableScrollY,
                        }}
                        style={{ height: '100%' }}
                    />
                </div>
            </Card>

            {/* Update Root Cause & Resolution Modal */}
            <CreateOrEditErrorModal
                open={isModalOpen}
                incident={selectedIncident}
                onCancel={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                loading={modalSubmitting}
            />

            {/* Detail Modal */}
            <ErrorDetailModal
                open={isDetailModalOpen}
                incident={selectedIncident}
                onClose={() => setIsDetailModalOpen(false)}
                onEdit={handleOpenEditModal}
            />
        </div>
    );
}

export default function ErrorManagementPage() {
    return (
        <Suspense
            fallback={
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <Spin size="large" />
                </div>
            }
        >
            <ErrorManagementContent />
        </Suspense>
    );
}
