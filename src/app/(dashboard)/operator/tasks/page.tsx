'use client';

import { Card, Col, Row, Flex, Grid, theme } from 'antd';
import {
    AppstoreOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useKanbanTasks } from '@/hooks/kanban/useKanbanTasks';
import { OperatorTaskBoard } from './_components/OperatorTaskBoard';
import { TaskDetailModal } from './_components/TaskDetailModal';
import { TaskFilters } from './_components/TaskFilters';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getTaskStatusTheme } from './_components/taskTheme';

const { useBreakpoint } = Grid;

const statusIcon = {
    todo: AppstoreOutlined,
    in_progress: ClockCircleOutlined,
    qc_check: SafetyCertificateOutlined,
    complete: CheckCircleOutlined,
};

export default function OperatorTasksPage() {
    const { t } = useTranslation('common');
    const pageTitle = t('operatorTasks.page.title');
    usePageTitle(pageTitle);
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const {
        board,
        visibleBoard,
        stats,
        searchText,
        setSearchText,
        priorityFilter,
        setPriorityFilter,
        selectedTask,
        setSelectedTaskId,
        moveBoardByEvent,
        replaceBoard,
        resetFilters,
    } = useKanbanTasks();
    const statusTheme = useMemo(() => getTaskStatusTheme(token), [token]);

    const statsConfig = useMemo(
        () =>
            stats.map((stat) => ({
                ...stat,
                icon: statusIcon[stat.status],
                color: statusTheme[stat.status].accent,
                backgroundColor: statusTheme[stat.status].background,
                borderColor: statusTheme[stat.status].border,
            })),
        [stats, statusTheme]
    );

    return (
        <>
            <ResponsivePageHeader
                title={pageTitle}
                icon={<AppstoreOutlined />}
            />

            {/* Stats Cards — matching OrderStatsCards design */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statsConfig.map((stat) => {
                    const IconComponent = stat.icon;
                    const accent = stat.color;

                    return (
                        <Col xs={24} sm={12} lg={6} key={stat.status}>
                            <Card
                                variant="borderless"
                                hoverable
                                style={{
                                    borderRadius: 16,
                                    boxShadow: token.boxShadowTertiary,
                                    height: '100%',
                                    border: `1px solid ${stat.borderColor}`,
                                    background: stat.backgroundColor,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                styles={{
                                    body: { height: '100%' }
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: 90,
                                        height: 90,
                                        background: stat.borderColor,
                                        borderBottomLeftRadius: '100%',
                                        transition: 'all 0.3s ease',
                                    }}
                                />

                                <Flex vertical gap={8} style={{ position: 'relative', zIndex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: token.colorPrimary,
                                        }}
                                    >
                                        {stat.title}
                                    </div>
                                    <Flex align="center" gap={12}>
                                        <div
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: token.colorBgContainer,
                                            }}
                                        >
                                            <IconComponent
                                                style={{
                                                    color: accent,
                                                    fontSize: 24,
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                color: token.colorPrimary,
                                                fontSize: isMobile ? 24 : 32,
                                                fontWeight: 700,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {stat.total.toLocaleString()}
                                        </div>
                                    </Flex>
                                </Flex>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            <TaskFilters
                searchText={searchText}
                onSearchChange={setSearchText}
                priority={priorityFilter}
                onPriorityChange={setPriorityFilter}
                onReset={resetFilters}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} style={{ minWidth: 0 }}>
                    <div
                        style={{
                            borderRadius: 16,
                            background: token.colorBgLayout,
                            padding: 4,
                            maxWidth: '100%',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        <OperatorTaskBoard
                            board={board}
                            visibleBoard={visibleBoard}
                            onOpenTask={setSelectedTaskId}
                            onMoveBoard={moveBoardByEvent}
                            onReplaceBoard={replaceBoard}
                        />
                    </div>
                </Col>
            </Row>

            <TaskDetailModal
                task={selectedTask}
                open={!!selectedTask}
                onClose={() => setSelectedTaskId(null)}
            />
        </>
    );
}
