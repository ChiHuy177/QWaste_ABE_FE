import React from 'react';
import { Card, Descriptions, Row, Col, Space, Tag, Typography, Divider } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    IdcardOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '@/types/User';

const { Title, Text } = Typography;

interface UserBasicInfoProps {
    user: UserProfile;
}

export const UserBasicInfo: React.FC<UserBasicInfoProps> = ({ user }) => {
    const { t } = useTranslation();

    return (
        <div style={{ padding: '24px 0' }}>
            <Row gutter={[24, 24]}>
                {/* Left Column - User Profile Card */}
                <Col xs={24} lg={8}>
                    <Card variant="borderless" style={{ height: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Title level={3} style={{ marginBottom: 8, marginTop: 0 }}>
                                {user.fullname || user.username}
                            </Title>

                            <Text type="secondary" style={{ fontSize: 16 }}>
                                @{user.username}
                            </Text>

                            <Divider style={{ margin: '20px 0' }} />

                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <div>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                                    >
                                        {t('userManagement.form.userCode.label')}
                                    </Text>
                                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 16px' }}>
                                        {user.userCode || 'N/A'}
                                    </Tag>
                                </div>

                                <div>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                                    >
                                        {t('userManagement.userId')}
                                    </Text>
                                    <Text
                                        copyable={{ text: user.userId }}
                                        style={{ fontSize: 12, fontFamily: 'monospace' }}
                                    >
                                        {user.userId?.substring(0, 8)}...
                                    </Text>
                                </div>
                            </Space>
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Contact Information */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Space>
                                <UserOutlined style={{ fontSize: 18 }} />
                                <span style={{ fontSize: 16, fontWeight: 600 }}>
                                    {t('userManagement.detailInfo')}
                                </span>
                            </Space>
                        }
                        variant="borderless"
                        style={{ height: '100%' }}
                    >
                        <Descriptions column={{ xs: 1, sm: 1, md: 2 }} layout="vertical">
                            <Descriptions.Item
                                label={
                                    <Space>
                                        <MailOutlined />
                                        <span>{t('userManagement.form.email.label')}</span>
                                    </Space>
                                }
                            >
                                <Text copyable={!!user.email} strong>
                                    {user.email || '-'}
                                </Text>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label={
                                    <Space>
                                        <PhoneOutlined />
                                        <span>{t('userManagement.form.phoneNumber.label')}</span>
                                    </Space>
                                }
                            >
                                <Text copyable={!!user.phoneNumber} strong>
                                    {user.phoneNumber || '-'}
                                </Text>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label={
                                    <Space>
                                        <IdcardOutlined />
                                        <span>{t('userManagement.columns.fullName')}</span>
                                    </Space>
                                }
                            >
                                <Text strong>{user.fullname || '-'}</Text>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label={
                                    <Space>
                                        <UserOutlined />
                                        <span>{t('userManagement.form.username.label')}</span>
                                    </Space>
                                }
                            >
                                <Text strong>{user.username || '-'}</Text>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label={
                                    <Space>
                                        <HomeOutlined />
                                        <span>{t('userManagement.form.address.label')}</span>
                                    </Space>
                                }
                                span={2}
                            >
                                <Text>{user.address || '-'}</Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
