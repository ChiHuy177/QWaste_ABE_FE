'use client';

import { useEffect, useMemo, useRef } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { DragDropManager, Feedback, type DragEndEvent, type DragOverEvent } from '@dnd-kit/dom';
import type { Plugins } from '@dnd-kit/abstract';
import {
    KANBAN_COLUMNS,
    type KanbanBoardState,
} from '@/hooks/kanban/useKanbanTasks';
import { TaskColumn } from './TaskColumn';
import { useTranslation } from 'react-i18next';

interface OperatorTaskBoardProps {
    board: KanbanBoardState;
    visibleBoard: KanbanBoardState;
    onOpenTask: (taskId: string) => void;
    onMoveBoard: (event: DragOverEvent | DragEndEvent) => void;
    onReplaceBoard: (board: KanbanBoardState) => void;
}

export function OperatorTaskBoard({
    board,
    visibleBoard,
    onOpenTask,
    onMoveBoard,
    onReplaceBoard,
}: OperatorTaskBoardProps) {
    const { t } = useTranslation('common');
    const destroyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const boardSnapshotRef = useRef<KanbanBoardState>(cloneBoard(board));
    const { manager, destroy } = useMemo(() => {
        const dragDropManager = new DragDropManager();
        const destroyManager = dragDropManager.destroy.bind(dragDropManager);

        dragDropManager.destroy = () => undefined;

        return {
            manager: dragDropManager,
            destroy: destroyManager,
        };
    }, []);

    useEffect(() => {
        if (destroyTimeoutRef.current) {
            clearTimeout(destroyTimeoutRef.current);
            destroyTimeoutRef.current = null;
        }

        return () => {
            destroyTimeoutRef.current = setTimeout(destroy, 0);
        };
    }, [destroy]);

    const plugins = useMemo(
        () => (defaults: Plugins): Plugins =>
            defaults.map((plugin) => {
                const pluginConstructor = typeof plugin === 'function' ? plugin : plugin.plugin;

                if (pluginConstructor === Feedback) {
                    return Feedback.configure({ feedback: 'move', dropAnimation: null });
                }

                return plugin;
            }),
        []
    );
    const columns = useMemo(
        () =>
            KANBAN_COLUMNS.map((column) => ({
                ...column,
                title: t(`operatorTasks.columns.${column.id}.title`),
                description: t(`operatorTasks.columns.${column.id}.description`),
            })),
        [t]
    );

    return (
        <DragDropProvider
            manager={manager}
            plugins={plugins}
            onDragStart={() => {
                boardSnapshotRef.current = cloneBoard(board);
            }}
            onDragOver={(event) => {
                onMoveBoard(event);
            }}
            onDragEnd={(event) => {
                if (event.canceled) {
                    onReplaceBoard(boardSnapshotRef.current);
                }
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))',
                    gap: 16,
                    alignItems: 'stretch',
                    width: 'max-content',
                    minWidth: '100%',
                }}
            >
                {columns.map((column) => (
                    <TaskColumn
                        key={column.id}
                        column={column}
                        tasks={visibleBoard[column.id]}
                        total={board[column.id].length}
                        onOpenTask={onOpenTask}
                    />
                ))}
            </div>
        </DragDropProvider>
    );
}

function cloneBoard(sourceBoard: KanbanBoardState): KanbanBoardState {
    return KANBAN_COLUMNS.reduce((nextBoard, column) => {
        nextBoard[column.id] = sourceBoard[column.id].map((task) => ({
            ...task,
            status: column.id,
        }));
        return nextBoard;
    }, {} as KanbanBoardState);
}
