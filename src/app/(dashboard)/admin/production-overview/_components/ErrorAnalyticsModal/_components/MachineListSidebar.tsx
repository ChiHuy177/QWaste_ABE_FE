'use client';

import React, { useCallback } from 'react';
import { Typography, Select, Tag, Button, Tooltip, Empty, theme } from 'antd';
import { DesktopOutlined, RightOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MachineStatusSummaryItem } from '@/types/Monitoring';
import { SearchInput } from '@/components/shared/SearchInput/SearchInput';
import { formatHours } from '../errorAnalyticsUtils';

const { Text } = Typography;

// --- Subcomponent: Memoized Machine Card Item ---
interface MachineCardItemProps {
    machine: MachineStatusSummaryItem;
    isSelected: boolean;
    workshopName?: string;
    onSelect: (machine: MachineStatusSummaryItem) => void;
}

const MachineCardItem = React.memo<MachineCardItemProps>(
    ({ machine, isSelected, workshopName, onSelect }) => {
        const { token } = theme.useToken();
        const hasError = (machine.totalErrorHours || 0) > 0;

        const handleClick = useCallback(() => {
            onSelect(machine);
        }, [onSelect, machine]);

        return (
            <div
                onClick={handleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: token.borderRadiusLG,
                    border: `1px solid ${
                        isSelected ? token.colorPrimary : token.colorBorderSecondary
                    }`,
                    backgroundColor: isSelected ? token.colorPrimaryBg : token.colorBgContainer,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease-in-out',
                    boxShadow: isSelected ? `0 2px 6px ${token.colorPrimary}22` : 'none',
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.backgroundColor = token.colorFillAlter;
                        e.currentTarget.style.borderColor = token.colorBorder;
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.backgroundColor = token.colorBgContainer;
                        e.currentTarget.style.borderColor = token.colorBorderSecondary;
                    }
                }}
            >
                {/* Left: Icon + Name & Machine ID */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        minWidth: 0,
                        flex: 1,
                    }}
                >
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: token.borderRadiusSM,
                            backgroundColor: isSelected
                                ? token.colorPrimary
                                : hasError
                                  ? token.colorErrorBg
                                  : token.colorFillAlter,
                            color: isSelected
                                ? token.colorWhite
                                : hasError
                                  ? token.colorError
                                  : token.colorTextSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.18s ease',
                        }}
                    >
                        <DesktopOutlined style={{ fontSize: 16 }} />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                            gap: 2,
                        }}
                    >
                        <Text
                            strong
                            ellipsis={{
                                tooltip: machine.machineName,
                            }}
                            style={{
                                fontSize: 13,
                                color: isSelected ? token.colorPrimary : token.colorTextHeading,
                                lineHeight: 1.3,
                            }}
                        >
                            {machine.machineName}
                        </Text>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: 11,
                                    lineHeight: 1.2,
                                }}
                            >
                                {machine.machineId}
                            </Text>
                            {workshopName && (
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextQuaternary,
                                    }}
                                >
                                    • {workshopName}
                                </Text>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Error Time Tag & Active Chevron */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexShrink: 0,
                        marginLeft: 8,
                    }}
                >
                    {hasError ? (
                        <Tag
                            color="error"
                            style={{
                                margin: 0,
                                fontSize: 11.5,
                                padding: '1px 8px',
                                borderRadius: 8,
                                fontWeight: 600,
                            }}
                        >
                            {formatHours(machine.totalErrorHours)}
                        </Tag>
                    ) : (
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                color: token.colorTextQuaternary,
                                paddingRight: 4,
                            }}
                        >
                            0h
                        </Text>
                    )}
                    <RightOutlined
                        style={{
                            fontSize: 11,
                            color: isSelected ? token.colorPrimary : token.colorTextQuaternary,
                            transform: isSelected ? 'translateX(2px)' : 'none',
                            transition: 'all 0.18s ease',
                            opacity: isSelected ? 1 : 0.6,
                        }}
                    />
                </div>
            </div>
        );
    },
    (prev, next) => {
        return (
            prev.isSelected === next.isSelected &&
            prev.machine.machineId === next.machine.machineId &&
            prev.machine.totalErrorHours === next.machine.totalErrorHours &&
            prev.machine.machineName === next.machine.machineName &&
            prev.workshopName === next.workshopName &&
            prev.onSelect === next.onSelect
        );
    }
);

MachineCardItem.displayName = 'MachineCardItem';

// --- Main Sidebar Component ---
export interface MachineListSidebarProps {
    filteredSummaryData: MachineStatusSummaryItem[];
    selectedMachineId: string | null;
    onSelectMachine: (machine: MachineStatusSummaryItem) => void;
    searchText: string;
    onSearchTextChange: (text: string) => void;
    selectedWorkshopId: number | 'all' | null;
    onWorkshopChange: (wsId: number | 'all') => void;
    workshopOptions: { label: string; value: number | 'all' }[];
    sortByError: boolean;
    onToggleSort: () => void;
    machinesWithErrorCount: number;
    machineWorkshopMap: Map<string, { id: number; name: string }>;
    isMobile?: boolean;
}

