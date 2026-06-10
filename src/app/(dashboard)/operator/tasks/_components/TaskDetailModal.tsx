'use client';

import { Card, Col, Flex, Modal, Row, Space, Tag, Typography, theme } from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    FileTextOutlined,
    ToolOutlined,
    UserOutlined,
} from '@ant-design/icons';
import type { OperatorTask } from '@/hooks/kanban/useKanbanTasks';
import { getTaskPriorityTheme, getTaskStatusTheme } from './taskTheme';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

const { Paragraph, Text } = Typography;
type ThemeToken = ReturnType<typeof theme.useToken>['token'];

interface TaskDetailModalProps {
    task: OperatorTask | null;
    open: boolean;
    onClose: () => void;
}

interface DetailItemProps {
    icon: ReactNode;
    label: ReactNode;
    value: ReactNode;
    token: ThemeToken;
}

function DetailItem({ icon, label, value, token }: DetailItemProps) {
    return (
        <Flex align="flex-start" gap={10}>
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: token.borderRadiusSM,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: token.colorPrimary,
                    background: token.colorPrimaryBg,
                }}
            >
                {icon}
            </div>
            <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {label}
                </Text>
                <Text strong ellipsis={{ tooltip: typeof value === 'string' ? value : undefined }}>
                    {value}
                </Text>
            </Space>
        </Flex>
    );
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <Space size={8}>
            {icon}
            <Text strong>{children}</Text>
        </Space>
    );
}

export function TaskDetailModal({ task, open, onClose }: TaskDetailModalProps) {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const priorityTheme = useMemo(() => getTaskPriorityTheme(token), [token]);
    const statusTheme = useMemo(() => getTaskStatusTheme(token), [token]);
    const currentPriorityTheme = task ? priorityTheme[task.priority] : null;
    const currentStatusTheme = task ? statusTheme[task.status] : null;

    return (
        <Modal
            title={
                task && currentPriorityTheme && currentStatusTheme ? (
                    <div style={{ paddingRight: 24 }}>
                        <Flex align="center" gap={8} wrap="wrap" style={{ marginBottom: 8 }}>
                            <Text code style={{ fontSize: 13 }}>{task.code}</Text>
                            <Tag color={currentPriorityTheme.tagColor} style={{ margin: 0 }}>
                                {t(`operatorTasks.priority.${task.priority}`)}
                            </Tag>
                            <Tag
                                style={{
                                    margin: 0,
                                    color: currentStatusTheme.accent,
                                    borderColor: currentStatusTheme.border,
                                    background: currentStatusTheme.background,
                                }}
                            >
                                {t(`operatorTasks.status.${task.status}`)}
                            </Tag>
                        </Flex>
                        <Text strong style={{ fontSize: 17, lineHeight: 1.4 }}>
                            {task.title}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {task.orderCode} / {task.customerName}
                            </Text>
                        </div>
                    </div>
                ) : (
                    t('operatorTasks.detail.title')
                )
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={820}
            destroyOnHidden
            styles={{
                header: {
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    paddingBottom: 14,
                },
                body: {
                    paddingTop: 18,
                    background: token.colorBgLayout,
                },
            }}
        >
            {task && (
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                    <Card
                        size="small"
                        title={
                            <SectionTitle icon={<ToolOutlined style={{ color: token.colorPrimary }} />}>
                                {t('operatorTasks.detail.sections.production')}
                            </SectionTitle>
                        }
                        style={{ borderRadius: token.borderRadiusLG }}
                        styles={{
                            header: { background: token.colorBgContainer },
                            body: { padding: 16 },
                        }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <DetailItem
                                    token={token}
                                    icon={<ToolOutlined />}
                                    label={t('operatorTasks.detail.fields.machine')}
                                    value={task.machineName}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <DetailItem
                                    token={token}
                                    icon={<FileTextOutlined />}
                                    label={t('operatorTasks.detail.fields.drawing')}
                                    value={task.drawingCode}
                                />
                            </Col>
                            <Col xs={24}>
                                <DetailItem
                                    token={token}
                                    icon={<EnvironmentOutlined />}
                                    label={t('operatorTasks.detail.fields.location')}
                                    value={task.location}
                                />
                            </Col>
                        </Row>
                    </Card>

                    <Card
                        size="small"
                        title={
                            <SectionTitle
                                icon={<CalendarOutlined style={{ color: token.colorPrimary }} />}
                            >
                                {t('operatorTasks.detail.sections.context')}
                            </SectionTitle>
                        }
                        style={{ borderRadius: token.borderRadiusLG }}
                        styles={{
                            header: { background: token.colorBgContainer },
                            body: { padding: 16 },
                        }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <DetailItem
                                    token={token}
                                    icon={<FileTextOutlined />}
                                    label={t('operatorTasks.detail.fields.order')}
                                    value={task.orderCode}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <DetailItem
                                    token={token}
                                    icon={<UserOutlined />}
                                    label={t('operatorTasks.detail.fields.customer')}
                                    value={task.customerName}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <DetailItem
                                    token={token}
                                    icon={<CalendarOutlined />}
                                    label={t('operatorTasks.detail.fields.dueDate')}
                                    value={task.dueDate}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <DetailItem
                                    token={token}
                                    icon={<ClockCircleOutlined />}
                                    label={t('operatorTasks.detail.fields.estimate')}
                                    value={task.estimate}
                                />
                            </Col>
                        </Row>
                    </Card>

                    <Card
                        size="small"
                        title={
                            <SectionTitle
                                icon={<FileTextOutlined style={{ color: token.colorPrimary }} />}
                            >
                                {t('operatorTasks.detail.description')}
                            </SectionTitle>
                        }
                        style={{ borderRadius: token.borderRadiusLG }}
                        styles={{
                            header: { background: token.colorBgContainer },
                            body: { padding: 16 },
                        }}
                    >
                        <Paragraph style={{ marginBottom: 0, color: token.colorTextSecondary }}>
                            {task.description}
                        </Paragraph>
                    </Card>

                    {task.notes && (
                        <Card
                            size="small"
                            title={
                                <SectionTitle
                                    icon={<FileTextOutlined style={{ color: token.colorPrimary }} />}
                                >
                                    {t('operatorTasks.detail.notes')}
                                </SectionTitle>
                            }
                            style={{ borderRadius: token.borderRadiusLG }}
                            styles={{
                                header: { background: token.colorBgContainer },
                                body: { padding: 16 },
                            }}
                        >
                            <Paragraph style={{ marginBottom: 0, color: token.colorTextSecondary }}>
                                {task.notes}
                            </Paragraph>
                        </Card>
                    )}
                </Space>
            )}
        </Modal>
    );
}
