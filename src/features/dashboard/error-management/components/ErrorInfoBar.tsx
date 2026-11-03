'use client';

import React from 'react';
import { Flex, Tag, Typography, theme } from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export interface ErrorInfoBarProps {
    totalIncidents: number;
    activeIncidents: number;
}

export const ErrorInfoBar: React.FC<ErrorInfoBarProps> = ({ totalIncidents, activeIncidents }) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    return (
        <Flex
            align="center"
            wrap="wrap"
            justify="space-between"
            gap={12}
            style={{
                padding: '8px 16px',
                background: token.colorFillQuaternary,
                borderRadius: token.borderRadiusLG,
                marginBottom: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
            }}
        >
            <Flex align="center" gap={8}>
                <InfoCircleOutlined
                    style={{
                        fontSize: 15,
                        color: token.colorPrimary,
                    }}
                />
                <Text
                    strong
                    style={{
                        fontSize: 13.5,
                        color: token.colorText,
                    }}
                >
                    {t('errorManagement.kpi.totalIncidents')}:{' '}
                    <span style={{ color: token.colorPrimary, fontWeight: 700 }}>
                        {totalIncidents}
                    </span>
                </Text>
            </Flex>

            <Flex align="center" gap={8}>
                {activeIncidents > 0 ? (
                    <Tag
                        color="warning"
                        style={{
                            margin: 0,
                            borderRadius: token.borderRadiusSM,
                            padding: '3px 10px',
                            fontWeight: 600,
                            fontSize: 12.5,
                        }}
                    >
                        <ExclamationCircleOutlined style={{ marginRight: 5 }} />
                        {activeIncidents} {t('errorManagement.header.activeIncidents')}
                    </Tag>
                ) : (
                    <Tag
                        color="success"
                        style={{
                            margin: 0,
                            borderRadius: token.borderRadiusSM,
                            padding: '3px 10px',
                            fontWeight: 500,
                        }}
                    >
                        <CheckCircleOutlined style={{ marginRight: 5 }} />
                        {t('errorManagement.statuses.resolved')}
                    </Tag>
                )}
            </Flex>
        </Flex>
    );
};
