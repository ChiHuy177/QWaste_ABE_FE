'use client';

import { Flex, Typography, theme } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface EmptyChartProps {
    message?: string;
}

export default function EmptyChart({ message }: EmptyChartProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={12}
            style={{
                padding: '40px 20px',
                minHeight: 200,
            }}
        >
            <InboxOutlined
                style={{
                    fontSize: 48,
                    color: token.colorTextDisabled,
                }}
            />
            <Text
                type="secondary"
                style={{
                    fontSize: 14,
                    textAlign: 'center',
                }}
            >
                {message || t('adminPage.chart.noData', 'Không có dữ liệu')}
            </Text>
        </Flex>
    );
}
