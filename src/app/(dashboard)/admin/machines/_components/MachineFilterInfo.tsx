'use client';

import React from 'react';
import { Flex, Typography, Tag, theme } from 'antd';
import { DatabaseOutlined, FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface MachineFilterInfoProps {
    totalMachines: number;
    displayedMachines: number;
    factoryName?: string;
    zoneCode?: string;
    spacePath?: string[];
    timePeriod?: string;
    isFiltered?: boolean;
}

const MachineFilterInfo: React.FC<MachineFilterInfoProps> = ({
    totalMachines,
    displayedMachines,
    factoryName,
    zoneCode,
    spacePath,
    timePeriod,
    isFiltered = false,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    return (
        <Flex
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={12}
            style={{
                padding: '12px 16px',
                background: token.colorFillQuaternary,
                borderRadius: 8,
                marginBottom: 24,
                border: `1px solid ${token.colorBorderSecondary}`,
            }}
        >
            {/* Left side - Machine count */}
            <Flex align="center" gap={8}>
                <DatabaseOutlined
                    style={{
                        fontSize: 18,
                        color: token.colorPrimary,
                    }}
                />
                <Text
                    strong
                    style={{
                        fontSize: 15,
                        color: token.colorText,
                    }}
                >
                    {isFiltered ? (
                        <>
                            {t('machineManagement.filterInfo.showing', 'Showing')}{' '}
                            <span
                                style={{
                                    color: token.colorPrimary,
                                    fontSize: 16,
                                    fontWeight: 700,
                                }}
                            >
                                {displayedMachines}
                            </span>{' '}
                            {t('machineManagement.filterInfo.of', 'of')}{' '}
                            <span style={{ color: token.colorTextSecondary }}>
                                {totalMachines}
                            </span>{' '}
                            {t('machineManagement.filterInfo.machines', 'machines')}
                        </>
                    ) : (
                        <>
                            <span
                                style={{
                                    color: token.colorPrimary,
                                    fontSize: 16,
                                    fontWeight: 700,
                                }}
                            >
                                {totalMachines}
                            </span>{' '}
                            {t('machineManagement.filterInfo.machines', 'machines')}
                        </>
                    )}
                </Text>
            </Flex>

            {/* Right side - Filter tags */}
            <Flex align="center" gap={8} wrap="wrap">
                <FilterOutlined
                    style={{
                        fontSize: 14,
                        color: token.colorTextTertiary,
                    }}
                />
                
                {spacePath && spacePath.length > 0 ? (
                    spacePath.map((pathName, index) => {
                        const colors = ['blue', 'cyan', 'geekblue', 'processing', 'magenta'];
                        return (
                            <Tag
                                key={index}
                                color={colors[index % colors.length]}
                                style={{
                                    margin: 0,
                                    fontSize: 13,
                                    padding: '2px 10px',
                                    borderRadius: 6,
                                }}
                            >
                                {pathName}
                            </Tag>
                        );
                    })
                ) : (
                    <>
                        {factoryName && (
                            <Tag
                                color="blue"
                                style={{
                                    margin: 0,
                                    fontSize: 13,
                                    padding: '2px 10px',
                                    borderRadius: 6,
                                }}
                            >
                                {factoryName}
                            </Tag>
                        )}
                        {zoneCode && (
                            <Tag
                                color="cyan"
                                style={{
                                    margin: 0,
                                    fontSize: 13,
                                    padding: '2px 10px',
                                    borderRadius: 6,
                                }}
                            >
                                {zoneCode}
                            </Tag>
                        )}
                    </>
                )}

                {timePeriod && (
                    <Tag
                        color="purple"
                        style={{
                            margin: 0,
                            fontSize: 13,
                            padding: '2px 10px',
                            borderRadius: 6,
                        }}
                    >
                        {timePeriod}
                    </Tag>
                )}
            </Flex>
        </Flex>
    );
};

export default MachineFilterInfo;
