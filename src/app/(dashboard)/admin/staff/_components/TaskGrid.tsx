'use client';
import { Row, Col } from 'antd';
import { memo } from 'react';
import TaskColumn from './TaskColumn';

interface Task {
    id: string;
    taskName: string;
    machineName: string;
    drawingCode: string;
    duration: string;
    status?: 'Running' | 'Pending' | 'Completed';
}

interface UserColumn {
    userName: string;
    tasks: Task[];
    currentPage: number;
    totalPages: number;
}

interface TaskGridProps {
    columns: UserColumn[];
    onColumnPageChange?: (columnIndex: number, page: number) => void;
}

export const TaskGrid = memo(({ columns, onColumnPageChange }: TaskGridProps) => {
    return (
        <Row
            gutter={[16, 16]}
            style={{
                margin: 0,
            }}
        >
            {columns.map((column, index) => (
                <Col xs={24} md={12} lg={8} key={index}>
                    <TaskColumn
                        userName={column.userName}
                        tasks={column.tasks}
                        currentPage={column.currentPage}
                        totalPages={column.totalPages}
                        onPageChange={(page) => onColumnPageChange?.(index, page)}
                    />
                </Col>
            ))}
        </Row>
    );
});

TaskGrid.displayName = 'TaskGrid';
