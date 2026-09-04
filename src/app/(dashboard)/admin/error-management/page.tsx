'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Flex,
    Grid,
    Popover,
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
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import FilterDrawer from '@/components/shared/filters/FilterDrawer';
import { FilterField } from '@/components/shared/filters/AdvancedFilterPanel';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import {
    CreateErrorIncidentDto,
    ErrorIncident,
    ErrorStatus,
    ErrorSummaryStats,
} from '@/types/ErrorManagement';
import { ErrorManagementService } from '@/services/ErrorManagementService';
import { initialErrorSummaryStats } from '@/configs/mockData/errorManagementMockData';
import { getErrorTableColumns } from './_components/Column';
import { ErrorInfoBar } from './_components/ErrorInfoBar';
import { CreateOrEditErrorModal } from './_components/CreateOrEditErrorModal';
import { ErrorDetailDrawer } from './_components/ErrorDetailDrawer';
import {
    TimeFilterPopoverContent,
    ErrorPeriodFilterMode,
    ErrorTimeFilterApplyPayload,
} from './_components/TimeFilterPopoverContent';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 10;

export default function ErrorManagementPage() {
    const { t, i18n } = useTranslation();
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    usePageTitle(t('errorManagement.title'));

    const [incidents, setIncidents] = useState<ErrorIncident[]>([]);
    const [stats, setStats] = useState<ErrorSummaryStats>(initialErrorSummaryStats);
    const [loading, setLoading] = useState<boolean>(true);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [codeFilter, setCodeFilter] = useState<string | undefined>(undefined);
    const [machineNameFilter, setMachineNameFilter] = useState<string | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

    // Time period filter state (default to MONTH 2025-08 where incidents exist)
    const [isTimeFilterOpen, setIsTimeFilterOpen] = useState<boolean>(false);
    const [timeFilterMode, setTimeFilterMode] = useState<ErrorPeriodFilterMode | null>('MONTH');
    const [selectedStartDate, setSelectedStartDate] = useState<string | null>('2025-08-01');
    const [selectedEndDate, setSelectedEndDate] = useState<string | null>('2025-08-31');

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    // Dynamic table height hook
    const { tableContainerRef, tableScrollY } = useAntdTableScroll();

    // Modal & Drawer State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
    const [selectedIncident, setSelectedIncident] = useState<ErrorIncident | null>(null);
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);

    // Active time period label formatted
    const activeTimePeriodLabel = useMemo(() => {
        if (!timeFilterMode || !selectedStartDate || !selectedEndDate) {
            return t('timeFilter.all', { defaultValue: 'Tất cả thời gian' });
        }

        if (timeFilterMode === 'WEEK') {
            const startStr = dayjs(selectedStartDate).format('DD/MM');
            const endStr = dayjs(selectedEndDate).format('DD/MM');
            const weekNum = dayjs(selectedStartDate).isoWeek();
            const yearStr = dayjs(selectedStartDate).format('YYYY');
            return `${t('timeFilter.weekLabel', {
                week: weekNum,
                year: yearStr,
                defaultValue: `Tuần ${weekNum}, ${yearStr}`,
            })} (${startStr} → ${endStr})`;
        }

        if (timeFilterMode === 'MONTH') {
            const monthStr = dayjs(selectedStartDate).format('MM');
            const yearStr = dayjs(selectedStartDate).format('YYYY');
            return t('timeFilter.monthLabel', {
                month: monthStr,
                year: yearStr,
                defaultValue: `Tháng ${monthStr}/${yearStr}`,
            });
        }

        if (timeFilterMode === 'QUARTER') {
            const quarterNum = dayjs(selectedStartDate).quarter();
            const yearStr = dayjs(selectedStartDate).format('YYYY');
            return t('timeFilter.quarterLabel', {
                quarter: quarterNum,
                year: yearStr,
                defaultValue: `Quý ${quarterNum}/${yearStr}`,
            });
        }

        if (timeFilterMode === 'YEAR') {
            const yearStr = dayjs(selectedStartDate).format('YYYY');
            return t('timeFilter.yearLabel', {
                year: yearStr,
                defaultValue: `Năm ${yearStr}`,
            });
        }

        if (timeFilterMode === 'CUSTOM_RANGE') {
            return `${dayjs(selectedStartDate).format('DD/MM/YYYY')} → ${dayjs(selectedEndDate).format('DD/MM/YYYY')}`;
        }

        return t('timeFilter.all', { defaultValue: 'Tất cả thời gian' });
    }, [timeFilterMode, selectedStartDate, selectedEndDate, t]);

    const handleApplyTimeFilter = useCallback((payload: ErrorTimeFilterApplyPayload) => {
        setTimeFilterMode(payload.mode);
        setSelectedStartDate(payload.startDate);
        setSelectedEndDate(payload.endDate);
        setIsTimeFilterOpen(false);
        setPage(0);
    }, []);

    const handleResetTimeFilter = useCallback(() => {
        setTimeFilterMode(null);
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        setIsTimeFilterOpen(false);
        setPage(0);
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value.trim());
        setPage(0);
    }, []);

    // Fetch data
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const filterParams = {
                searchText: searchTerm,
                status: (statusFilter as ErrorStatus) || 'all',
                startDate: selectedStartDate || undefined,
                endDate: selectedEndDate || undefined,
            };
            const [listResult, statsResult] = await Promise.all([
                ErrorManagementService.getIncidents(filterParams),
                ErrorManagementService.getSummaryStats(filterParams),
            ]);

            // Additional client-side filter matching advanced fields
            let data = listResult.data;
            if (codeFilter) {
                const term = codeFilter.toLowerCase();
                data = data.filter((i) => i.code.toLowerCase().includes(term));
            }
            if (machineNameFilter) {
                const term = machineNameFilter.toLowerCase();
                data = data.filter(
                    (i) =>
                        i.machineName.toLowerCase().includes(term) ||
                        i.machineCode.toLowerCase().includes(term)
                );
            }

            setIncidents(data);
            setStats(statsResult);
        } catch (_err) {
            toast.error(t('errorManagement.messages.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [
        searchTerm,
        statusFilter,
        codeFilter,
        machineNameFilter,
        selectedStartDate,
        selectedEndDate,
        t,
    ]);

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

    // Active filters count
    const drawerFilterCount = [codeFilter, machineNameFilter, statusFilter].filter(Boolean).length;
    const activeFilterCount = [codeFilter, machineNameFilter, statusFilter, timeFilterMode].filter(
        Boolean
    ).length;

    // Advanced filter fields for FilterDrawer
    const errorFilterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'code',
                label: t('errorManagement.table.columns.incidentCode'),
                placeholder: 'Ví dụ: ERR-2025...',
                value: codeFilter ?? '',
            },
            {
                key: 'machineName',
                label: t('errorManagement.table.columns.machine'),
                placeholder: 'Ví dụ: Máy ép, CNC...',
                value: machineNameFilter ?? '',
            },
            {
                key: 'status',
                label: t('errorManagement.table.columns.status'),
                type: 'select',
                placeholder: t('errorManagement.filters.allStatuses', {
                    defaultValue: 'Tất cả trạng thái',
                }),
                value: statusFilter ?? '',
                options: [
                    { value: 'open', label: t('errorManagement.statuses.open') },
                    { value: 'in_progress', label: t('errorManagement.statuses.in_progress') },
                    { value: 'resolved', label: t('errorManagement.statuses.resolved') },
                    { value: 'closed', label: t('errorManagement.statuses.closed') },
                ],
            },
        ],
        [t, codeFilter, machineNameFilter, statusFilter]
    );

    const handleResetFilters = useCallback(() => {
        setCodeFilter(undefined);
        setMachineNameFilter(undefined);
        setStatusFilter(undefined);
        setPage(0);
    }, []);

    const handleApplyFilters = useCallback((values: Record<string, string>) => {
        setCodeFilter(values.code?.trim() || undefined);
        setMachineNameFilter(values.machineName?.trim() || undefined);
        setStatusFilter(values.status?.trim() || undefined);
        setPage(0);
    }, []);

    // Actions
    const handleOpenCreateModal = () => {
        setSelectedIncident(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (record: ErrorIncident) => {
        setSelectedIncident(record);
        setIsModalOpen(true);
    };

    const handleOpenDetailDrawer = (record: ErrorIncident) => {
        setSelectedIncident(record);
        setIsDrawerOpen(true);
    };

    const handleModalSubmit = async (values: CreateErrorIncidentDto) => {
        try {
            setModalSubmitting(true);
            if (selectedIncident) {
                await ErrorManagementService.updateIncident(selectedIncident.id, values);
                toast.success(t('errorManagement.messages.updateSuccess'));
            } else {
                await ErrorManagementService.createIncident(values);
                toast.success(t('errorManagement.messages.createSuccess'));
            }
            setIsModalOpen(false);
            await loadData();
        } catch (_err) {
            toast.error('Có lỗi xảy ra khi lưu thông tin');
        } finally {
            setModalSubmitting(false);
        }
    };

    const handleDelete = async (record: ErrorIncident) => {
        try {
            await ErrorManagementService.deleteIncident(record.id);
            toast.success(t('errorManagement.messages.deleteSuccess'));
            await loadData();
        } catch (_err) {
            toast.error('Không thể xóa sự cố');
        }
    };

    // Export incidents to CSV format with UTF-8 BOM
    const handleExport = () => {
        try {
            setIsExporting(true);
            const headers = [
                'Mã Sự Cố',
                'Tên Thiết Bị',
                'Mã Thiết Bị',
                'Dây Chuyền',
                'Khu Vực',
                'Trạng Thái',
                'Giờ Bắt Đầu',
                'Giờ Kết Thúc',
                'Thời Lượng (Phút)',
                'Nguyên Nhân (Root Cause)',
                'Cách Khắc Phục (Countermeasure)',
                'Biện Pháp Phòng Ngừa',
            ];

            const rows = incidents.map((item) => [
                `"${item.code}"`,
                `"${item.machineName}"`,
                `"${item.machineCode}"`,
                `"${item.lineName}"`,
                `"${item.zoneName}"`,
                `"${item.status}"`,
                `"${item.startTime}"`,
                `"${item.endTime || 'Đang xử lý'}"`,
                item.durationMinutes,
                `"${(item.cause || '').replace(/"/g, '""')}"`,
                `"${(item.resolution || '').replace(/"/g, '""')}"`,
                `"${(item.preventiveAction || '').replace(/"/g, '""')}"`,
            ]);

            const csvContent =
                '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `QWaste_Error_Incidents_${new Date().toISOString().substring(0, 10)}.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(t('errorManagement.messages.exportSuccess'));
        } catch (_err) {
            toast.error('Không thể xuất dữ liệu');
        } finally {
            setIsExporting(false);
        }
    };

    const columns = useMemo(
        () =>
            getErrorTableColumns({
                token,
                t,
                onViewDetail: handleOpenDetailDrawer,
                onEdit: handleOpenEditModal,
                onDelete: handleDelete,
            }),
        [token, t]
    );

    const handleTableChange = (pagination: any) => {
        if (pagination) {
            setPage(pagination.current - 1);
            setPageSize(pagination.pageSize);
        }
    };

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
            {/* Header with Search, FilterDrawer, Refresh and Export */}
            <ResponsivePageHeader
                title={t('errorManagement.title')}
                rightContent={
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* Search and Advanced Filter drawer paired together */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <SearchInput
                                placeholder={t('errorManagement.filters.searchPlaceholder')}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onPressEnter={handleSearchPressEnter}
                                debounceMs={500}
                                width={240}
                            />

                            <FilterDrawer
                                open={showAdvancedFilters}
                                onClose={() => setShowAdvancedFilters(false)}
                                fields={errorFilterFields}
                                onReset={handleResetFilters}
                                onApply={handleApplyFilters}
                                resetLabel={t('common.reset')}
                                applyLabel={t('common.search')}
                                title={t('common.advancedFilters')}
                            >
                                <Badge count={drawerFilterCount} size="small" offset={[-6, 4]}>
                                    <Button
                                        icon={<FilterOutlined />}
                                        type={showAdvancedFilters ? 'primary' : 'default'}
                                        onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                    />
                                </Badge>
                            </FilterDrawer>
                        </div>

                        {/* Time Filter Popover */}
                        <Popover
                            open={isTimeFilterOpen}
                            onOpenChange={setIsTimeFilterOpen}
                            trigger="click"
                            placement="bottomRight"
                            content={
                                <TimeFilterPopoverContent
                                    currentMode={timeFilterMode}
                                    currentStartDate={selectedStartDate}
                                    currentEndDate={selectedEndDate}
                                    isOpen={isTimeFilterOpen}
                                    onApply={handleApplyTimeFilter}
                                    onReset={handleResetTimeFilter}
                                    onCancel={() => setIsTimeFilterOpen(false)}
                                    defaultDate="2025-08-25"
                                />
                            }
                        >
                            <Tooltip title={activeTimePeriodLabel}>
                                <Button
                                    style={{
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        gap: 6,
                                        minWidth: 170,
                                    }}
                                    icon={<CalendarOutlined />}
                                >
                                    <span
                                        style={{ flexShrink: 0, color: token.colorTextSecondary }}
                                    >
                                        {t('timeFilter.time', { defaultValue: 'Thời gian' })}:
                                    </span>
                                    <Typography.Text
                                        ellipsis
                                        style={{
                                            maxWidth: 140,
                                            color: 'inherit',
                                            lineHeight: 'inherit',
                                            fontWeight: timeFilterMode ? 600 : 400,
                                        }}
                                    >
                                        {activeTimePeriodLabel}
                                    </Typography.Text>
                                </Button>
                            </Tooltip>
                        </Popover>

                        <Tooltip
                            title={i18n.language === 'vi' ? 'Làm mới dữ liệu' : 'Refresh data'}
                        >
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={loadData}
                                loading={loading}
                                style={{ borderRadius: 8 }}
                                type="primary"
                            >
                                {isMobile
                                    ? i18n.language === 'vi'
                                        ? 'Làm mới dữ liệu'
                                        : 'Refresh data'
                                    : null}
                            </Button>
                        </Tooltip>

                        <Button
                            type="primary"
                            icon={<FileExcelOutlined />}
                            onClick={handleExport}
                            loading={isExporting}
                            style={{ borderRadius: 8 }}
                        >
                            {t('common.exportExcel')}
                        </Button>
                    </div>
                }
            />

            {/* Filter Info Bar */}
            <ErrorInfoBar
                totalIncidents={stats.totalIncidents}
                displayedIncidents={incidents.length}
                stats={stats}
                isFiltered={Boolean(searchTerm || activeFilterCount > 0)}
            />

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
                    {codeFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setCodeFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('errorManagement.table.columns.incidentCode')}: {codeFilter}
                        </Tag>
                    )}
                    {machineNameFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setMachineNameFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('errorManagement.table.columns.machine')}: {machineNameFilter}
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
                    <Table<ErrorIncident>
                        columns={columns}
                        dataSource={incidents}
                        loading={loading}
                        onChange={handleTableChange}
                        rowKey="id"
                        pagination={{
                            current: page + 1,
                            pageSize: pageSize,
                            total: incidents.length,
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

            {/* Edit Modal */}
            <CreateOrEditErrorModal
                open={isModalOpen}
                incident={selectedIncident}
                onCancel={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                loading={modalSubmitting}
            />

            {/* Detail Drawer */}
            <ErrorDetailDrawer
                open={isDrawerOpen}
                incident={selectedIncident}
                onClose={() => setIsDrawerOpen(false)}
                onEdit={handleOpenEditModal}
            />
        </div>
    );
}
