'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { DragDropManager, Feedback, type DragEndEvent, type DragOverEvent } from '@dnd-kit/dom';
import type { Plugins } from '@dnd-kit/abstract';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { useDroppable } from '@dnd-kit/react';
import { CollisionPriority } from '@dnd-kit/abstract';
import { Button, Dropdown, Empty, Flex, Typography, theme } from 'antd';
import {
    CheckCircleFilled,
    EditOutlined,
    EllipsisOutlined,
    ExclamationCircleFilled,
    SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { IncidentReport, IncidentStatus } from '@/types/IncidentReport';
import { STATUS_BAR_COLOR } from './Columns';

const { Text } = Typography;

// ── Constants ─────────────────────────────────────────────────────────────────

const KANBAN_STATUSES: IncidentStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const MAX_VISIBLE = 3;

const PRIORITY_CONFIG: Record<IncidentStatus, { labelKey: string; color: string; bg: string }> = {
    ALL: { labelKey: 'maintenance.kanban.priority.normal', color: '#6b7280', bg: '#f3f4f6' },
    OPEN: { labelKey: 'maintenance.kanban.priority.critical', color: '#dc2626', bg: '#fff1f2' },
    IN_PROGRESS: { labelKey: 'maintenance.kanban.priority.high', color: '#d97706', bg: '#fffbeb' },
    RESOLVED: { labelKey: 'maintenance.kanban.priority.low', color: '#16a34a', bg: '#f0fdf4' },
};

// Status icon per column
function StatusIcon({ status, barColor }: { status: IncidentStatus; barColor: string }) {
    switch (status) {
        case 'OPEN':
            return <ExclamationCircleFilled style={{ color: barColor, fontSize: 15 }} />;
        case 'IN_PROGRESS':
            return <SyncOutlined style={{ color: barColor, fontSize: 14 }} spin />;
        case 'RESOLVED':
            return <CheckCircleFilled style={{ color: '#16a34a', fontSize: 15 }} />;
        default:
            return <CheckCircleFilled style={{ color: '#9ca3af', fontSize: 15 }} />;
    }
}

// ── Board helpers ─────────────────────────────────────────────────────────────

type BoardState = Record<IncidentStatus, IncidentReport[]>;

function buildBoard(incidents: IncidentReport[]): BoardState {
    return KANBAN_STATUSES.reduce((b, s) => {
        b[s] = incidents.filter((r) => r.status === s);
        return b;
    }, {} as BoardState);
}
function cloneBoard(src: BoardState): BoardState {
    return KANBAN_STATUSES.reduce((b, s) => {
        b[s] = [...src[s]];
        return b;
    }, {} as BoardState);
}
function normalizeBoard(src: BoardState): BoardState {
    return KANBAN_STATUSES.reduce((n, s) => {
        n[s] = src[s].map((r) => (r.status === s ? r : { ...r, status: s }));
        return n;
    }, {} as BoardState);
}

// ── Shared card style helper ──────────────────────────────────────────────────

function cardStyle(
    barColor: string,
    isSelected: boolean,
    isDragging: boolean,
    isDropping: boolean,
    overlay: boolean,
    token: ReturnType<typeof theme.useToken>['token']
): React.CSSProperties {
    // Use only longhand border properties to avoid shorthand/longhand override conflict
    const sideBorder = isSelected
        ? `1.5px solid ${token.colorPrimary}`
        : isDragging
          ? `1.5px dashed ${barColor}`
          : `1px solid ${token.colorBorderSecondary}`;

    return {
        background: isSelected ? token.colorPrimaryBg : token.colorBgContainer,
        borderRadius: 10,
        borderTop: sideBorder,
        borderRight: sideBorder,
        borderBottom: sideBorder,
        borderLeft: `3.5px solid ${barColor}`,
        boxShadow: isSelected
            ? `0 0 0 2px ${token.colorPrimaryBorder}`
            : isDragging || overlay
              ? token.boxShadowSecondary
              : token.boxShadowTertiary,
        opacity: isDragging ? 0.4 : 1,
        cursor: overlay ? 'grabbing' : 'pointer',
        padding: '12px 14px',
        transform: isDropping || overlay ? 'scale(1.02)' : undefined,
        transition: 'all 0.2s ease',
        userSelect: 'none',
    };
}

// ── Action menu (shared) ──────────────────────────────────────────────────────

function ActionMenu({
    report,
    onEdit,
}: {
    report: IncidentReport;
    onEdit: (r: IncidentReport) => void;
}) {
    const { t } = useTranslation();
    return (
        <Dropdown
            menu={{
                items: [
                    {
                        key: 'edit',
                        label: t('maintenance.detail.edit'),
                        icon: <EditOutlined />,
                        onClick: () => onEdit(report),
                    },
                ],
            }}
            trigger={['click']}
        >
            <Button
                type="text"
                size="small"
                icon={<EllipsisOutlined />}
                style={{ color: 'inherit', width: 20, height: 20, minWidth: 20 }}
                onClick={(e) => e.stopPropagation()}
            />
        </Dropdown>
    );
}

// ── Unified Card (all statuses) ───────────────────────────────────────────────

interface CardProps {
    report: IncidentReport;
    /** The column this card visually belongs to — used for colors/icon, avoids stale report.status after drag */
    columnStatus: IncidentStatus;
    cardRef?: (el: Element | null) => void;
    isDragging?: boolean;
    isDropping?: boolean;
    overlay?: boolean;
    isSelected?: boolean;
    onView?: (r: IncidentReport) => void;
    onEdit: (r: IncidentReport) => void;
}

function KanbanCard({
    report,
    columnStatus,
    cardRef,
    isDragging = false,
    isDropping = false,
    overlay = false,
    isSelected = false,
    onView,
    onEdit,
}: CardProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    // Always derive visual styling from the column the card is IN, not report.status
    const barColor = STATUS_BAR_COLOR[columnStatus];
    const priority = PRIORITY_CONFIG[columnStatus];

    const dateLabel =
        columnStatus === 'RESOLVED' && report.resolvedAt
            ? t('maintenance.kanban.card.resolvedAt', {
                  date: dayjs(report.resolvedAt).format('DD/MM/YYYY HH:mm'),
              })
            : t('maintenance.kanban.card.reportedAt', {
                  date: dayjs(report.reportedAt).format('DD/MM/YYYY HH:mm'),
              });

    return (
        <div
            ref={cardRef}
            onClick={() => onView?.(report)}
            style={cardStyle(barColor, isSelected, isDragging, isDropping, overlay, token)}
        >
            {/* Row 1: report number + badge | status icon + menu */}
            <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                <Flex align="center" gap={6}>
                    <Text
                        style={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: barColor,
                        }}
                    >
                        {report.reportNumber}
                    </Text>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: priority.bg,
                            color: priority.color,
                            border: `1px solid ${priority.color}44`,
                        }}
                    >
                        {t(priority.labelKey)}
                    </span>
                </Flex>
                <Flex align="center" gap={4} onClick={(e) => e.stopPropagation()}>
                    <StatusIcon status={columnStatus} barColor={barColor} />
                    {!overlay && <ActionMenu report={report} onEdit={onEdit} />}
                </Flex>
            </Flex>

            {/* Row 2: Machine · Error */}
            <Text style={{ fontSize: 12, display: 'block', marginBottom: 3, lineHeight: 1.4 }}>
                <Text strong style={{ fontSize: 12 }}>
                    {report.machine?.machineName ?? report.mold?.moldName ?? '-'}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {' · '}
                    {report.errorDetail.errorName}
                </Text>
            </Text>

            {/* Row 3: Date */}
            <Text type="secondary" style={{ fontSize: 11 }}>
                {dateLabel}
            </Text>
        </div>
    );
}

