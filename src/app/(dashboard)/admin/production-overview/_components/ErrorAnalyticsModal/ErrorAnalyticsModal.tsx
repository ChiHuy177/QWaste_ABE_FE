'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, theme, Skeleton, Grid, Empty } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { SpaceService } from '@/services/SpaceService';
import { MachineStatusSummaryItem, MachineErrorDetailItem } from '@/types/Monitoring';
import { useAppSelector } from '@/stores/hook';
import { IFactoryOverviewStoreState } from '@/stores/FactoryOverviewStore';
import { collectAllMachines } from '@/utils/spaceStatsUtils';
import {
    MOCK_MACHINE_STATUS_SUMMARY,
    MOCK_WORKSHOPS,
    getMockMachineErrorDetails,
} from './mockErrorAnalyticsData';
import {
    MachineListSidebar,
    MachineHeroHeader,
    IncidentHistoryTable,
    ModalHeader,
} from './_components';

export interface ErrorAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    spaceId: number | null;
    filterId: number | null;
    startDate: string;
    endDate: string;
    isDateRange: boolean;
    restrictToMachineIds?: string[];
}

export const ErrorAnalyticsModal: React.FC<ErrorAnalyticsModalProps> = React.memo(
    ({
        isOpen,
        onClose,
        spaceId,
        filterId,
        startDate,
        endDate,
        isDateRange,
        restrictToMachineIds,
    }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();
        const screens = Grid.useBreakpoint();
        const isMobile = screens.md === false;
        const isXs = screens.xs === true;
        const isSingleMachineMode = Boolean(
            restrictToMachineIds && restrictToMachineIds.length > 0
        );

        const [loading, setLoading] = useState(false);
        const [summaryData, setSummaryData] = useState<MachineStatusSummaryItem[]>([]);
        const [selectedRow, setSelectedRow] = useState<MachineStatusSummaryItem | null>(null);
        const [searchText, setSearchText] = useState('');
        const [selectedWorkshopId, setSelectedWorkshopId] = useState<number | 'all' | null>('all');
        const [sortByError, setSortByError] = useState(true);

        const [errorDetails, setErrorDetails] = useState<MachineErrorDetailItem[]>([]);
        const [loadingErrorDetails, setLoadingErrorDetails] = useState(false);
        const [errorDateRange, setErrorDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(
            null
        );

        const reduxState = useAppSelector((state) => state.factoryOverview) as
            IFactoryOverviewStoreState | undefined;

        const spaceData = useMemo(() => {
            return reduxState?.spaceData || null;
        }, [reduxState]);

        const workshopOptions = useMemo(() => {
            const allLabel =
                t('factoryOverview.modal.allWorkshops') || t('common.all') || 'Tất cả phân xưởng';
            if (spaceData?.children && spaceData.children.length > 0) {
                return [
                    { label: allLabel, value: 'all' as const },
                    ...spaceData.children.map((child: any) => ({
                        label: child.spaceName,
                        value: child.spaceId,
                    })),
                ];
            }
            return [
                { label: allLabel, value: 'all' as const },
                ...MOCK_WORKSHOPS.map((ws) => ({
                    label: ws.spaceName,
                    value: ws.spaceId,
                })),
            ];
        }, [spaceData, t]);

        const machineWorkshopMap = useMemo(() => {
            const map = new Map<string, { id: number; name: string }>();
            if (spaceData?.children && spaceData.children.length > 0) {
                spaceData.children.forEach((workshop: any) => {
                    const machines = collectAllMachines(workshop);
                    machines.forEach((m) =>
                        map.set(m.machineId, { id: workshop.spaceId, name: workshop.spaceName })
                    );
                });
                return map;
            }
            MOCK_WORKSHOPS.forEach((ws) => {
                ws.machineIds.forEach((mId) =>
                    map.set(mId, { id: ws.spaceId, name: ws.spaceName })
                );
            });
            return map;
        }, [spaceData]);

        const filteredSummaryData = useMemo(() => {
            let result = summaryData;

            if (selectedWorkshopId !== null && selectedWorkshopId !== 'all') {
                result = result.filter(
                    (item) => machineWorkshopMap.get(item.machineId)?.id === selectedWorkshopId
                );
            }

            if (searchText.trim() !== '') {
                const lowerSearch = searchText.toLowerCase();
                result = result.filter(
                    (item) =>
                        item.machineName.toLowerCase().includes(lowerSearch) ||
                        item.machineId.toLowerCase().includes(lowerSearch)
                );
            }

            if (sortByError) {
                result = [...result].sort(
                    (a, b) => (b.totalErrorHours || 0) - (a.totalErrorHours || 0)
                );
            }

            return result;
        }, [summaryData, searchText, selectedWorkshopId, machineWorkshopMap, sortByError]);

        const machinesWithErrorCount = useMemo(() => {
            return filteredSummaryData.filter((m) => (m.totalErrorHours || 0) > 0).length;
        }, [filteredSummaryData]);

        const restrictKey = restrictToMachineIds?.join(',');

        // Fetch Machine Status Summary
        useEffect(() => {
            if (!isOpen) return;

            const fetchData = async () => {
                setLoading(true);
                try {
                    let summaryRes: any;

                    if (isDateRange) {
                        summaryRes = await (
                            SpaceService as any
                        ).getMachineStatusSummaryByDateRange?.(
                            startDate,
                            endDate,
                            spaceId ?? 1,
                            filterId ?? undefined
                        );
                    } else {
                        summaryRes = await (SpaceService as any).getMachineStatusSummaryByFilter?.(
                            filterId ?? 1,
                            spaceId ?? 1
                        );
                    }

                    let items: MachineStatusSummaryItem[] = Array.isArray(summaryRes?.data)
                        ? summaryRes.data
                        : Array.isArray(summaryRes)
                          ? summaryRes
                          : [];

                    if (items.length === 0) {
                        items = [...MOCK_MACHINE_STATUS_SUMMARY];
                    }

                    if (restrictToMachineIds && restrictToMachineIds.length > 0) {
                        items = items.filter(
                            (i) =>
                                restrictToMachineIds.includes(i.machineId) ||
                                restrictToMachineIds.includes(i.machineName)
                        );
                        if (items.length === 0) {
                            items = [
                                {
                                    machineId: restrictToMachineIds[0],
                                    machineName: `Thiết bị ${restrictToMachineIds[0]}`,
                                    totalRuntimeHours: 16.0,
                                    totalIdleHours: 2.5,
                                    totalErrorHours: 3.5,
                                    totalOfflineHours: 2.0,
                                },
                            ];
                        }
                    }

                    setSummaryData(items);
                } catch (error) {
                    console.warn(
                        'Backend machine status summary not available yet, using mock data:',
                        error
                    );
                    let mockItems = [...MOCK_MACHINE_STATUS_SUMMARY];
                    if (restrictToMachineIds && restrictToMachineIds.length > 0) {
                        mockItems = mockItems.filter(
                            (i) =>
                                restrictToMachineIds.includes(i.machineId) ||
                                restrictToMachineIds.includes(i.machineName)
                        );
                        if (mockItems.length === 0) {
                            mockItems = [
                                {
                                    machineId: restrictToMachineIds[0],
                                    machineName: `Thiết bị ${restrictToMachineIds[0]}`,
                                    totalRuntimeHours: 16.0,
                                    totalIdleHours: 2.5,
                                    totalErrorHours: 3.5,
                                    totalOfflineHours: 2.0,
                                },
                            ];
                        }
                    }
                    setSummaryData(mockItems);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [isOpen, spaceId, filterId, startDate, endDate, isDateRange, restrictKey]);

        // Auto-select first machine upon modal opening or filter changes
        useEffect(() => {
            if (!isOpen) {
                setSelectedRow(null);
                setSearchText('');
                setSelectedWorkshopId('all');
                return;
            }

            setSelectedRow((prev) => {
                if (filteredSummaryData.length === 0) return null;
                if (prev && filteredSummaryData.some((item) => item.machineId === prev.machineId)) {
                    return prev;
                }
                return filteredSummaryData[0];
            });
        }, [isOpen, filteredSummaryData]);

        // Stable machine selection handler that also resets inner date range
        const handleSelectMachine = useCallback((machine: MachineStatusSummaryItem) => {
            setSelectedRow(machine);
            setErrorDateRange(null);
        }, []);

        const handleToggleSort = useCallback(() => {
            setSortByError((prev) => !prev);
        }, []);

        const handleSearchTextChange = useCallback((text: string) => {
            setSearchText(text);
        }, []);

        const handleWorkshopChange = useCallback((wsId: number | 'all') => {
            setSelectedWorkshopId(wsId);
        }, []);

        // Fetch Error Details for selected machine
        useEffect(() => {
            if (!selectedRow) {
                setErrorDetails([]);
                return;
            }

            const fetchErrorDetails = async () => {
                setLoadingErrorDetails(true);
                try {
                    let res: any;
                    if (isDateRange) {
                        res = await (SpaceService as any).getErrorDetailByDateRange?.(
                            startDate,
                            endDate,
                            selectedRow.machineId,
                            filterId ?? undefined
                        );
                    } else if (filterId) {
                        res = await (SpaceService as any).getErrorDetailByFilter?.(
                            filterId,
                            selectedRow.machineId
                        );
                    }
                    const items = Array.isArray(res?.errors)
                        ? res.errors
                        : Array.isArray(res?.errors?.content)
                          ? res.errors.content
                          : [];
                    if (items.length > 0) {
                        setErrorDetails(items);
                    } else {
                        setErrorDetails(
                            getMockMachineErrorDetails(selectedRow.machineId, startDate, endDate)
                        );
                    }
                } catch (_error) {
                    setErrorDetails(
                        getMockMachineErrorDetails(selectedRow.machineId, startDate, endDate)
                    );
                } finally {
                    setLoadingErrorDetails(false);
                }
            };

            fetchErrorDetails();
        }, [selectedRow?.machineId, filterId, startDate, endDate, isDateRange]);

        // Reset errorDateRange when outer date bounds change
        useEffect(() => {
            setErrorDateRange(null);
        }, [isOpen, startDate, endDate]);

        // Lock inner date picker strictly within outer startDate and endDate
        const disabledDate = useCallback(
            (current: Dayjs) => {
                if (!current) return false;
                if (startDate && current.isBefore(dayjs(startDate).startOf('day'))) {
                    return true;
                }
                if (endDate && current.isAfter(dayjs(endDate).endOf('day'))) {
                    return true;
                }
                return false;
            },
            [startDate, endDate]
        );

        // Filter error history client-side by chosen date range within the outer period
        const filteredErrorDetails = useMemo(() => {
            if (!errorDateRange || !errorDateRange[0] || !errorDateRange[1]) {
                return errorDetails;
            }
            const sTime = errorDateRange[0].startOf('day').valueOf();
            const eTime = errorDateRange[1].endOf('day').valueOf();
            return errorDetails.filter((err) => {
                const errTime = new Date(err.startTime || 0).getTime();
                return errTime >= sTime && errTime <= eTime;
            });
        }, [errorDetails, errorDateRange]);

        const selectedWorkshopName = useMemo(() => {
            if (!selectedRow) return '';
            const ws = machineWorkshopMap.get(selectedRow.machineId);
            return ws?.name || t('factoryOverview.filter.zones') || 'Khu vực máy';
        }, [selectedRow?.machineId, machineWorkshopMap, t]);

        return (
            <Modal
                title={
                    <ModalHeader
                        isSingleMachineMode={isSingleMachineMode}
                        machineName={selectedRow?.machineName}
                        machineId={selectedRow?.machineId}
                        totalErrorHours={selectedRow?.totalErrorHours}
                        spaceName={spaceData?.spaceName}
                        workshopName={selectedWorkshopName}
                        isDateRange={isDateRange}
                        startDate={startDate}
                        endDate={endDate}
                        totalMachinesCount={filteredSummaryData.length}
                    />
                }
                open={isOpen}
                onCancel={onClose}
                footer={null}
                width={isSingleMachineMode ? (isMobile ? '95%' : 1080) : '95%'}
                centered
                style={{
                    maxWidth: isSingleMachineMode ? 1080 : 1440,
                    top: 20,
                    paddingBottom: 0,
                }}
                styles={{
                    body: {
                        height: isMobile ? 'auto' : 'calc(88vh - 90px)',
                        minHeight: isMobile ? 'auto' : 640,
                        overflow: isMobile ? 'auto' : 'hidden',
                        padding: isMobile ? '12px' : '10px 20px 16px',
                    },
                }}
                destroyOnClose
            >
                {loading ? (
                    <div
                        style={{
                            height: isMobile ? 'auto' : '100%',
                            display: isMobile ? 'flex' : 'grid',
                            flexDirection: isMobile ? 'column' : 'row',
                            gridTemplateColumns: isMobile ? undefined : '40% 60%',
                            gap: 20,
                            paddingTop: 16,
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <Skeleton.Input active block size="large" style={{ height: 38 }} />
                            <Skeleton active paragraph={{ rows: 12 }} />
                        </div>
                        <div
                            style={{
                                paddingLeft: isMobile ? 0 : 20,
                                borderLeft: isMobile
                                    ? 'none'
                                    : `1px solid ${token.colorBorderSecondary}`,
                                borderTop: isMobile
                                    ? `1px solid ${token.colorBorderSecondary}`
                                    : 'none',
                                paddingTop: isMobile ? 20 : 0,
                            }}
                        >
                            <Skeleton active paragraph={{ rows: 14 }} />
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: isMobile || isSingleMachineMode ? 'flex' : 'grid',
                            flexDirection: isMobile ? 'column' : 'row',
                            gridTemplateColumns:
                                isMobile || isSingleMachineMode ? undefined : '36% 64%',
                            gap: isSingleMachineMode ? 0 : 20,
                            height: isMobile ? 'auto' : '100%',
                            paddingTop: 4,
                            width: '100%',
                        }}
                    >
                        {/* LEFT PANE: Machine Directory Table (Plant-wide mode only) */}
                        {!isSingleMachineMode && (
                            <MachineListSidebar
                                filteredSummaryData={filteredSummaryData}
                                selectedMachineId={selectedRow?.machineId || null}
                                onSelectMachine={handleSelectMachine}
                                searchText={searchText}
                                onSearchTextChange={handleSearchTextChange}
                                selectedWorkshopId={selectedWorkshopId}
                                onWorkshopChange={handleWorkshopChange}
                                workshopOptions={workshopOptions}
                                sortByError={sortByError}
                                onToggleSort={handleToggleSort}
                                machinesWithErrorCount={machinesWithErrorCount}
                                machineWorkshopMap={machineWorkshopMap}
                            />
                        )}

                        {/* RIGHT PANE: Selected Machine Details & Incident Table */}
                        <div
                            style={{
                                borderLeft:
                                    isMobile || isSingleMachineMode
                                        ? 'none'
                                        : `1px solid ${token.colorBorderSecondary}`,
                                borderTop:
                                    isMobile && !isSingleMachineMode
                                        ? `1px solid ${token.colorBorderSecondary}`
                                        : 'none',
                                paddingLeft: isMobile || isSingleMachineMode ? 0 : 20,
                                paddingTop: isMobile && !isSingleMachineMode ? 16 : 0,
                                display: 'flex',
                                flexDirection: 'column',
                                height: isMobile ? 'auto' : '100%',
                                minHeight: 0,
                                overflow: isMobile ? 'visible' : 'hidden',
                                gap: 12,
                                width: isSingleMachineMode ? '100%' : undefined,
                                flex: isSingleMachineMode ? 1 : undefined,
                            }}
                        >
                            {selectedRow ? (
                                <>
                                    {/* 1. Hero Header Card */}
                                    <MachineHeroHeader
                                        selectedRow={selectedRow}
                                        workshopName={selectedWorkshopName}
                                        isXs={isXs}
                                    />

                                    {/* 2. Incident & Error History Section */}
                                    <IncidentHistoryTable
                                        filteredErrorDetails={filteredErrorDetails}
                                        loading={loadingErrorDetails}
                                        errorDateRange={errorDateRange}
                                        onErrorDateRangeChange={setErrorDateRange}
                                        disabledDate={disabledDate}
                                        startDate={startDate}
                                        endDate={endDate}
                                        isMobile={isMobile}
                                    />
                                </>
                            ) : (
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                    }}
                                >
                                    <Empty
                                        description={
                                            t('factoryOverview.modal.selectMachinePrompt') ||
                                            t('common.noData') ||
                                            'Vui lòng chọn thiết bị để xem chi tiết'
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        );
    }
);

ErrorAnalyticsModal.displayName = 'ErrorAnalyticsModal';

export default ErrorAnalyticsModal;
