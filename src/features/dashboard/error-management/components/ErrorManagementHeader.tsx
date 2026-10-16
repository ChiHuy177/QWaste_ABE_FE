'use client';

import React from 'react';
import { Button, Select, Space, Tooltip, theme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import TimeFilterPopover, {
    PeriodFilterMode,
    TimeFilterApplyPayload,
} from '@/components/shared/filters/TimeFilterPopover';
import { IndustryFilter } from '@/types/IndustryFilter';
import { MachineIncidentStatus } from '@/types/MachineIncident';

export interface ErrorManagementHeaderProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearchPressEnter: (value: string) => void;
    statusFilter: MachineIncidentStatus | undefined;
    onStatusFilterChange: (status: MachineIncidentStatus | undefined) => void;
    statusOptions: { value: string; label: React.ReactNode }[];
    timeFilterMode: PeriodFilterMode | null;
    selectedTimePeriod: number | null;
    selectedStartDate: string | null;
    selectedEndDate: string | null;
    groupedTimePeriodOptions: {
        PERIOD: { label: string; value: number; category: IndustryFilter['category'] }[];
    };
    industryFilters: IndustryFilter[];
    onApplyTimeFilter: (payload: TimeFilterApplyPayload) => void;
    onRefresh: () => void;
    loading: boolean;
    fromParam?: string | null;
    onBack?: () => void;
    isMobile?: boolean;
}

export const ErrorManagementHeader: React.FC<ErrorManagementHeaderProps> = React.memo(
    ({
        searchTerm,
        onSearchChange,
        onSearchPressEnter,
        statusFilter,
        onStatusFilterChange,
        statusOptions,
        timeFilterMode,
        selectedTimePeriod,
        selectedStartDate,
        selectedEndDate,
        groupedTimePeriodOptions,
        industryFilters,
        onApplyTimeFilter,
        onRefresh,
        loading,
        fromParam,
        onBack,
        isMobile = false,
    }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        return (
            <ResponsivePageHeader
                title={t('errorManagement.title')}
                onBack={fromParam ? onBack : undefined}
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
                            onChange={onSearchChange}
                            onPressEnter={onSearchPressEnter}
                            debounceMs={500}
                            width={260}
                        />

                        {/* Quick Status Filter Dropdown directly on header */}
                        <Select
                            value={statusFilter ?? ''}
                            onChange={(val) => {
                                onStatusFilterChange(
                                    val ? (val as MachineIncidentStatus) : undefined
                                );
                            }}
                            style={{ width: 175 }}
                            options={statusOptions}
                        />

                        {/* Time Filter Popover */}
                        <TimeFilterPopover
                            currentMode={timeFilterMode ?? 'PRESET'}
                            currentPeriodId={selectedTimePeriod}
                            currentShiftId={null}
                            currentStartDate={selectedStartDate ?? ''}
                            currentEndDate={selectedEndDate ?? ''}
                            groupedOptions={groupedTimePeriodOptions}
                            industryFilters={industryFilters}
                            showShifts={false}
                            onApply={onApplyTimeFilter}
                            placement="bottomRight"
                        />

                        <Tooltip title={t('errorManagement.header.btnRefresh')}>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={onRefresh}
                                loading={loading}
                                style={{ borderRadius: token.borderRadiusSM }}
                                type="primary"
                            >
                                {isMobile ? t('errorManagement.header.btnRefresh') : null}
                            </Button>
                        </Tooltip>
                    </div>
                }
            />
        );
    }
);

ErrorManagementHeader.displayName = 'ErrorManagementHeader';
