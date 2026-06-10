'use client';

import { Card, Flex, Typography, theme } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ErrorCountChartResponse } from '@/types/Monitoring';
import EmptyChart from './EmptyChart';

const { Text } = Typography;

interface MachineErrorRankingProps {
    data: ErrorCountChartResponse | null;
    loading?: boolean;
}

export default function ErrorTypeDistribution({ data, loading }: MachineErrorRankingProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    // Transform data: sum all error counts per machine
    const chartData = data?.series
        ? data.series
              .map((machine) => {
                  const totalErrors = machine.dataPoints.reduce((sum, dp) => sum + dp.value, 0);
                  return {
                      machineName: machine.machineName,
                      errorCount: totalErrors,
                  };
              })
              .filter((machine) => machine.errorCount > 0) // Only machines with errors
              .sort((a, b) => b.errorCount - a.errorCount)
        : []; // All machines with errors

    const totalErrors = chartData.reduce((sum, machine) => sum + machine.errorCount, 0);

    const getBarColor = (count: number) => {
        if (count > 100) return '#C35256'; // Red
        if (count > 50) return '#C18644'; // Orange
        return '#458A6D'; // Green
    };

    return (
        <Card
            variant="borderless"
            style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                border: '1px solid rgba(0, 64, 156, 0.1)',
                height: '100%',
            }}
        >
            <Flex align="center" justify="space-between" gap={8} style={{ marginBottom: 20 }}>
                <Flex align="center" gap={8}>
                    <WarningOutlined style={{ color: token.colorError, fontSize: 18 }} />
                    <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                        {t('adminPage.errorRanking.title', 'Top Máy Lỗi Nhiều Nhất')}
                    </Text>
                </Flex>
                {chartData.length > 0 && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        {t('adminPage.errorRanking.total', 'Tổng')}: <Text strong>{totalErrors}</Text>
                    </Text>
                )}
            </Flex>

            {chartData.length === 0 ? (
                <EmptyChart message={t('adminPage.errorRanking.noData', 'Không có lỗi nào')} />
            ) : (
                <div style={{ maxHeight: 250, overflowY: 'auto', paddingRight: 4 }}>
                    <Flex vertical gap={12}>
                    {chartData.map((machine, index) => {
                        const maxErrors = chartData[0].errorCount;
                        const barWidth = (machine.errorCount / maxErrors) * 100;
                        const percentageOfTotal = ((machine.errorCount / totalErrors) * 100).toFixed(1);
                        const barColor = getBarColor(machine.errorCount);

                        return (
                            <Flex key={index} vertical gap={4}>
                                <Flex justify="space-between" align="center">
                                    <Flex gap={8} align="center" style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 4,
                                                backgroundColor: token.colorPrimaryBg,
                                                color: token.colorPrimary,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {index + 1}
                                        </div>
                                        <Text
                                            strong
                                            style={{
                                                fontSize: 13,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                            title={machine.machineName}
                                        >
                                            {machine.machineName}
                                        </Text>
                                    </Flex>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 13,
                                            color: barColor,
                                            marginLeft: 8,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {machine.errorCount}{' '}
                                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                                            ({percentageOfTotal}%)
                                        </Text>
                                    </Text>
                                </Flex>
                                <div
                                    style={{
                                        width: '100%',
                                        height: 6,
                                        backgroundColor: token.colorFillSecondary,
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${barWidth}%`,
                                            height: '100%',
                                            backgroundColor: barColor,
                                            borderRadius: 3,
                                            transition: 'width 0.3s ease',
                                        }}
                                    />
                                </div>
                            </Flex>
                        );
                    })}
                </Flex>
                </div>
            )}
        </Card>
    );
}
