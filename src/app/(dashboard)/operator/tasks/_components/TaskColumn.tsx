'use client';

import { Empty, Flex, Space, Typography, theme } from 'antd';
import { CollisionPriority } from '@dnd-kit/abstract';
import { useDroppable } from '@dnd-kit/react';
import type {
    KanbanColumn,
    OperatorTask,
} from '@/hooks/kanban/useKanbanTasks';
import { TaskCard } from './TaskCard';
import { getTaskStatusTheme } from './taskTheme';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface TaskColumnProps {
    column: KanbanColumn;
    tasks: OperatorTask[];
    total: number;
    onOpenTask: (taskId: string) => void;
}

export function TaskColumn({ column, tasks, total, onOpenTask }: TaskColumnProps) {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const statusTheme = useMemo(() => getTaskStatusTheme(token), [token]);
    const { ref, isDropTarget } = useDroppable({
        id: column.id,
        type: 'column',
        accept: 'item',
        collisionPriority: CollisionPriority.Low,
        data: { status: column.id },
    });
    const columnTheme = statusTheme[column.id];

    return (
        <section
            ref={ref}
            style={{
                minWidth: 240,
                width: '100%',
                minHeight: 520,
                display: 'flex',
                flexDirection: 'column',
                background: isDropTarget
                    ? `linear-gradient(180deg, ${columnTheme.background} 0%, ${token.colorBgContainer} 100%)`
                    : `linear-gradient(180deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%)`,
                border: `1px solid ${isDropTarget ? columnTheme.border : token.colorBorderSecondary}`,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: isDropTarget
                    ? `0 0 0 2px ${columnTheme.border}, ${token.boxShadowSecondary}`
                    : token.boxShadowTertiary,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <div
                style={{
                    padding: '14px 16px',
                    borderTop: `3px solid ${columnTheme.accent}`,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: columnTheme.background,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Flex align="flex-start" justify="space-between" gap={12} style={{ position: 'relative', zIndex: 1 }}>
                    <Space orientation="vertical" size={2} style={{ minWidth: 0 }}>
                        <Text strong style={{ fontSize: 15 }}>
                            {column.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {column.description}
                        </Text>
                    </Space>
                    <div
                        style={{
                            minWidth: 28,
                            height: 28,
                            borderRadius: 8,
                            padding: '0 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: columnTheme.accent,
                            background: token.colorBgContainer,
                            border: `1px solid ${columnTheme.border}`,
                            fontWeight: 700,
                            boxShadow: token.boxShadowTertiary,
                        }}
                    >
                        {total}
                    </div>
                </Flex>
            </div>

            <div
                style={{
                    flex: 1,
                    padding: 12,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                }}
            >
                {tasks.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            minHeight: 180,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 8,
                            border: `1px dashed ${token.colorBorder}`,
                            background: token.colorBgLayout,
                        }}
                    >
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={t('operatorTasks.empty.noTasks')}
                        />
                    </div>
                ) : (
                    tasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} onOpen={onOpenTask} />
                    ))
                )}
            </div>
        </section>
    );
}
