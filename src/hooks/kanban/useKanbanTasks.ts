'use client';

import { useCallback, useMemo, useState } from 'react';
import { move } from '@dnd-kit/helpers';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/react';
import { useTranslation } from 'react-i18next';

export type OperatorTaskStatus = 'todo' | 'in_progress' | 'qc_check' | 'complete';
export type OperatorTaskPriority = 'low' | 'medium' | 'high';

export interface OperatorTask {
    id: string;
    code: string;
    title: string;
    status: OperatorTaskStatus;
    priority: OperatorTaskPriority;
    orderCode: string;
    customerName: string;
    machineName: string;
    drawingCode: string;
    location: string;
    dueDate: string;
    estimate: string;
    description: string;
    notes?: string;
}

export interface KanbanColumn {
    id: OperatorTaskStatus;
    title: string;
    description: string;
}

export type KanbanBoardState = Record<OperatorTaskStatus, OperatorTask[]>;
type KanbanMoveEvent = DragOverEvent | DragEndEvent;

export const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: 'todo',
        title: 'To do',
        description: 'Assigned tasks waiting to start',
    },
    {
        id: 'in_progress',
        title: 'In progress',
        description: 'Tasks currently being handled',
    },
    {
        id: 'qc_check',
        title: 'QC check',
        description: 'Tasks ready for quality check',
    },
    {
        id: 'complete',
        title: 'Complete',
        description: 'Finished tasks',
    },
];

const initialTasks: OperatorTask[] = [
    {
        id: 'task-op-001',
        code: 'TASK-001',
        title: 'Machine surface milling',
        status: 'todo',
        priority: 'high',
        orderCode: 'ORD-2026-1042',
        customerName: 'IIC Components',
        machineName: 'CNC Machine 02',
        drawingCode: 'DWG-2026-118',
        location: 'Line A / Zone 2',
        dueDate: '2026-05-28',
        estimate: '2h 30m',
        description: 'Prepare tooling and complete the first-pass surface milling operation.',
        notes: 'Check fixture alignment before running the cycle.',
    },
    {
        id: 'task-op-002',
        code: 'TASK-002',
        title: 'Drill threaded mounting holes',
        status: 'todo',
        priority: 'medium',
        orderCode: 'ORD-2026-1045',
        customerName: 'Eastern Precision',
        machineName: 'Drilling Machine 02',
        drawingCode: 'DWG-2026-124',
        location: 'Line B / Zone 1',
        dueDate: '2026-05-29',
        estimate: '1h 15m',
        description:
            'Drill and tap the threaded mounting holes according to the drawing tolerance.',
    },
    {
        id: 'task-op-003',
        code: 'TASK-003',
        title: 'CNC 3-axis pocket operation',
        status: 'in_progress',
        priority: 'high',
        orderCode: 'ORD-2026-1039',
        customerName: 'Delta Manufacturing',
        machineName: 'CNC Machine 03',
        drawingCode: 'DWG-2026-097',
        location: 'Line A / Zone 3',
        dueDate: '2026-05-27',
        estimate: '3h',
        description: 'Run the pocketing program and record actual runtime after completion.',
    },
    {
        id: 'task-op-004',
        code: 'TASK-004',
        title: 'Deburr machined bracket',
        status: 'in_progress',
        priority: 'low',
        orderCode: 'ORD-2026-1040',
        customerName: 'IIC Components',
        machineName: 'Finishing Station 01',
        drawingCode: 'DWG-2026-105',
        location: 'Finishing Area',
        dueDate: '2026-05-30',
        estimate: '45m',
        description: 'Deburr all exposed edges and prepare the bracket for QC inspection.',
    },
    {
        id: 'task-op-005',
        code: 'TASK-005',
        title: 'Dimensional inspection',
        status: 'qc_check',
        priority: 'medium',
        orderCode: 'ORD-2026-1034',
        customerName: 'Bright Tooling',
        machineName: 'CMM Machine 01',
        drawingCode: 'DWG-2026-088',
        location: 'QC Room',
        dueDate: '2026-05-27',
        estimate: '1h',
        description: 'Submit the finished part for dimensional checks and attach measured values.',
    },
    {
        id: 'task-op-006',
        code: 'TASK-006',
        title: 'Laser cut cover plate',
        status: 'qc_check',
        priority: 'high',
        orderCode: 'ORD-2026-1037',
        customerName: 'Metro Automation',
        machineName: 'Laser Cutting 01',
        drawingCode: 'DWG-2026-091',
        location: 'Cutting Area',
        dueDate: '2026-05-28',
        estimate: '2h',
        description: 'Verify cut quality and send the cover plate to QC check.',
    },
    {
        id: 'task-op-007',
        code: 'TASK-007',
        title: 'Completed shaft turning',
        status: 'complete',
        priority: 'medium',
        orderCode: 'ORD-2026-1028',
        customerName: 'North Star Parts',
        machineName: 'CNC Lathe 01',
        drawingCode: 'DWG-2026-073',
        location: 'Line C / Zone 1',
        dueDate: '2026-05-26',
        estimate: '4h',
        description: 'Shaft turning operation completed and submitted to the next workflow step.',
    },
    {
        id: 'task-op-008',
        code: 'TASK-008',
        title: 'Heat treatment batch',
        status: 'todo',
        priority: 'low',
        orderCode: 'ORD-2026-1048',
        customerName: 'Eastern Precision',
        machineName: 'Heat Treatment 01',
        drawingCode: 'DWG-2026-132',
        location: 'Heat Treatment',
        dueDate: '2026-06-01',
        estimate: '5h',
        description: 'Prepare the batch and confirm furnace slot availability.',
    },
];

