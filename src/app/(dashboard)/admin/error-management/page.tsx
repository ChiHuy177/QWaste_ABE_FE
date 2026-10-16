'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Card, Grid, Space, Spin, Table, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import {
    MachineIncidentFilterParams,
    MachineIncidentItem,
    MachineIncidentStatus,
    MachineIncidentUpdateRequest,
} from '@/types/MachineIncident';
import { MachineIncidentService } from '@/services/MachineIncidentService';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { IndustryFilter } from '@/types/IndustryFilter';
import {
    PeriodFilterMode,
    TimeFilterApplyPayload,
} from '@/components/shared/filters/TimeFilterPopover';
import {
    CreateOrEditErrorModal,
    ErrorActiveFilterTags,
    ErrorDetailModal,
    ErrorInfoBar,
    ErrorManagementHeader,
    formatTimeFilterLabel,
    getErrorTableColumns,
} from '@/features/dashboard/error-management';

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
            SHIFT: [],
            PERIOD: timePeriodOptions.filter((option) => option.category === 'PERIOD'),
        }),
        [timePeriodOptions]
    );

    // Active time period label formatted using feature helper
    const activeTimePeriodLabel = useMemo(
        () =>
            formatTimeFilterLabel({
                mode: timeFilterMode,
                startDate: selectedStartDate,
                endDate: selectedEndDate,
                periodId: selectedTimePeriod,
                industryFilters,
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
        setPage(0);
    }, []);

    const handleResetTimeFilter = useCallback(() => {
        setTimeFilterMode(null);
        setSelectedTimePeriod(null);
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        setPage(0);
    }, []);

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
            {/* Header with Search, Status, TimeFilter, Refresh */}
            <ErrorManagementHeader
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onSearchPressEnter={handleSearchPressEnter}
                statusFilter={statusFilter}
                onStatusFilterChange={(val) => {
                    setStatusFilter(val);
                    setPage(0);
                }}
                statusOptions={statusOptions}
                timeFilterMode={timeFilterMode}
                selectedTimePeriod={selectedTimePeriod}
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
                groupedTimePeriodOptions={groupedTimePeriodOptions}
                industryFilters={industryFilters}
                onApplyTimeFilter={handleApplyTimeFilter}
                onRefresh={loadData}
                loading={loading}
                fromParam={fromParam}
                onBack={handleBack}
                isMobile={isMobile}
            />

            {/* KPI Summary Bar */}
            <ErrorInfoBar totalIncidents={totalIncidents} activeIncidents={activeIncidents} />

            {/* Active Filter Tags */}
            <ErrorActiveFilterTags
                timeFilterMode={timeFilterMode}
                activeTimePeriodLabel={activeTimePeriodLabel}
                onResetTimeFilter={handleResetTimeFilter}
                statusFilter={statusFilter}
                onResetStatusFilter={() => {
                    setStatusFilter(undefined);
                    setPage(0);
                }}
            />

            {/* Main Table Card */}
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
