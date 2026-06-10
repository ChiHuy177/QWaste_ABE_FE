'use client';

import { Button, Flex, Grid, Input, Select, Typography, theme } from 'antd';
import { FilterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { OperatorTaskPriority } from '@/hooks/kanban/useKanbanTasks';
import { useTranslation } from 'react-i18next';
import { getTaskPriorityTheme } from './taskTheme';
import { useMemo } from 'react';

const { useBreakpoint } = Grid;
const { Text } = Typography;
const PRIORITY_LEGEND: OperatorTaskPriority[] = ['high', 'medium', 'low'];

interface TaskFiltersProps {
    searchText: string;
    onSearchChange: (value: string) => void;
    priority: OperatorTaskPriority | 'all';
    onPriorityChange: (value: OperatorTaskPriority | 'all') => void;
    onReset: () => void;
}

export function TaskFilters({
    searchText,
    onSearchChange,
    priority,
    onPriorityChange,
    onReset,
}: TaskFiltersProps) {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const priorityTheme = useMemo(() => getTaskPriorityTheme(token), [token]);

    return (
        <div
            style={{
                borderRadius: 16,
                marginBottom: 20,
                padding: '16px 20px',
                boxShadow: token.boxShadowTertiary,
                border: `1px solid ${token.colorBorderSecondary}`,
                background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorBgElevated} 100%)`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
            }}
        >
            <Flex align="center" gap={12} wrap="wrap">
                <div style={{ flex: 1, minWidth: isMobile ? '100%' : 250 }}>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder={t('operatorTasks.filters.searchPlaceholder')}
                        value={searchText}
                        onChange={(e) => onSearchChange(e.target.value)}
                        allowClear
                    />
                </div>

                <Flex
                    align="center"
                    gap={8}
                    wrap="wrap"
                    style={{ flex: isMobile ? '1 1 100%' : undefined }}
                >
                    <FilterOutlined style={{ color: token.colorTextTertiary }} />
                    <Select
                        value={priority}
                        onChange={onPriorityChange}
                        style={{ width: isMobile ? 'calc(50% - 16px)' : 160 }}
                        options={[
                            { value: 'all', label: t('operatorTasks.filters.allPriority') },
                            { value: 'high', label: t('operatorTasks.priority.high') },
                            { value: 'medium', label: t('operatorTasks.priority.medium') },
                            { value: 'low', label: t('operatorTasks.priority.low') },
                        ]}
                    />
                    <Button icon={<ReloadOutlined />} onClick={onReset}>
                        {t('common.reset')}
                    </Button>
                </Flex>

                <Flex
                    align="center"
                    gap={8}
                    wrap="wrap"
                    style={{
                        marginLeft: isMobile ? 0 : 'auto',
                        flex: isMobile ? '1 1 100%' : undefined,
                    }}
                >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('operatorTasks.legend.cardAccent')}
                    </Text>
                    {PRIORITY_LEGEND.map((priorityLevel) => (
                        <Flex align="center" gap={5} key={priorityLevel}>
                            <span
                                style={{
                                    width: 18,
                                    height: 4,
                                    borderRadius: 999,
                                    background: priorityTheme[priorityLevel].accent,
                                    display: 'inline-block',
                                }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {t(`operatorTasks.priority.${priorityLevel}`)}
                            </Text>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </div>
    );
}
