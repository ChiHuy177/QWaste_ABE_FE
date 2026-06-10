'use client';
import {
    AppstoreOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Spin, theme } from 'antd';
import { MainPagination } from './_components/MainPagination';
import { MetricCard } from './_components/MetricCard';
import { TaskGrid } from './_components/TaskGrid';
import { UserService } from '@/services/UserService';
import { DemoUserService, USE_MOCK_USERS } from '@/mockData/admin/users';
import { UserProfile } from '@/types/User';
import { usePageTitle } from '@/hooks/usePageTitle';
import { generateMockTasks } from './mockTaskData';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';

const activeUserService = USE_MOCK_USERS ? DemoUserService : UserService;

const OperatorDashboard = () => {
    const [mainPage, setMainPage] = useState(1);
    const [columnPages, setColumnPages] = useState<Record<number, number>>({});
    const [operators, setOperators] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const { token } = theme.useToken();
    usePageTitle(t('pageTitle.operator'));

    // Fetch operators on component mount
    useEffect(() => {
        const fetchOperators = async () => {
            try {
                setLoading(true);
                const data = await activeUserService.getOperators();
                setOperators(data);
            } catch (error) {
                console.error('Error fetching operators:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOperators();
    }, []);

    const COLUMNS_PER_PAGE = 3;
    const TASKS_PER_PAGE = 2;

    const metrics = [
        {
            title: 'Total Task',
            value: 96,
            icon: AppstoreOutlined,
            borderColor: '#1890ff',
            backgroundColor: '#e6f7ff',
        },
        {
            title: 'Waiting QC',
            value: 24,
            icon: ClockCircleOutlined,
            borderColor: '#fa8c16',
            backgroundColor: '#fff7e6',
        },
        {
            title: 'Completed Task',
            value: 58,
            icon: CheckCircleOutlined,
            borderColor: '#52c41a',
            backgroundColor: '#f6ffed',
        },
        {
            title: 'Disapproved',
            value: 14,
            icon: CloseCircleOutlined,
            borderColor: '#ff4d4f',
            backgroundColor: '#fff1f0',
        },
    ];

    // Calculate total pages for main pagination
    const totalMainPages = Math.ceil(operators.length / COLUMNS_PER_PAGE);

    // Get columns for current main page
    const startIndex = (mainPage - 1) * COLUMNS_PER_PAGE;
    const endIndex = startIndex + COLUMNS_PER_PAGE;
    const currentPageUsers = operators.slice(startIndex, endIndex);

    // Cache mock tasks per operator to prevent regeneration on every render
    const operatorTasks = useMemo(() => {
        const tasksMap: Record<string, any[]> = {};
        operators.forEach((op) => {
            tasksMap[op.userId] = generateMockTasks(op.userId);
        });
        return tasksMap;
    }, [operators]);

    // Prepare columns with pagination
    const columns = currentPageUsers.map((user, localIndex) => {
        const globalIndex = startIndex + localIndex;
        const currentPage = columnPages[globalIndex] || 1;
        // Get cached mock tasks for this operator
        const allTasks = operatorTasks[user.userId] || [];
        const totalPages = Math.max(1, Math.ceil(allTasks.length / TASKS_PER_PAGE));

        // Get tasks for current page
        const taskStartIndex = (currentPage - 1) * TASKS_PER_PAGE;
        const taskEndIndex = taskStartIndex + TASKS_PER_PAGE;
        const visibleTasks = allTasks.slice(taskStartIndex, taskEndIndex);

        return {
            userName: user.fullname,
            tasks: visibleTasks,
            currentPage: currentPage,
            totalPages: totalPages,
        };
    });

    const handleColumnPageChange = (columnIndex: number, page: number) => {
        // Calculate the global index
        const globalIndex = startIndex + columnIndex;

        setColumnPages((prev) => ({
            ...prev,
            [globalIndex]: page,
        }));
    };

    const handleMainPageChange = (page: number) => {
        setMainPage(page);
    };

    if (loading) {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            <ResponsivePageHeader
                title={t('staffManagement.staffOverview') + ' ' + t('common.developing')}
            />

            {/* Metrics Grid */}
            <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
                {metrics.map((metric, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <MetricCard
                            title={metric.title}
                            value={metric.value}
                            icon={metric.icon}
                            borderColor={metric.borderColor}
                            backgroundColor={metric.backgroundColor}
                        />
                    </Col>
                ))}
            </Row>

            {/* Task Grid and Pagination Container */}
            <div
                style={{
                    padding: 24,
                    background: token.colorBgContainer,
                    borderRadius: 8,
                    boxShadow:
                        '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 'calc(100vh - 300px)',
                }}
            >
                {/* Task Grid */}
                <div style={{ flex: 1 }}>
                    <TaskGrid columns={columns} onColumnPageChange={handleColumnPageChange} />
                </div>

                {/* Main Pagination */}
                <div
                    style={{
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: `1px solid ${token.colorBorder}`,
                    }}
                >
                    <MainPagination
                        currentPage={mainPage}
                        totalPages={totalMainPages}
                        onPageChange={handleMainPageChange}
                    />
                </div>
            </div>
        </>
    );
};

export default OperatorDashboard;
