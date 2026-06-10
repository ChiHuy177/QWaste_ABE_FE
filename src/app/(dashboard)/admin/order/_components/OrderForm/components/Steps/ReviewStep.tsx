'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FormInstance, Typography } from 'antd';
import {
    Space,
    Alert,
    Card,
    Descriptions,
    Tag,
    Flex,
    Button,
    Row,
    Col,
    Tree,
    Layout,
    Input,
    Tabs,
    Grid,
    Empty,
    theme,
} from 'antd';
import type { TreeDataNode } from 'antd';
import {
    EditOutlined,
    ClockCircleOutlined,
    UserOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    NodeIndexOutlined,
    CarryOutOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { PRIORITY_TAG_COLORS } from '../../constants';
import { formatDuration } from '../../utils/formatters';
import { getDrawingStepQuantityBalanceSummary } from '../../utils/validators';
import { formToTreeData, parseNodeKey, type SelectedNode } from '../../utils/treeMappers';

const { Text, Title, Paragraph } = Typography;
const { Sider, Content } = Layout;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface ReviewStepProps {
    form: FormInstance;
    drawingTemplates: DrawingCodePickingResponse[];
    operators: any[];
    onEditStep: (step: number) => void;
}

const collectTreeKeys = (nodes: TreeDataNode[]): React.Key[] => {
    const keys: React.Key[] = [];

    nodes.forEach((node) => {
        keys.push(node.key);
        if (node.children) {
            keys.push(...collectTreeKeys(node.children));
        }
    });

    return keys;
};

const filterTreeData = (nodes: TreeDataNode[], searchValue: string): TreeDataNode[] => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return nodes;

    return nodes
        .map((node) => {
            const title = String(node.title || '').toLowerCase();
            const children = node.children ? filterTreeData(node.children, keyword) : [];

            if (title.includes(keyword) || children.length > 0) {
                return {
                    ...node,
                    children,
                };
            }

            return null;
        })
        .filter(Boolean) as TreeDataNode[];
};

type CountLabelKey =
    | 'orderManagement.form.plan.drawingsCount'
    | 'orderManagement.form.plan.stepsCount'
    | 'orderManagement.form.plan.tasksCount';

