'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, theme, Skeleton, Grid, Empty, Button, Tag, Segmented, ConfigProvider } from 'antd';
import { ArrowLeftOutlined, UnorderedListOutlined, FileTextOutlined } from '@ant-design/icons';
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
        const [mobileActiveView, setMobileActiveView] = useState<'list' | 'detail'>('list');

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
                setMobileActiveView('list');
                return;
            }

            if (isSingleMachineMode) {
                setMobileActiveView('detail');
            }

            setSelectedRow((prev) => {
                if (filteredSummaryData.length === 0) return null;
                if (prev && filteredSummaryData.some((item) => item.machineId === prev.machineId)) {
                    return prev;
                }
                return filteredSummaryData[0];
            });
        }, [isOpen, filteredSummaryData, isSingleMachineMode]);

        // Stable machine selection handler that also resets inner date range and switches view on mobile
        const handleSelectMachine = useCallback(
            (machine: MachineStatusSummaryItem) => {
                setSelectedRow(machine);
                setErrorDateRange(null);
                if (isMobile) {
                    setMobileActiveView('detail');
                }
            },
            [isMobile]
        );

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
                        isMobile={isMobile}
                    />
                }
                open={isOpen}
                onCancel={onClose}
                footer={null}
                width={isSingleMachineMode ? (isMobile ? '95%' : 1080) : '95%'}
                centered
                style={{
                    maxWidth: isSingleMachineMode ? 1080 : 1440,
                    top: isMobile ? 12 : 20,
                    paddingBottom: 0,
                }}
                styles={{
                    body: {
                        height: isMobile ? 'calc(90vh - 70px)' : 'calc(88vh - 90px)',
                        minHeight: isMobile ? 480 : 640,
                        overflow: 'hidden',
                        padding: isMobile ? '10px 12px 14px' : '10px 20px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
                destroyOnClose
            >
                {loading ? (
                    <div
                        style={{
                            height: '100%',
                            display: isMobile ? 'flex' : 'grid',
                            flexDirection: isMobile ? 'column' : 'row',
                            gridTemplateColumns: isMobile ? undefined : '40% 60%',
                            gap: 20,
                            paddingTop: 16,
                            flex: 1,
                            minHeight: 0,
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
                ) : isMobile ? (
                    /* MOBILE MASTER-DETAIL LAYOUT */
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            minHeight: 0,
                            flex: 1,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Mobile Segmented Switcher with prominent active highlight (only in Plant-wide mode with multiple machines) */}
                        {!isSingleMachineMode && (
                            <ConfigProvider
                                theme={{
                                    components: {
                                        Segmented: {
                                            itemSelectedBg: token.colorPrimary,
                                            itemSelectedColor: token.colorWhite,
                                            itemHoverColor: token.colorPrimary,
                                            itemActiveBg: token.colorPrimaryActive,
                                            trackBg: token.colorFillAlter,
                                            trackPadding: 3,
                                        },
                                    },
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: 10,
                                        flexShrink: 0,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: token.borderRadiusLG,
                                        padding: 2,
                                        backgroundColor: token.colorFillAlter,
                                    }}
                                >
                                    <Segmented
                                        block
                                        size="middle"
                                        value={mobileActiveView}
                                        onChange={(v) =>
                                            setMobileActiveView(v as 'list' | 'detail')
                                        }
                                        options={[
                                            {
                                                value: 'list',
                                                icon: (
                                                    <UnorderedListOutlined
                                                        style={{
                                                            fontSize: 13,
                                                            color:
                                                                mobileActiveView === 'list'
                                                                    ? token.colorWhite
                                                                    : token.colorTextSecondary,
                                                        }}
                                                    />
                                                ),
                                                label: (
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            fontWeight:
                                                                mobileActiveView === 'list'
                                                                    ? 600
                                                                    : 500,
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        <span>
                                                            {t(
                                                                'factoryOverview.modal.machineListTabTitle'
                                                            ) || 'Danh sách máy'}
                                                        </span>
                                                        <span
                                                            style={{
                                                                backgroundColor:
                                                                    mobileActiveView === 'list'
                                                                        ? 'rgba(255, 255, 255, 0.25)'
                                                                        : token.colorFillSecondary,
                                                                color:
                                                                    mobileActiveView === 'list'
                                                                        ? token.colorWhite
                                                                        : token.colorTextSecondary,
                                                                padding: '0 6px',
                                                                borderRadius: 10,
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                                lineHeight: '16px',
                                                                display: 'inline-block',
                                                            }}
                                                        >
                                                            {filteredSummaryData.length}
                                                        </span>
                                                    </span>
                                                ),
                                            },
                                            {
                                                value: 'detail',
                                                disabled: !selectedRow,
                                                icon: (
                                                    <FileTextOutlined
                                                        style={{
                                                            fontSize: 13,
                                                            color:
                                                                mobileActiveView === 'detail'
                                                                    ? token.colorWhite
                                                                    : !selectedRow
                                                                      ? token.colorTextDisabled
                                                                      : token.colorTextSecondary,
                                                        }}
                                                    />
                                                ),
                                                label: (
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            fontWeight:
                                                                mobileActiveView === 'detail'
                                                                    ? 600
                                                                    : 500,
                                                            fontSize: 13,
                                                            opacity: selectedRow ? 1 : 0.5,
                                                        }}
                                                    >
                                                        {t(
                                                            'factoryOverview.modal.incidentDetailTabTitle'
                                                        ) || 'Chi tiết sự cố'}
                                                    </span>
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            </ConfigProvider>
                        )}

                        {/* Mobile View: List or Detail */}
                        {!isSingleMachineMode && mobileActiveView === 'list' ? (
                            <div
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    height: '100%',
                                    overflow: 'hidden',
                                }}
                            >
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
                                    isMobile={isMobile}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    overflow: 'hidden',
                                }}
                            >
                                {!isSingleMachineMode && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingBottom: 2,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ArrowLeftOutlined />}
                                            onClick={() => setMobileActiveView('list')}
                                            style={{
                                                fontWeight: 500,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                color: token.colorPrimary,
                                                borderRadius: token.borderRadiusSM,
                                                backgroundColor: token.colorPrimaryBg,
                                                padding: '4px 10px',
                                                height: 28,
                                            }}
                                        >
                                            {t('factoryOverview.modal.backToList') ||
                                                'Quay lại danh sách máy'}
                                        </Button>
                                        <Tag
                                            color="blue"
                                            bordered={false}
                                            style={{
                                                margin: 0,
                                                borderRadius: 10,
                                                fontSize: 11,
                                            }}
                                        >
                                            {filteredSummaryData.findIndex(
                                                (m) => m.machineId === selectedRow?.machineId
                                            ) + 1}{' '}
                                            / {filteredSummaryData.length}
                                        </Tag>
                                    </div>
                                )}

                                {selectedRow ? (
                                    <>
                                        <MachineHeroHeader
                                            selectedRow={selectedRow}
                                            workshopName={selectedWorkshopName}
                                            isXs={isXs}
                                            isMobile={isMobile}
                                        />
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
                        )}
                    </div>
                ) : (
                    /* DESKTOP SPLIT LAYOUT */
                    <div
                        style={{
                            display: isSingleMachineMode ? 'flex' : 'grid',
                            gridTemplateColumns: isSingleMachineMode ? undefined : '36% 64%',
                            gap: isSingleMachineMode ? 0 : 20,
                            height: '100%',
                            paddingTop: 4,
                            width: '100%',
                            flex: 1,
                            minHeight: 0,
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
                                isMobile={isMobile}
                            />
                        )}

                        {/* RIGHT PANE: Selected Machine Details & Incident Table */}
                        <div
                            style={{
                                borderLeft: isSingleMachineMode
                                    ? 'none'
                                    : `1px solid ${token.colorBorderSecondary}`,
                                paddingLeft: isSingleMachineMode ? 0 : 20,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                minHeight: 0,
                                overflow: 'hidden',
                                gap: 12,
                                width: isSingleMachineMode ? '100%' : undefined,
                                flex: isSingleMachineMode ? 1 : undefined,
                            }}
                        >
                            {selectedRow ? (
                                <>
                                    <MachineHeroHeader
                                        selectedRow={selectedRow}
                                        workshopName={selectedWorkshopName}
                                        isXs={isXs}
                                        isMobile={isMobile}
                                    />
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