export const MachineListSidebar: React.FC<MachineListSidebarProps> = React.memo(
    ({
        filteredSummaryData,
        selectedMachineId,
        onSelectMachine,
        searchText,
        onSearchTextChange,
        selectedWorkshopId,
        onWorkshopChange,
        workshopOptions,
        sortByError,
        onToggleSort,
        machinesWithErrorCount,
        machineWorkshopMap,
        isMobile,
    }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    height: '100%',
                    minHeight: 0,
                    overflow: 'hidden',
                }}
            >
                {/* Toolbar: Workshop filter + Search input */}
                <div
                    style={{
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 8 : 10,
                        width: '100%',
                        alignItems: isMobile ? 'stretch' : 'center',
                    }}
                >
                    <div
                        style={{
                            flex: isMobile ? undefined : 4,
                            width: isMobile ? '100%' : undefined,
                            minWidth: 0,
                        }}
                    >
                        <Select
                            placeholder={
                                t('factoryOverview.filter.chooseZone') || 'Chọn phân xưởng'
                            }
                            value={selectedWorkshopId}
                            onChange={onWorkshopChange}
                            options={workshopOptions}
                            allowClear={false}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div
                        style={{
                            flex: isMobile ? undefined : 6,
                            width: isMobile ? '100%' : undefined,
                            minWidth: 0,
                        }}
                    >
                        <SearchInput
                            value={searchText}
                            onChange={onSearchTextChange}
                            placeholder={
                                t('factoryOverview.filter.searchMachines') || 'Tìm kiếm máy...'
                            }
                            width="100%"
                            style={{ width: '100%', maxWidth: '100%' }}
                        />
                    </div>
                </div>

                {/* Machine Cards List Container */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: token.borderRadiusLG,
                        background: token.colorBgContainer,
                        overflow: 'hidden',
                        minHeight: 0,
                    }}
                >
                    {/* Header toolbar */}
                    <div
                        style={{
                            padding: '10px 14px',
                            background: token.colorFillAlter,
                            borderBottom: `1px solid ${token.colorBorderSecondary}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Text
                                strong
                                style={{
                                    fontSize: 13,
                                    color: token.colorTextHeading,
                                }}
                            >
                                {t('factoryOverview.machines') || 'Danh sách thiết bị'}
                            </Text>
                            <Tag
                                color={machinesWithErrorCount > 0 ? 'error' : 'default'}
                                bordered={false}
                                style={{
                                    borderRadius: 10,
                                    fontSize: 11,
                                    padding: '0 6px',
                                    fontWeight: 600,
                                }}
                            >
                                {machinesWithErrorCount > 0
                                    ? t('factoryOverview.modal.machinesWithError', {
                                          count: machinesWithErrorCount,
                                      }) || `${machinesWithErrorCount} máy có lỗi`
                                    : t('factoryOverview.modal.totalMachines', {
                                          count: filteredSummaryData.length,
                                      }) || `${filteredSummaryData.length} máy`}
                            </Tag>
                        </div>
                        <Tooltip
                            title={
                                sortByError
                                    ? t('factoryOverview.filter.highestError') ||
                                      'Ưu tiên lỗi nhiều nhất'
                                    : t('factoryOverview.filter.defaultOrder') || 'Thứ tự mặc định'
                            }
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={
                                    <SortDescendingOutlined
                                        style={{
                                            color: sortByError
                                                ? token.colorPrimary
                                                : token.colorTextSecondary,
                                            fontSize: 13,
                                        }}
                                    />
                                }
                                onClick={onToggleSort}
                                style={{
                                    fontSize: 11.5,
                                    color: sortByError
                                        ? token.colorPrimary
                                        : token.colorTextSecondary,
                                    padding: '0 6px',
                                    height: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {sortByError
                                    ? t('factoryOverview.filter.highestError') || 'Lỗi nhiều nhất'
                                    : t('factoryOverview.filter.defaultOrder') || 'Mặc định'}
                            </Button>
                        </Tooltip>
                    </div>

                    {/* List Body: Scrollable Machine Item Cards */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            minHeight: 0,
                        }}
                    >
                        {filteredSummaryData.length === 0 ? (
                            <div
                                style={{
                                    padding: '40px 16px',
                                    textAlign: 'center',
                                }}
                            >
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        t('common.noData') || 'Không tìm thấy thiết bị phù hợp'
                                    }
                                />
                            </div>
                        ) : (
                            filteredSummaryData.map((machine) => (
                                <MachineCardItem
                                    key={machine.machineId}
                                    machine={machine}
                                    isSelected={machine.machineId === selectedMachineId}
                                    workshopName={machineWorkshopMap.get(machine.machineId)?.name}
                                    onSelect={onSelectMachine}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

MachineListSidebar.displayName = 'MachineListSidebar';