const createInitialBoard = (): KanbanBoardState =>
    KANBAN_COLUMNS.reduce((board, column) => {
        board[column.id] = initialTasks.filter((task) => task.status === column.id);
        return board;
    }, {} as KanbanBoardState);

const getEmptyBoard = (): KanbanBoardState =>
    KANBAN_COLUMNS.reduce((board, column) => {
        board[column.id] = [];
        return board;
    }, {} as KanbanBoardState);

const cloneBoard = (sourceBoard: KanbanBoardState): KanbanBoardState =>
    KANBAN_COLUMNS.reduce((nextBoard, column) => {
        nextBoard[column.id] = sourceBoard[column.id].map((task) => ({
            ...task,
            status: column.id,
        }));
        return nextBoard;
    }, {} as KanbanBoardState);

const normalizeBoard = (sourceBoard: KanbanBoardState): KanbanBoardState =>
    KANBAN_COLUMNS.reduce((nextBoard, column) => {
        nextBoard[column.id] = sourceBoard[column.id].map((task) =>
            task.status === column.id ? task : { ...task, status: column.id }
        );
        return nextBoard;
    }, {} as KanbanBoardState);

export const isOperatorTaskStatus = (value: unknown): value is OperatorTaskStatus =>
    typeof value === 'string' && KANBAN_COLUMNS.some((column) => column.id === value);

export function useKanbanTasks() {
    const { t } = useTranslation('common');
    const [board, setBoard] = useState<KanbanBoardState>(() => createInitialBoard());
    const [searchText, setSearchText] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<OperatorTaskPriority | 'all'>('all');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const allTasks = useMemo(() => KANBAN_COLUMNS.flatMap((column) => board[column.id]), [board]);

    const selectedTask = useMemo(
        () => allTasks.find((task) => task.id === selectedTaskId) ?? null,
        [allTasks, selectedTaskId]
    );

    const visibleBoard = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        const nextBoard = getEmptyBoard();

        KANBAN_COLUMNS.forEach((column) => {
            nextBoard[column.id] = board[column.id].filter((task) => {
                const matchesPriority =
                    priorityFilter === 'all' || task.priority === priorityFilter;
                const matchesSearch =
                    !query ||
                    [
                        task.code,
                        task.title,
                        task.orderCode,
                        task.customerName,
                        task.machineName,
                        task.drawingCode,
                        task.location,
                    ].some((value) => value.toLowerCase().includes(query));

                return matchesPriority && matchesSearch;
            });
        });

        return nextBoard;
    }, [board, priorityFilter, searchText]);

    const stats = useMemo(
        () =>
            KANBAN_COLUMNS.map((column) => ({
                status: column.id,
                title: t(`operatorTasks.columns.${column.id}.title`),
                total: board[column.id].length,
            })),
        [board, t]
    );

    const moveTask = useCallback(
        (taskId: string, targetStatus: OperatorTaskStatus, targetVisibleIndex: number) => {
            setBoard((currentBoard) => {
                const sourceStatus = KANBAN_COLUMNS.find((column) =>
                    currentBoard[column.id].some((task) => task.id === taskId)
                )?.id;

                if (!sourceStatus) return currentBoard;

                const sourceItems = currentBoard[sourceStatus];
                const task = sourceItems.find((item) => item.id === taskId);

                if (!task) return currentBoard;

                const nextBoard = { ...currentBoard };
                const nextSourceItems = sourceItems.filter((item) => item.id !== taskId);
                const currentTargetItems =
                    sourceStatus === targetStatus ? nextSourceItems : currentBoard[targetStatus];
                const nextTargetItems = [...currentTargetItems];
                const visibleTargetItems = visibleBoard[targetStatus].filter(
                    (item) => item.id !== taskId
                );

                const referenceTask = visibleTargetItems[targetVisibleIndex];
                const referenceIndex = referenceTask
                    ? nextTargetItems.findIndex((item) => item.id === referenceTask.id)
                    : -1;
                const insertIndex = referenceIndex >= 0 ? referenceIndex : nextTargetItems.length;

                nextTargetItems.splice(insertIndex, 0, { ...task, status: targetStatus });
                nextBoard[sourceStatus] = nextSourceItems;
                nextBoard[targetStatus] = nextTargetItems;

                return nextBoard;
            });
        },
        [visibleBoard]
    );

    const moveBoardByEvent = useCallback((event: KanbanMoveEvent) => {
        setBoard((currentBoard) => {
            const movedBoard = move(
                currentBoard as Record<string, OperatorTask[]>,
                event
            ) as KanbanBoardState;

            return movedBoard === currentBoard ? currentBoard : normalizeBoard(movedBoard);
        });
    }, []);

    const replaceBoard = useCallback((nextBoard: KanbanBoardState) => {
        setBoard(cloneBoard(nextBoard));
    }, []);

    const resetFilters = useCallback(() => {
        setSearchText('');
        setPriorityFilter('all');
    }, []);

    return {
        board,
        visibleBoard,
        allTasks,
        stats,
        searchText,
        setSearchText,
        priorityFilter,
        setPriorityFilter,
        selectedTask,
        setSelectedTaskId,
        moveTask,
        moveBoardByEvent,
        replaceBoard,
        resetFilters,
    };
}
