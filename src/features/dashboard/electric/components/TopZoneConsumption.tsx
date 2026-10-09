'use client';
import { theme } from 'antd';
import React from 'react';
import { Card, Flex, Typography, Grid } from 'antd';
import { EnergyConsumption } from '@/types';
import { useTranslation } from 'react-i18next';
import { formatCurrencyShort, calculateElectricityBill } from '@/utils';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface TopZoneConsumptionProps {
    zones: EnergyConsumption[];
}

const TopZoneConsumption: React.FC<TopZoneConsumptionProps> = ({ zones }) => {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const { token } = theme.useToken();

    const isSmall = !screens.md;

    const topZones = React.useMemo(() => {
        return [...zones]
            .sort(
                (a, b) =>
                    b.filterConsumptionResult.totalAllConsumption -
                    a.filterConsumptionResult.totalAllConsumption
            )
            .slice(0, 5);
    }, [zones]);

    if (zones.length === 0) {
        return (
            <Card
                variant="borderless"
                style={{
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                    marginBottom: 24,
                    border: '1px solid rgba(0, 64, 156, 0.1)',
                    height: '100%',
                }}
            >
                <Text type="secondary">{t('electricManagement.noData')}</Text>
            </Card>
        );
    }

    return (
        <Card
            variant="borderless"
            style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                marginBottom: 24,
                border: '1px solid rgba(0, 64, 156, 0.1)',
                height: '100%',
            }}
        >
            <Text
                strong
                style={{
                    fontSize: 16,
                    marginBottom: 16,
                    display: 'block',
                    color: token.colorPrimary,
                }}
            >
                {t('electricManagement.topZoneConsumption')}
            </Text>

            <Flex vertical gap={10}>
                {topZones.map((zone, index) => {
                    const consumption = zone.filterConsumptionResult.totalAllConsumption;
                    const bill = calculateElectricityBill(consumption);

                    return (
                        <div
                            key={zone.entityId}
                            style={{
                                padding: isSmall ? '10px 12px' : '12px 16px',
                                background: token.colorBgLayout,
                                borderRadius: 8,
                                border: `1px solid ${token.colorBorderSecondary}`,
                            }}
                        >
                            {/* Dòng 1: Rank + Zone Name */}
                            <Flex align="center" gap={8} style={{ marginBottom: 6 }}>
                                <Text
                                    strong
                                    style={{
                                        fontSize: isSmall ? 14 : 15,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: token.colorText,
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                    title={zone.entityName}
                                >
                                    {zone.entityName}
                                </Text>
                            </Flex>

                            {/* Dòng 2: kWh + VND */}
                            <Flex
                                align="center"
                                justify="space-between"
                                style={{ paddingLeft: 30 }}
                            >
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: isSmall ? 12 : 13,
                                    }}
                                >
                                    {consumption.toLocaleString('en-US')} kWh
                                </Text>

                                <Text
                                    strong
                                    style={{
                                        fontSize: isSmall ? 15 : 16,
                                        color: token.colorPrimary,
                                    }}
                                >
                                    {formatCurrencyShort(bill)} đ
                                </Text>
                            </Flex>
                        </div>
                    );
                })}
            </Flex>
        </Card>
    );
};

export default TopZoneConsumption;
