'use client';
import { Button, Flex, Space, theme } from 'antd';
import { LeftOutlined, RightOutlined, UserOutlined } from '@ant-design/icons';
import { memo } from 'react';
import TaskCard from './TaskCard';
import { Pagination } from 'antd/lib';

interface Task {
    id: string;
    taskName: string;
    machineName: string;
    drawingCode: string;
    duration: string;
    status?: 'Running' | 'Pending' | 'Completed';
}

interface TaskColumnProps {
    userName: string;
    tasks: Task[];
    currentPage: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
}

const TaskColumn = memo(
    ({ userName, tasks, currentPage, totalPages, onPageChange }: TaskColumnProps) => {
        const { token } = theme.useToken();

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: token.colorBgContainer,
                    borderRadius: 12,
                    border: `1px solid ${token.colorBorder}`,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorPrimary}05 100%)`,
                        padding: '16px 20px',
                        borderBottom: `2px solid ${token.colorPrimary}`,
                    }}
                >
                    <Flex align="center" gap={12}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: token.colorPrimary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <UserOutlined style={{ fontSize: 18, color: '#fff' }} />
                        </div>
                        <span
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: token.colorText,
                            }}
                        >
                            {userName}
                        </span>
                    </Flex>
                </div>

                {/* Task Cards - Fixed Area for 2 tasks */}
                <div
                    style={{
                        padding: '16px',
                        height: '370px', // Adjusted height for exactly 2 tasks with proper spacing
                        overflow: 'hidden',
                    }}
                >
                    {tasks.length === 0 ? (
                        <div
                            style={{
                                fontSize: 14,
                                color: token.colorTextSecondary,
                                textAlign: 'center',
                                padding: '40px 16px',
                                background: token.colorBgLayout,
                                borderRadius: 8,
                            }}
                        >
                            No tasks available
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    taskName={task.taskName}
                                    machineName={task.machineName}
                                    drawingCode={task.drawingCode}
                                    duration={task.duration}
                                    status={task.status}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Fixed Pagination Footer */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderTop: `1px solid ${token.colorBorder}`,
                        background: token.colorBgContainer,
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <Pagination
                        simple
                        current={currentPage}
                        total={totalPages * 2} // 2 tasks per page
                        pageSize={2}
                        onChange={onPageChange}
                        showSizeChanger={false}
                    />
                </div>
            </div>
        );
    }
);

export default TaskColumn;
