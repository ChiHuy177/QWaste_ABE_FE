'use client';

import React from 'react';
import { Button, Grid, Select, Skeleton, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import { SpacePickingWithChildren } from '@/types/Space';
import { IndustryFilter } from '@/types/IndustryFilter';
import TimeFilterPopover, {
    PeriodFilterMode,
    TimeFilterApplyPayload,
} from '@/components/shared/filters/TimeFilterPopover';

const { useBreakpoint } = Grid;

export interface ProductionOverviewHeaderProps {
    spaces: SpacePickingWithChildren[];
    selectedFactoryId: number | null;
    onFactoryChange: (factoryId: number) => void;
    industryFilters: IndustryFilter[];
    currentMode: PeriodFilterMode;
    currentPeriodId: number | null;
    currentShiftId: number | null;
    startDate: string;
    endDate: string;
    groupedOptions: {
        SHIFT: { label: string; value: number }[];
        PERIOD: { label: string; value: number }[];
    };
    isShiftActive: (filter: IndustryFilter) => boolean;
    onApplyTimeFilter: (payload: TimeFilterApplyPayload) => void;
    onRefresh: () => void;
    onExportExcel: () => void;
    isLoadingSpaces: boolean;
    isLoadingData: boolean;
    isExporting?: boolean;
}

export const ProductionOverviewHeader: React.FC<ProductionOverviewHeaderProps> = React.memo(
    ({
        spaces,
        selectedFactoryId,
        onFactoryChange,
        industryFilters,
        currentMode,
        currentPeriodId,
        currentShiftId,
        startDate,
        endDate,
        groupedOptions,
        isShiftActive,
        onApplyTimeFilter,
        onRefresh,
        onExportExcel,
        isLoadingSpaces,
        isLoadingData,
        isExporting = false,
    }) => {
        const { t } = useTranslation();
        const screens = useBreakpoint();
        const isMobile = !screens.md;

        const isExportDisabled = true;

        return isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {selectedFactoryId !== null &&
                    (isLoadingSpaces ? (
                        <Skeleton.Input active block style={{ height: 32 }} />
                    ) : (
                        <Select
                            value={selectedFactoryId}
                            onChange={onFactoryChange}
                            options={spaces.map((f) => ({
                                label: `${f.spaceCode} — ${f.spaceName}`,
                                value: f.spaceId,
                            }))}
                            style={{ width: '100%' }}
                            showSearch={{
                                filterOption: (input, option) =>
                                    ((option?.label as string) ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase()),
                            }}
                        />
                    ))}

                <TimeFilterPopover
                    currentMode={currentMode}
                    currentPeriodId={currentPeriodId}
                    currentShiftId={currentShiftId}
                    currentStartDate={startDate}
                    currentEndDate={endDate}
                    groupedOptions={groupedOptions}
                    industryFilters={industryFilters}
                    isShiftActive={isShiftActive}
                    onApply={onApplyTimeFilter}
                    placement="bottomLeft"
                />

                <Button
                    block
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    loading={isLoadingData}
                    style={{ borderRadius: 8 }}
                >
                    {t('spaceMonitoring.timeFilter.refreshData', 'Làm mới dữ liệu')}
                </Button>

                <Tooltip
                    title={t('common.featureUnderDevelopment', 'Tính năng đang được phát triển')}
                >
                    <div style={{ width: '100%' }}>
                        <Button
                            block
                            type="primary"
                            icon={<FileExcelOutlined />}
                            onClick={onExportExcel}
                            loading={isExporting}
                            disabled={isExportDisabled}
                            style={{ borderRadius: 8 }}
                        >
                            {t('common.exportExcel', 'Xuất Excel')}
                        </Button>
                    </div>
                </Tooltip>
            </div>
        ) : (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                {selectedFactoryId !== null &&
                    (isLoadingSpaces ? (
                        <Skeleton.Input active style={{ width: 220, height: 32 }} />
                    ) : (
                        <Select
                            value={selectedFactoryId}
                            onChange={onFactoryChange}
                            options={spaces.map((f) => ({
                                label: `${f.spaceCode} — ${f.spaceName}`,
                                value: f.spaceId,
                            }))}
                            style={{ width: 220 }}
                            showSearch={{
                                filterOption: (input, option) =>
                                    ((option?.label as string) ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase()),
                            }}
                        />
                    ))}

                <TimeFilterPopover
                    currentMode={currentMode}
                    currentPeriodId={currentPeriodId}
                    currentShiftId={currentShiftId}
                    currentStartDate={startDate}
                    currentEndDate={endDate}
                    groupedOptions={groupedOptions}
                    industryFilters={industryFilters}
                    isShiftActive={isShiftActive}
                    onApply={onApplyTimeFilter}
                    placement="bottomRight"
                />

                <Tooltip title={t('spaceMonitoring.timeFilter.refreshData', 'Làm mới dữ liệu')}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={onRefresh}
                        loading={isLoadingData}
                        style={{ borderRadius: 8 }}
                        type="primary"
                    />
                </Tooltip>

                <Tooltip
                    title={t('common.featureUnderDevelopment', 'Tính năng đang được phát triển')}
                >
                    <span>
                        <Button
                            type="primary"
                            icon={<FileExcelOutlined />}
                            onClick={onExportExcel}
                            loading={isExporting}
                            disabled={isExportDisabled}
                            style={{ borderRadius: 8 }}
                        >
                            {t('common.exportExcel', 'Xuất Excel')}
                        </Button>
                    </span>
                </Tooltip>
            </div>
        );
    }
);

ProductionOverviewHeader.displayName = 'ProductionOverviewHeader';

export default ProductionOverviewHeader;
