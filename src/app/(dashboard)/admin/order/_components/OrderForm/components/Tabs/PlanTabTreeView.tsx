'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Layout,
    Tree,
    Form,
    FormInstance,
    Input,
    Button,
    Space,
    Flex,
    theme,
    Card,
    Tag,
    Typography,
    Divider,
    Tabs,
    Grid,
    Alert,
} from 'antd';
import {
    SearchOutlined,
    DownOutlined,
    UpOutlined,
    PlusOutlined,
    FileTextOutlined,
    NodeIndexOutlined,
    CarryOutOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import {
    formToTreeData,
    getPathToNode,
    parseNodeKey,
    type SelectedNode,
} from '../../utils/treeMappers';
import { TreeNodeRenderer } from './TreeNodeRenderer';
import { DetailPanelRouter } from './DetailPanelRouter';

const { Sider, Content } = Layout;
const { useToken } = theme;
const { useBreakpoint } = Grid;

interface PlanTabTreeViewProps {
    form: FormInstance;
    drawingTemplates: DrawingCodePickingResponse[];
    operators: any[];
    isLoadingOperators: boolean;
    productionType: string;
    onQuickCreate: (drawingIndex: number) => void;
    focusNodeKey?: string | null;
    onFocusNodeHandled?: () => void;
    validationVersion?: number;
    showTaskReviews?: boolean;
    rootError?: string | null;
}

export const PlanTabTreeView: React.FC<PlanTabTreeViewProps> = ({
    form,
    drawingTemplates,
    operators,
    isLoadingOperators,
    productionType,
    onQuickCreate,
    focusNodeKey,
    onFocusNodeHandled,
    validationVersion = 0,
    showTaskReviews = true,
    rootError,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    Form.useWatch('orderDrawings', form);
    const orderDrawings = form.getFieldValue('orderDrawings') || [];
    const orderDrawingsErrors = form.getFieldError(['orderDrawings']);
    const emptyStateError = rootError || orderDrawingsErrors[0];

    // Convert form data to tree data
    const treeData = useMemo(
        () => formToTreeData(orderDrawings, drawingTemplates, t),
        [orderDrawings, drawingTemplates, t]
    );

    // Tree state
    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [activeMobileTab, setActiveMobileTab] = useState<'tree' | 'details'>('tree');

    const handleSelectedNodeChange = useCallback(
        (node: SelectedNode | null) => {
            setSelectedNode(node);
            if (node && isMobile) {
                setActiveMobileTab('details');
            }
        },
        [isMobile]
    );

    useEffect(() => {
        if (!focusNodeKey) return;

        const { type } = parseNodeKey(focusNodeKey);
        handleSelectedNodeChange({ key: focusNodeKey, type });
        setExpandedKeys((prev) => [...new Set([...prev, ...getPathToNode(focusNodeKey)])]);
        onFocusNodeHandled?.();
    }, [focusNodeKey, handleSelectedNodeChange, onFocusNodeHandled]);

    // Auto-select first drawing if nothing is selected
    useEffect(() => {
        // If no drawings, clear selection
        if (orderDrawings.length === 0) {
            if (selectedNode) handleSelectedNodeChange(null);
            return;
        }

        // Don't auto-select if already selected or focusNodeKey provided
        if (selectedNode || focusNodeKey) return;

        // Auto-select first drawing
        const firstDrawingKey = 'drawing-0';
        handleSelectedNodeChange({ key: firstDrawingKey, type: 'drawing' });
        setExpandedKeys((prev) => [...new Set([...prev, firstDrawingKey])]);
    }, [orderDrawings.length, selectedNode, focusNodeKey, handleSelectedNodeChange]);

    // Validate selected node still exists in tree
    useEffect(() => {
        if (!selectedNode || orderDrawings.length === 0) return;

        const nodeExists = (nodes: any[], key: string): boolean => {
            for (const node of nodes) {
                if (node.key === key) return true;
                if (node.children && nodeExists(node.children, key)) return true;
            }
            return false;
        };

        if (!nodeExists(treeData, selectedNode.key)) {
            // Selected node no longer exists, fallback to first drawing
            if (orderDrawings.length > 0) {
                handleSelectedNodeChange({ key: 'drawing-0', type: 'drawing' });
            } else {
                handleSelectedNodeChange(null);
            }
        }
    }, [treeData, selectedNode, orderDrawings.length, handleSelectedNodeChange]);

    // Handle tree node selection
    const handleSelect = (selectedKeys: React.Key[]) => {
        if (selectedKeys.length > 0) {
            const key = selectedKeys[0] as string;
            const { type } = parseNodeKey(key);
            handleSelectedNodeChange({ key, type });
            setExpandedKeys((prev) => [...new Set([...prev, ...getPathToNode(key)])]);
        }
    };

    // Expand all nodes
    const handleExpandAll = () => {
        const allKeys: React.Key[] = [];
        const collectKeys = (nodes: any[]) => {
            nodes.forEach((node) => {
                allKeys.push(node.key);
                if (node.children) collectKeys(node.children);
            });
        };
        collectKeys(treeData);
        setExpandedKeys(allKeys);
    };

    // Collapse all nodes
    const handleCollapseAll = () => {
        setExpandedKeys([]);
    };

    // Add Drawing
    const handleAddDrawing = () => {
        const currentDrawings = form.getFieldValue('orderDrawings') || [];
        const newDrawing = {
            drawingCodeId: '',
            totalRequestedQuantity: 1,
            productionType: productionType || 'BATCH',
            orderSteps: [],
        };

        form.setFieldValue('orderDrawings', [...currentDrawings, newDrawing]);

        // Auto-select new drawing
        const newIndex = currentDrawings.length;
        const newKey = `drawing-${newIndex}`;
        handleSelectedNodeChange({ key: newKey, type: 'drawing' });
        setExpandedKeys(prev => [...prev, newKey]);
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const drawings = orderDrawings.length;
        let steps = 0;
        let tasks = 0;

        orderDrawings.forEach((drawing: any) => {
            if (!drawing) return;
            const drawingSteps = drawing.orderSteps || [];
            steps += drawingSteps.length;
            drawingSteps.forEach((step: any) => {
                if (!step) return;
                tasks += (step.tasks || []).length;
            });
        });

        return { drawings, steps, tasks };
    }, [orderDrawings]);

    const treePanel = (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {/* Search */}
            <Input
                placeholder={t('common.search')}
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                allowClear
            />

            {/* Expand/Collapse Controls */}
            <Flex gap={8} wrap="wrap">
                <Button
                    size="small"
                    icon={<DownOutlined />}
                    onClick={handleExpandAll}
                    style={{ flex: 1, minWidth: 120 }}
                >
                    {t('orderManagement.form.plan.expandAll')}
                </Button>
                <Button
                    size="small"
                    icon={<UpOutlined />}
                    onClick={handleCollapseAll}
                    style={{ flex: 1, minWidth: 120 }}
                >
                    {t('orderManagement.form.plan.collapse')}
                </Button>
            </Flex>

            {/* Tree */}
            {treeData.length === 0 ? (
                <div
                    style={{
                        padding: 24,
                        textAlign: 'center',
                        color: token.colorTextSecondary,
                    }}
                >
                    {emptyStateError && (
                        <Alert
                            type="error"
                            showIcon
                            message={emptyStateError}
                            style={{ marginBottom: 16, textAlign: 'left' }}
                        />
                    )}
                    <div>{t('orderManagement.form.plan.noDrawingsConfigured')}</div>
                    <div>{t('orderManagement.form.plan.addDrawingHint')}</div>
                </div>
            ) : (
                <Tree
                    className="order-plan-tree"
                    treeData={treeData}
                    selectedKeys={selectedNode ? [selectedNode.key] : []}
                    expandedKeys={expandedKeys}
                    onSelect={handleSelect}
                    onExpand={setExpandedKeys}
                    titleRender={(nodeData) => (
                        <TreeNodeRenderer
                            key={`${nodeData.key}-${validationVersion}`}
                            nodeData={nodeData}
                            form={form}
                            isSelected={selectedNode?.key === nodeData.key}
                            setSelectedNode={handleSelectedNodeChange}
                            setExpandedKeys={setExpandedKeys}
                        />
                    )}
                    style={{
                        background: 'transparent',
                        margin: 8,
                        overflowX: 'hidden',
                    }}
                />
            )}
        </Space>
    );

    const detailPanel = (
        <DetailPanelRouter
            selectedNode={selectedNode}
            form={form}
            drawingTemplates={drawingTemplates}
            operators={operators}
            isLoadingOperators={isLoadingOperators}
            onQuickCreate={onQuickCreate}
            setSelectedNode={handleSelectedNodeChange}
            setExpandedKeys={setExpandedKeys}
            showTaskReviews={showTaskReviews}
        />
    );

    return (
        <div style={{ marginTop: 16 }}>
            <style jsx global>{`
                .order-plan-tree .ant-tree-treenode {
                    max-width: 100%;
                    width: 100%;
                }

                .order-plan-tree .ant-tree-indent,
                .order-plan-tree .ant-tree-switcher {
                    flex: 0 0 auto;
                }

                .order-plan-tree .ant-tree-node-content-wrapper {
                    min-width: 0;
                    flex: 1;
                    max-width: none;
                    overflow: hidden;
                    padding-inline-end: 0;
                }

                .order-plan-tree .ant-tree-title {
                    display: block;
                    min-width: 0;
                    width: 100%;
                }
            `}</style>
            {/* Toolbar */}
            <Card
                bordered={false}
                style={{
                    marginBottom: 16,
                    background: token.colorBgContainer,
                }}
            >
                <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                    <Flex align="center" gap={16} wrap="wrap">
                        <Title level={5} style={{ margin: 0 }}>
                            {t('orderManagement.form.plan.planConfiguration')}
                        </Title>
                        {!isMobile && <Divider type="vertical" />}
                        <Space size={8} wrap>
                            <Tag color="blue" icon={<FileTextOutlined />}>
                                {t('orderManagement.form.plan.drawingsCount', {
                                    count: stats.drawings,
                                })}
                            </Tag>
                            <Tag color="purple" icon={<NodeIndexOutlined />}>
                                {t('orderManagement.form.plan.stepsCount', { count: stats.steps })}
                            </Tag>
                            <Tag color="green" icon={<CarryOutOutlined />}>
                                {t('orderManagement.form.plan.tasksCount', { count: stats.tasks })}
                            </Tag>
                        </Space>
                    </Flex>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddDrawing}
                    >
                        {t('orderManagement.drawing.add')}
                    </Button>
                </Flex>
            </Card>

            {isMobile ? (
                <Tabs
                    activeKey={activeMobileTab}
                    onChange={(key) => setActiveMobileTab(key as 'tree' | 'details')}
                    items={[
                        {
                            key: 'tree',
                            label: t('orderManagement.form.plan.planConfiguration'),
                            children: (
                                <div
                                    style={{
                                        padding: 12,
                                        background: token.colorBgLayout,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: 8,
                                    }}
                                >
                                    {treePanel}
                                </div>
                            ),
                        },
                        {
                            key: 'details',
                            label: t('common.details'),
                            children: (
                                <div
                                    style={{
                                        background: token.colorBgContainer,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                    }}
                                >
                                    {detailPanel}
                                </div>
                            ),
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
                    {/* Left Tree Panel */}
                    <Sider
                        width="30%"
                        style={{
                            background: token.colorBgLayout,
                            borderRight: `1px solid ${token.colorBorderSecondary}`,
                            padding: 16,
                            minHeight: 600,
                            maxHeight: '70vh',
                            overflowY: 'auto',
                        }}
                    >
                        {treePanel}
                    </Sider>

                    {/* Right Detail Panel */}
                    <Content
                        style={{
                            padding: 24,
                            background: token.colorBgContainer,
                            overflowY: 'auto',
                            maxHeight: '70vh',
                        }}
                    >
                        {detailPanel}
                    </Content>
                </Layout>
            )}
        </div>
    );
};
