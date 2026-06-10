'use client';

import { Flex, Space, Tag, Typography, theme } from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    FileTextOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/react/sortable';
import type { OperatorTask } from '@/hooks/kanban/useKanbanTasks';
import { getTaskPriorityTheme } from './taskTheme';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface TaskCardProps {
    task: OperatorTask;
    index: number;
    onOpen: (taskId: string) => void;
}

export function TaskCard({ task, index, onOpen }: TaskCardProps) {
    const { ref, isDragging, isDropping } = useSortable({
        id: task.id,
        index,
        type: 'item',
        accept: 'item',
        group: task.status,
        data: { task },
        transition: {
            duration: 180,
            easing: 'ease-out',
            idle: true,
        },
    });

    return (
        <TaskCardContent
            task={task}
            cardRef={ref}
            isDragging={isDragging}
            isDropping={isDropping}
            onClick={() => onOpen(task.id)}
        />
    );
}

export function TaskCardOverlay({ task }: { task: OperatorTask }) {
    return (
        <div style={{ width: 320 }}>
            <TaskCardContent task={task} overlay />
        </div>
    );
}

function TaskCardContent({
    task,
    cardRef,
    isDragging = false,
    isDropping = false,
    onClick,
    overlay = false,
}: {
    task: OperatorTask;
    cardRef?: (element: Element | null) => void;
    isDragging?: boolean;
    isDropping?: boolean;
    onClick?: () => void;
    overlay?: boolean;
}) {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const priorityTheme = useMemo(() => getTaskPriorityTheme(token), [token]);
    const taskPriorityTheme = priorityTheme[task.priority];

    return (
        <div
            ref={cardRef}
            role="button"
            tabIndex={overlay ? -1 : 0}
            onClick={onClick}
            onKeyDown={(event) => {
                if (overlay || !onClick) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick();
                }
            }}
            className="kanban-task-card"
            style={{
                background: token.colorBgContainer,
                borderRadius: 12,
                border: isDragging
                    ? `1.5px dashed ${token.colorPrimary}`
                    : `1px solid ${token.colorBorderSecondary}`,
                boxShadow: overlay
                    ? token.boxShadowSecondary
                    : isDragging
                        ? token.boxShadowSecondary
                        : token.boxShadowTertiary,
                opacity: isDragging ? 0.45 : 1,
                cursor: overlay ? 'grabbing' : isDragging ? 'grabbing' : 'grab',
                padding: 14,
                transform: overlay || isDropping ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <style>{`
                .kanban-task-card:hover {
                    box-shadow: ${token.boxShadowSecondary} !important;
                    transform: translateY(-2px);
                    border-color: ${token.colorPrimaryBorder} !important;
                }
            `}</style>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: taskPriorityTheme.accent,
                    opacity: 0.85,
                }}
            />
            <Flex align="flex-start" justify="space-between" gap={10} style={{ marginBottom: 10 }}>
                <Space direction="vertical" size={2} style={{ minWidth: 0 }}>
                    <Text code style={{ fontSize: 12 }}>
                        {task.code}
                    </Text>
                    <Text strong style={{ fontSize: 14 }} ellipsis={{ tooltip: task.title }}>
                        {task.title}
                    </Text>
                </Space>
                <Tag color={taskPriorityTheme.tagColor} style={{ margin: 0 }}>
                    {t(`operatorTasks.priority.${task.priority}`)}
                </Tag>
            </Flex>

            <Space direction="vertical" size={7} style={{ width: '100%' }}>
                <Flex align="center" gap={8}>
                    <div
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: token.colorPrimaryBg,
                        }}
                    >
                        <ToolOutlined style={{ color: token.colorPrimary, fontSize: 12 }} />
                    </div>
                    <Text type="secondary" ellipsis={{ tooltip: task.machineName }}>
                        {task.machineName}
                    </Text>
                </Flex>
                <Flex align="center" gap={8}>
                    <div
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: token.colorPrimaryBg,
                        }}
                    >
                        <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 12 }} />
                    </div>
                    <Text type="secondary" ellipsis={{ tooltip: task.drawingCode }}>
                        {task.drawingCode}
                    </Text>
                </Flex>
            </Space>

            <Flex
                align="center"
                justify="space-between"
                gap={8}
                style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Space size={6}>
                    <CalendarOutlined style={{ color: token.colorTextTertiary }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {task.dueDate}
                    </Text>
                </Space>
                <Space size={6}>
                    <ClockCircleOutlined style={{ color: token.colorTextTertiary }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {task.estimate}
                    </Text>
                </Space>
            </Flex>
        </div>
    );
}
