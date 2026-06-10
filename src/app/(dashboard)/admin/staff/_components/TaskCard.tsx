'use client';
import { Button, Card, Tag, Flex, theme, Pagination } from 'antd';
import {
    ClockCircleOutlined,
    UserOutlined,
    ToolOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { memo } from 'react';

interface TaskCardProps {
    taskName: string;
    machineName: string;
    drawingCode: string;
    duration: string;
    status?: 'Running' | 'Pending' | 'Completed';
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Running':
            return 'processing';
        case 'Completed':
            return 'success';
        case 'Pending':
            return 'warning';
        default:
            return 'default';
    }
};

const TaskCard = memo(
    ({ taskName, machineName, drawingCode, duration, status = 'Running' }: TaskCardProps) => {
        const { token } = theme.useToken();

        return (
            <Card
                hoverable
                style={{
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease',
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}
                styles={{
                    body: {
                        padding: 16,
                    },
                }}
            >
                {/* Header - Task Name & Status */}
                <Flex
                    justify="space-between"
                    align="flex-start"
                    gap={12}
                    style={{ marginBottom: 12 }}
                >
                    <div
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: token.colorText,
                            flex: 1,
                            lineHeight: 1.4,
                        }}
                    >
                        {taskName}
                    </div>
                    <Tag
                        color={getStatusColor(status)}
                        style={{
                            margin: 0,
                            fontSize: 11,
                            fontWeight: 500,
                            borderRadius: 6,
                            padding: '2px 8px',
                        }}
                    >
                        {status}
                    </Tag>
                </Flex>

                {/* Details */}
                <div style={{ marginBottom: 12 }}>
                    <Flex align="center" gap={8} style={{ marginBottom: 6 }}>
                        <ToolOutlined
                            style={{
                                fontSize: 13,
                                color: token.colorPrimary,
                            }}
                        />
                        <div
                            style={{
                                fontSize: 13,
                                color: token.colorText,
                                fontWeight: 500,
                            }}
                        >
                            {machineName}
                        </div>
                    </Flex>
                    <Flex align="center" gap={8}>
                        <FileTextOutlined
                            style={{
                                fontSize: 13,
                                color: token.colorPrimary,
                            }}
                        />
                        <div
                            style={{
                                fontSize: 13,
                                color: token.colorTextSecondary,
                            }}
                        >
                            {drawingCode}
                        </div>
                    </Flex>
                </div>

                {/* Duration */}
                <Flex
                    align="center"
                    gap={6}
                    style={{
                        paddingTop: 12,
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <ClockCircleOutlined
                        style={{
                            fontSize: 13,
                            color: token.colorPrimary,
                        }}
                    />
                    <span
                        style={{
                            fontSize: 13,
                            color: token.colorTextSecondary,
                            fontWeight: 500,
                        }}
                    >
                        {duration}
                    </span>
                </Flex>
            </Card>
        );
    }
);

export default TaskCard;
