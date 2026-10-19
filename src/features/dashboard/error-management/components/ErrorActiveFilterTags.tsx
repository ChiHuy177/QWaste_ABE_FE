'use client';

import React from 'react';
import { Flex, Tag, Typography } from 'antd';
import { CalendarOutlined, FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PeriodFilterMode } from '@/components/shared/filters/TimeFilterPopover';
import { MachineIncidentStatus } from '@/types/MachineIncident';

export interface ErrorActiveFilterTagsProps {
    timeFilterMode: PeriodFilterMode | null;
    activeTimePeriodLabel?: string | null;
    onResetTimeFilter: () => void;
    statusFilter: MachineIncidentStatus | undefined;
    onResetStatusFilter: () => void;
}

export const ErrorActiveFilterTags: React.FC<ErrorActiveFilterTagsProps> = React.memo(
    ({
        timeFilterMode,
        activeTimePeriodLabel,
        onResetTimeFilter,
        statusFilter,
        onResetStatusFilter,
    }) => {
        const { t } = useTranslation();

        const activeFilterCount = [statusFilter, timeFilterMode].filter(Boolean).length;
        if (activeFilterCount === 0) return null;

        return (
            <Flex gap={8} align="center" wrap style={{ marginBottom: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <FilterOutlined style={{ marginRight: 4 }} />
                    {t('common.activeFilters')}:
                </Typography.Text>
                {timeFilterMode && activeTimePeriodLabel && (
                    <Tag closable onClose={onResetTimeFilter} color="blue">
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {activeTimePeriodLabel}
                    </Tag>
                )}
                {statusFilter && (
                    <Tag closable onClose={onResetStatusFilter}>
                        {t('errorManagement.table.columns.status')}:{' '}
                        {t(`errorManagement.statuses.${statusFilter}`)}
                    </Tag>
                )}
            </Flex>
        );
    }
);

ErrorActiveFilterTags.displayName = 'ErrorActiveFilterTags';