export const ReviewStep: React.FC<ReviewStepProps> = ({
    form,
    drawingTemplates,
    operators,
    onEditStep,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const values = form.getFieldsValue(true);
    const orderDrawings = values.orderDrawings || [];

    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [activeMobileTab, setActiveMobileTab] = useState<'structure' | 'detail'>('structure');

    const treeData = useMemo(
        () => formToTreeData(orderDrawings, drawingTemplates, t),
        [orderDrawings, drawingTemplates, t]
    );

    const filteredTreeData = useMemo(
        () => filterTreeData(treeData, searchValue),
        [treeData, searchValue]
    );

    const operatorMap = useMemo(() => {
        return new Map(operators.map((operator: any) => [operator.userId, operator]));
    }, [operators]);

    const getCountLabel = (key: CountLabelKey) => t(key, { count: 0 }).replace(/\b0\b/g, '').trim();

    const summaryStats = useMemo(() => {
        return orderDrawings.reduce(
            (summary: { drawings: number; steps: number; tasks: number; totalTimeSeconds: number }, drawing: any) => {
                const steps = drawing.orderSteps || [];
                const drawingStepTime = steps.reduce(
                    (total: number, step: any) =>
                        total + (Number(step?.defaultCompletionTimeSeconds) || 0),
                    0
                );

                summary.drawings += 1;
                summary.steps += steps.length;
                summary.tasks += steps.reduce(
                    (total: number, step: any) => total + (step.tasks?.length || 0),
                    0
                );
                summary.totalTimeSeconds +=
                    drawingStepTime || Number(drawing.defaultCompletionTimeSeconds) || 0;

                return summary;
            },
            { drawings: 0, steps: 0, tasks: 0, totalTimeSeconds: 0 }
        );
    }, [orderDrawings]);

    useEffect(() => {
        const allKeys = collectTreeKeys(treeData);
        setExpandedKeys(allKeys);

        if (!selectedNode && treeData[0]?.key) {
            setSelectedNode({ key: String(treeData[0].key), type: 'drawing' });
        }
    }, [selectedNode, treeData]);

    const handleSelect = (selectedKeys: React.Key[]) => {
        const key = selectedKeys[0];
        if (!key) return;

        const parsed = parseNodeKey(String(key));
        setSelectedNode({ key: String(key), type: parsed.type });
        if (isMobile) {
            setActiveMobileTab('detail');
        }
    };

    const renderSummaryTile = (
        icon: React.ReactNode,
        label: React.ReactNode,
        value: React.ReactNode
    ) => (
        <Col xs={12} md={6}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    minHeight: 72,
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        color: token.colorPrimary,
                        background: token.colorFillAlter,
                        flex: '0 0 auto',
                    }}
                >
                    {icon}
                </div>
                <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {label}
                    </Text>
                    <Text strong style={{ fontSize: 18, lineHeight: 1.2 }}>
                        {value}
                    </Text>
                </Space>
            </div>
        </Col>
    );

    const getSelectedData = () => {
        if (!selectedNode) return null;

        const { type, indices } = parseNodeKey(selectedNode.key);
        const [drawingIndex, stepIndex, taskIndex] = indices;
        const drawing = orderDrawings[drawingIndex];
        const template = drawingTemplates.find(
            (templateItem) => templateItem.drawingCodeId === drawing?.drawingCodeId
        );
        const step = drawing?.orderSteps?.[stepIndex];
        const task = step?.tasks?.[taskIndex];

        return { type, drawingIndex, stepIndex, taskIndex, drawing, template, step, task };
    };

    const selectedData = getSelectedData();

    const renderDescription = (description?: string) => {
        if (!description) return null;

        return (
            <div
                style={{
                    padding: 12,
                    borderRadius: 8,
                    background: token.colorFillAlter,
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                    {t('orderManagement.drawing.description')}
                </Text>
                <Paragraph style={{ margin: 0 }}>{description}</Paragraph>
            </div>
        );
    };

    const renderDetailPanel = () => {
        if (!selectedData?.drawing) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('orderManagement.form.plan.selectNodeHint')}
                />
            );
        }

        const { type, drawingIndex, stepIndex, taskIndex, drawing, template, step, task } =
            selectedData;
        const drawingInfo = {
            ofCustomer: drawing.ofCustomer || template?.ofCustomer,
            versionNumber: drawing.versionNumber || template?.versionNumber,
            description: drawing.description || template?.description,
            pdfLink: drawing.pdfLink || template?.pdfLink,
            defaultCompletionTimeSeconds:
                drawing.defaultCompletionTimeSeconds || template?.defaultCompletionTimeSeconds,
        };

        if (type === 'drawing') {
            const orderStepsData = drawing.orderSteps || [];
            const stepQuantityBalance = getDrawingStepQuantityBalanceSummary(drawing);
            const totalTimeSeconds = orderStepsData.reduce(
                (total: number, orderStep: any) =>
                    total + (Number(orderStep?.defaultCompletionTimeSeconds) || 0),
                0
            );
            const displayedTimeSeconds =
                orderStepsData.length > 0
                    ? totalTimeSeconds
                    : drawingInfo.defaultCompletionTimeSeconds || 0;

            return (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Flex justify="space-between" align="start" gap={12} wrap="wrap">
                        <Space direction="vertical" size={2}>
                            <Tag color={token.colorPrimary} style={{ width: 'fit-content' }}>
                                {drawingIndex + 1}.0
                            </Tag>
                            <Title level={5} style={{ margin: 0 }}>
                                {template?.drawingCode || '-'}
                            </Title>
                            <Text type="secondary">{template?.drawingCodeName || '-'}</Text>
                        </Space>
                        <Button
                            size="small"
                            type="link"
                            onClick={() => onEditStep(1)}
                            icon={<EditOutlined />}
                        >
                            {t('orderManagement.form.confirm.editButton')}
                        </Button>
                    </Flex>

                    <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                        <Descriptions.Item label={t('orderManagement.form.fields.productionType')}>
                            {drawing.productionType === 'BATCH' ? (
                                <Tag color="blue" bordered={false}>
                                    {t('orderManagement.list.table.batch')}
                                </Tag>
                            ) : (
                                <Tag color="cyan" bordered={false}>
                                    {t('orderManagement.list.table.single')}
                                </Tag>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={t('orderManagement.form.plan.totalRequestedQuantity')}
                        >
                            <Text strong>
                                {t('orderManagement.form.plan.stepBalanceCount', {
                                    balanced: stepQuantityBalance.balancedSteps,
                                    total: stepQuantityBalance.totalSteps,
                                })}{' '}
                                ({drawing.totalRequestedQuantity || 0})
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.drawing.ofCustomer')}>
                            {drawingInfo.ofCustomer || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.drawing.version')}>
                            {drawingInfo.versionNumber || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.drawing.expectedSteps')}>
                            {drawing.orderSteps?.length || 0}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.drawing.totalExpectedTime')}>
                            <Text strong style={{ color: token.colorPrimary }}>
                                {formatDuration(displayedTimeSeconds)}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>

                    {drawingInfo.pdfLink && (
                        <Button
                            type="link"
                            href={drawingInfo.pdfLink}
                            target="_blank"
                            style={{ padding: 0, width: 'fit-content' }}
                            icon={<FilePdfOutlined />}
                        >
                            {t('orderManagement.drawing.viewPdfDocument')}
                        </Button>
                    )}
                    {renderDescription(drawingInfo.description)}
                </Space>
            );
        }

        if (type === 'step' && step) {
            return (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Flex justify="space-between" align="start" gap={12} wrap="wrap">
                        <Space direction="vertical" size={2}>
                            <Tag color="purple" style={{ width: 'fit-content' }}>
                                {drawingIndex + 1}.{step.stepOrder || stepIndex + 1}
                            </Tag>
                            <Title level={5} style={{ margin: 0 }}>
                                {step.stepName || '-'}
                            </Title>
                        </Space>
                        <Button
                            size="small"
                            type="link"
                            onClick={() => onEditStep(1)}
                            icon={<EditOutlined />}
                        >
                            {t('orderManagement.form.confirm.editButton')}
                        </Button>
                    </Flex>

                    <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                        <Descriptions.Item label={t('orderManagement.step.materialLabel')}>
                            {step.materialName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="QC">
                            {step.requiresQc ? <Tag color="orange">QC</Tag> : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.step.timeLabel')}>
                            {step.defaultCompletionTimeSeconds
                                ? formatDuration(step.defaultCompletionTimeSeconds)
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={getCountLabel('orderManagement.form.plan.tasksCount')}
                        >
                            {step.tasks?.length || 0}
                        </Descriptions.Item>
                    </Descriptions>

                    {renderDescription(step.description)}
                </Space>
            );
        }

        if (type === 'task' && task) {
            const taskOperators = (task.operatorIds || [])
                .map((operatorId: string) => operatorMap.get(operatorId))
                .filter(Boolean);

            return (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Flex justify="space-between" align="start" gap={12} wrap="wrap">
                        <Space direction="vertical" size={2}>
                            <Tag color="green" style={{ width: 'fit-content' }}>
                                {drawingIndex + 1}.{step?.stepOrder || stepIndex + 1}.
                                {task.taskOrder || taskIndex + 1}
                            </Tag>
                            <Title level={5} style={{ margin: 0 }}>
                                {task.taskName || '-'}
                            </Title>
                        </Space>
                        <Button
                            size="small"
                            type="link"
                            onClick={() => onEditStep(1)}
                            icon={<EditOutlined />}
                        >
                            {t('orderManagement.form.confirm.editButton')}
                        </Button>
                    </Flex>

                    <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                        <Descriptions.Item label={t('orderManagement.task.reqQtyLabel')}>
                            {task.taskRequestedQuantity ?? '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.task.planQtyLabel')}>
                            {task.taskPlannedQuantity ?? '-'}
                        </Descriptions.Item>
                    </Descriptions>

                    <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                            {t('orderManagement.task.assignOperator')}
                        </Text>
                        <Space size={[8, 8]} wrap>
                            {taskOperators.length > 0 ? (
                                taskOperators.map((operator: any) => (
                                    <Tag
                                        key={operator.userId}
                                        color="blue"
                                        icon={<UserOutlined />}
                                        style={{ margin: 0, padding: '2px 8px' }}
                                    >
                                        {operator.fullname || operator.username || operator.userId}
                                    </Tag>
                                ))
                            ) : (
                                <Text type="secondary">-</Text>
                            )}
                        </Space>
                    </div>
                </Space>
            );
        }

        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('orderManagement.form.plan.selectNodeHint')}
            />
        );
    };

    const treePanel = (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Input
                placeholder={t('common.search')}
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                allowClear
            />
            <Tree
                className="order-review-tree"
                treeData={filteredTreeData}
                selectedKeys={selectedNode ? [selectedNode.key] : []}
                expandedKeys={expandedKeys}
                onSelect={handleSelect}
                onExpand={setExpandedKeys}
                showIcon
                style={{
                    background: 'transparent',
                    overflowX: 'hidden',
                }}
            />
        </Space>
    );

    const detailPanel = (
        <div
            style={{
                padding: isMobile ? 16 : 24,
                minHeight: isMobile ? 320 : 560,
            }}
        >
            {renderDetailPanel()}
        </div>
    );

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <style jsx global>{`
                .order-review-tree .ant-tree-treenode {
                    max-width: 100%;
                    width: 100%;
                }

                .order-review-tree .ant-tree-indent,
                .order-review-tree .ant-tree-switcher {
                    flex: 0 0 auto;
                }

                .order-review-tree .ant-tree-node-content-wrapper {
                    min-width: 0;
                    flex: 1;
                    max-width: none;
                    overflow: hidden;
                    padding-inline-end: 0;
                }

                .order-review-tree .ant-tree-title {
                    display: block;
                    min-width: 0;
                    width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>

            <Alert
                message={t('orderManagement.form.confirm.title')}
                description={t('orderManagement.form.confirm.subtitle')}
                type="info"
                showIcon
            />

            <div
                style={{
                    padding: 16,
                    borderRadius: 8,
                    background: token.colorBgLayout,
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Row gutter={[12, 12]}>
                    {renderSummaryTile(
                        <FileTextOutlined />,
                        getCountLabel('orderManagement.form.plan.drawingsCount'),
                        summaryStats.drawings
                    )}
                    {renderSummaryTile(
                        <NodeIndexOutlined />,
                        getCountLabel('orderManagement.form.plan.stepsCount'),
                        summaryStats.steps
                    )}
                    {renderSummaryTile(
                        <CarryOutOutlined />,
                        getCountLabel('orderManagement.form.plan.tasksCount'),
                        summaryStats.tasks
                    )}
                    {renderSummaryTile(
                        <ClockCircleOutlined />,
                        t('orderManagement.drawing.totalExpectedTime'),
                        formatDuration(summaryStats.totalTimeSeconds)
                    )}
                </Row>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={10}>
                    <Card
                        title={t('orderManagement.form.confirm.orderSummary')}
                        size="small"
                        extra={
                            <Button
                                size="small"
                                type="link"
                                onClick={() => onEditStep(0)}
                                icon={<EditOutlined />}
                            >
                                {t('orderManagement.form.confirm.editButton')}
                            </Button>
                        }
                    >
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label={t('orderManagement.form.fields.orderCode')}>
                                <Text strong>{values.orderCode || '-'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('orderManagement.form.fields.orderName')}>
                                <Text strong>{values.orderName || '-'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('orderManagement.form.fields.priority')}>
                                <Tag color={PRIORITY_TAG_COLORS[values.orderPriority] || 'default'}>
                                    {values.orderPriority
                                        ? t(
                                            `orderManagement.form.priorities.${values.orderPriority?.toLowerCase()}`
                                        )
                                        : '-'}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
                <Col xs={24} lg={14}>
                    <Card title={t('orderManagement.form.confirm.customerSummary')} size="small">
                        <Descriptions column={{ xs: 1, md: 2 }} size="small">
                            <Descriptions.Item
                                label={t('orderManagement.form.fields.customerName')}
                            >
                                <Text strong>{values.customerName || '-'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('orderManagement.form.fields.customerPhone')}
                            >
                                {values.customerPhone || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('orderManagement.form.fields.expectedStartDate')}
                            >
                                {values.expectedStartDate
                                    ? values.expectedStartDate.format('YYYY-MM-DD')
                                    : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('orderManagement.form.fields.expectedEndDate')}
                            >
                                {values.expectedEndDate
                                    ? values.expectedEndDate.format('YYYY-MM-DD')
                                    : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('orderManagement.form.fields.customerNote')}
                                span={2}
                            >
                                {values.customerNote || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>

            <Card
                title={t('orderManagement.form.confirm.drawingSummary', {
                    count: orderDrawings.length,
                })}
                size="small"
            >
                {isMobile ? (
                    <Tabs
                        activeKey={activeMobileTab}
                        onChange={(key) => setActiveMobileTab(key as 'structure' | 'detail')}
                        items={[
                            {
                                key: 'structure',
                                label: t('orderManagement.form.plan.planConfiguration'),
                                children: treePanel,
                            },
                            {
                                key: 'detail',
                                label: t('common.details'),
                                children: detailPanel,
                            },
                        ]}
                    />
                ) : (
                    <Layout
                        style={{
                            background: token.colorBgContainer,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: 8,
                            overflow: 'hidden',
                        }}
                    >
                        <Sider
                            width="34%"
                            style={{
                                background: token.colorBgLayout,
                                borderRight: `1px solid ${token.colorBorderSecondary}`,
                                padding: 16,
                                minHeight: 560,
                                maxHeight: '64vh',
                                overflowY: 'auto',
                            }}
                        >
                            {treePanel}
                        </Sider>
                        <Content
                            style={{
                                background: token.colorBgContainer,
                                maxHeight: '64vh',
                                overflowY: 'auto',
                            }}
                        >
                            {detailPanel}
                        </Content>
                    </Layout>
                )}
            </Card>
        </Space>
    );
};