// ── Sortable wrapper ──────────────────────────────────────────────────────────

function SortableCard({
    report,
    index,
    columnStatus,
    isSelected,
    onView,
    onEdit,
}: {
    report: IncidentReport;
    index: number;
    columnStatus: IncidentStatus;
    isSelected: boolean;
    onView?: (r: IncidentReport) => void;
    onEdit: (r: IncidentReport) => void;
}) {
    const { ref, isDragging, isDropping } = useSortable({
        id: String(report.reportId),
        index,
        type: 'item',
        accept: 'item',
        group: columnStatus,
        data: { report },
        transition: { duration: 180, easing: 'ease-out', idle: true },
    });

    return (
        <KanbanCard
            report={report}
            columnStatus={columnStatus}
            cardRef={ref}
            isDragging={isDragging}
            isDropping={isDropping}
            isSelected={isSelected}
            onView={onView}
            onEdit={onEdit}
        />
    );
}

export function OverviewCardOverlay({ report }: { report: IncidentReport }) {
    const noop = () => {};
    return (
        <div style={{ width: 240 }}>
            <KanbanCard report={report} columnStatus={report.status} overlay onEdit={noop} />
        </div>
    );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({
    status,
    reports,
    selectedReportId,
    onView,
    onEdit,
}: {
    status: IncidentStatus;
    reports: IncidentReport[];
    selectedReportId?: number;
    onAddClick?: () => void;
    onView?: (r: IncidentReport) => void;
    onEdit: (r: IncidentReport) => void;
}) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const barColor = STATUS_BAR_COLOR[status];
    const [showAll, setShowAll] = useState(false);

    const statusLabel = t(
        `maintenance.status.${status === 'IN_PROGRESS' ? 'inProgress' : status.toLowerCase()}`
    );

    const { ref, isDropTarget } = useDroppable({
        id: status,
        type: 'column',
        accept: 'item',
        collisionPriority: CollisionPriority.Low,
        data: { status },
    });

    const visible = !showAll ? reports.slice(0, MAX_VISIBLE) : reports;
    const hiddenCount = reports.length - MAX_VISIBLE;

    return (
        <section
            ref={ref}
            style={{
                minWidth: 240,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: isDropTarget ? `${barColor}12` : token.colorBgLayout,
                border: `1px solid ${isDropTarget ? barColor + '66' : token.colorBorderSecondary}`,
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: isDropTarget ? `0 0 0 2px ${barColor}44` : token.boxShadowTertiary,
                transition: 'all 0.25s ease',
            }}
        >
            {/* Column header */}
            <div
                style={{
                    padding: '10px 14px',
                    borderTop: `3px solid ${barColor}`,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: `${barColor}0a`,
                }}
            >
                <Flex justify="space-between" align="center">
                    <Flex align="center" gap={8}>
                        <Text strong style={{ fontSize: 14, color: barColor }}>
                            {statusLabel}
                        </Text>
                        <div
                            style={{
                                minWidth: 22,
                                height: 22,
                                borderRadius: 6,
                                padding: '0 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: barColor,
                                background: token.colorBgContainer,
                                border: `1px solid ${barColor}44`,
                                fontWeight: 700,
                                fontSize: 12,
                            }}
                        >
                            {reports.length}
                        </div>
                    </Flex>
                </Flex>
            </div>

            {/* Cards */}
            <div
                style={{
                    flex: 1,
                    padding: '10px 10px 4px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    minHeight: 100,
                }}
            >
                {reports.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            minHeight: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px dashed ${token.colorBorder}`,
                            borderRadius: 8,
                            background: token.colorBgContainer,
                        }}
                    >
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('maintenance.kanban.column.noReports')}
                                </Text>
                            }
                        />
                    </div>
                ) : (
                    <>
                        {visible.map((r, i) => (
                            <SortableCard
                                key={r.reportId}
                                report={r}
                                index={i}
                                columnStatus={status}
                                isSelected={selectedReportId === r.reportId}
                                onView={onView}
                                onEdit={onEdit}
                            />
                        ))}
                        {!showAll && hiddenCount > 0 && (
                            <Button
                                type="link"
                                size="small"
                                style={{ fontSize: 12, padding: '4px 0', height: 'auto' }}
                                onClick={() => setShowAll(true)}
                            >
                                {t('maintenance.kanban.column.showMore', { count: hiddenCount })}
                            </Button>
                        )}
                        {showAll && hiddenCount > 0 && (
                            <Button
                                type="link"
                                size="small"
                                style={{ fontSize: 12, padding: '4px 0', height: 'auto' }}
                                onClick={() => setShowAll(false)}
                            >
                                {t('maintenance.kanban.column.showLess')}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export interface OverviewKanbanProps {
    incidents: IncidentReport[];
    selectedReportId?: number;
    onView: (r: IncidentReport) => void;
    onEdit: (r: IncidentReport) => void;
    onStatusChange: (report: IncidentReport, newStatus: IncidentStatus) => Promise<void>;
    onAddClick?: () => void;
}

export function OverviewKanban({
    incidents,
    selectedReportId,
    onView,
    onEdit,
    onStatusChange,
    onAddClick,
}: OverviewKanbanProps) {
    const [board, setBoard] = useState<BoardState>(() => buildBoard(incidents));
    const snapRef = useRef<BoardState>(buildBoard(incidents));

    useEffect(() => {
        setBoard(buildBoard(incidents));
    }, [incidents]);

    const { manager, destroy } = useMemo(() => {
        const mgr = new DragDropManager();
        const fn = mgr.destroy.bind(mgr);
        mgr.destroy = () => undefined;
        return { manager: mgr, destroy: fn };
    }, []);

    const dRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (dRef.current) clearTimeout(dRef.current);
        return () => {
            dRef.current = setTimeout(destroy, 0);
        };
    }, [destroy]);

    const plugins = useMemo(
        () =>
            (d: Plugins): Plugins =>
                d.map((p) => {
                    const c = typeof p === 'function' ? p : p.plugin;
                    if (c === Feedback)
                        return Feedback.configure({ feedback: 'move', dropAnimation: null });
                    return p;
                }),
        []
    );

    const handleDragOver = useCallback((e: DragOverEvent) => {
        setBoard((b) => {
            const m = move(b as any, e) as BoardState;
            return m === b ? b : normalizeBoard(m);
        });
    }, []);

    const handleDragEnd = useCallback(
        async (e: DragEndEvent) => {
            if (e.canceled) {
                setBoard(cloneBoard(snapRef.current));
                return;
            }
            setBoard((b) => {
                const m = move(b as any, e) as BoardState;
                return m === b ? b : normalizeBoard(m);
            });
            const src: IncidentReport | undefined = e.operation.source?.data?.report;
            const tgt: IncidentStatus | undefined =
                e.operation.target?.data?.status ?? e.operation.target?.data?.report?.status;
            if (!src || !tgt || src.status === tgt) return;
            try {
                await onStatusChange(src, tgt);
            } catch {
                setBoard(cloneBoard(snapRef.current));
            }
        },
        [onStatusChange]
    );

    return (
        <DragDropProvider
            manager={manager}
            plugins={plugins}
            onDragStart={() => {
                snapRef.current = cloneBoard(board);
            }}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))',
                    gap: 12,
                    width: 'max-content',
                    minWidth: '100%',
                }}
            >
                {KANBAN_STATUSES.map((s) => (
                    <KanbanColumn
                        key={s}
                        status={s}
                        reports={board[s]}
                        selectedReportId={selectedReportId}
                        onAddClick={s === 'OPEN' || s === 'IN_PROGRESS' ? onAddClick : undefined}
                        onView={onView}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </DragDropProvider>
    );
}
