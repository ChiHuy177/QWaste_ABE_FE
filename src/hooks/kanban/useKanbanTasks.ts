'use client';

import { useCallback, useMemo, useState } from 'react';
import { move } from '@dnd-kit/helpers';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/react';
import { useTranslation } from 'react-i18next';
import { MOCK_OPERATOR_TASKS } from '@/mockData/operator/tasks';

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

const createInitialBoard = (): KanbanBoardState =>
    KANBAN_COLUMNS.reduce((board, column) => {
        board[column.id] = MOCK_OPERATOR_TASKS.filter((task) => task.status === column.id);
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
