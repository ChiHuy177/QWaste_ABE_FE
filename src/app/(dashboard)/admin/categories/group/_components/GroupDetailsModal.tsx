'use client';
import {
    Modal,
    Form,
    Input,
    Button,
    Descriptions,
    Space,
    Spin,
    Typography,
    Divider,
    Skeleton,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { UserGroup } from '@/types/UserGroup';
import dayjs from 'dayjs';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface GroupDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: number;
    mode: 'view' | 'edit';
    onSuccess?: () => void;
    fetchGroupDetails: (groupId: number) => Promise<UserGroup>;
    updateGroup: (data: UserGroup) => Promise<string>;
}

export const GroupDetailsModal = ({
    open,
    onOpenChange,
    groupId,
    mode: initialMode,
    onSuccess,
    fetchGroupDetails,
    updateGroup,
}: GroupDetailsModalProps) => {
    const { t } = useTranslation();
    const [form] = Form.useForm<UserGroup>();
    const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [groupData, setGroupData] = useState<UserGroup | null>(null);

    // Fetch group details
    useEffect(() => {
        if (open && groupId) {
            loadGroupDetails();
        }
    }, [open, groupId]);

    const loadGroupDetails = async () => {
        try {
            setLoading(true);
            const data = await fetchGroupDetails(groupId);
            setGroupData(data);
            form.setFieldsValue({
                groupName: data.groupName,
                description: data.description,
            });
        } catch (error) {
            console.error('Error fetching group details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setMode(initialMode);
        onOpenChange(false);
    };

    const handleEdit = () => {
        setMode('edit');
    };

    const onSubmit = async (values: UserGroup) => {
        try {
            setIsSubmitting(true);
            await updateGroup({
                ...values,
                groupId: groupId,
            });
            onSuccess?.();
            setMode('view');
            loadGroupDetails();
        } catch (error) {
            console.error('Error updating group:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderViewMode = () => {
        return (
            <div>
                <Descriptions bordered column={1} size="middle">
                    <Descriptions.Item label={t('groupManagement.form.fields.groupId')}>
                        {groupData ? (
                            <Text strong>{groupData.groupId}</Text>
                        ) : (
                            <Skeleton.Input active size="small" style={{ width: 150 }} />
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('groupManagement.form.fields.groupName')}>
                        {groupData ? (
                            <Text strong>{groupData.groupName}</Text>
                        ) : (
                            <Skeleton.Input active size="small" style={{ width: 200 }} />
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('groupManagement.form.fields.description')}>
                        {groupData ? (
                            <Text>{groupData.description}</Text>
                        ) : (
                            <Skeleton.Input active size="small" style={{ width: '100%' }} />
                        )}
                    </Descriptions.Item>
                </Descriptions>

                {groupData?.auditMetaData && (
                    <>
                        <Divider />
                        <Title level={5} style={{ marginBottom: 16 }}>
                            {t('groupManagement.auditInfo.title')}
                        </Title>
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item
                                label={t('groupManagement.auditInfo.createdAt')}
                                span={2}
                            >
                                <Text type="secondary">
                                    {groupData.auditMetaData.createdAt
                                        ? dayjs(groupData.auditMetaData.createdAt).format(
                                              'DD/MM/YYYY HH:mm:ss'
                                          )
                                        : '-'}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('groupManagement.auditInfo.createdBy')}
                                span={2}
                            >
                                <Text type="secondary">
                                    {groupData.auditMetaData.createdBy || '-'}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('groupManagement.auditInfo.updatedAt')}
                                span={2}
                            >
                                <Text type="secondary">
                                    {groupData.auditMetaData.updatedAt
                                        ? dayjs(groupData.auditMetaData.updatedAt).format(
                                              'DD/MM/YYYY HH:mm:ss'
                                          )
                                        : '-'}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('groupManagement.auditInfo.updatedBy')}
                                span={2}
                            >
                                <Text type="secondary">
                                    {groupData.auditMetaData.updatedBy || '-'}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </>
                )}
            </div>
        );
    };
    const renderEditMode = () => {
        return (
            <Form form={form} layout="vertical" onFinish={onSubmit} disabled={isSubmitting}>
                <Form.Item label={t('groupManagement.form.fields.groupId')}>
                    <Input value={groupData?.groupId} disabled size="large" />
                </Form.Item>

                <Form.Item
                    label={t('groupManagement.form.fields.groupName')}
                    name="groupName"
                    rules={[
                        {
                            required: true,
                            message: t('groupManagement.form.validation.required'),
                        },
                        {
                            min: 3,
                            message: t('groupManagement.form.validation.minLength', { min: 3 }),
                        },
                        {
                            max: 100,
                            message: t('groupManagement.form.validation.maxLength', { max: 100 }),
                        },
                    ]}
                >
                    <Input
                        placeholder={t('groupManagement.form.placeholders.groupName')}
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    label={t('groupManagement.form.fields.description')}
                    name="description"
                    rules={[
                        {
                            required: true,
                            message: t('groupManagement.form.validation.required'),
                        },
                        {
                            min: 10,
                            message: t('groupManagement.form.validation.minLength', { min: 10 }),
                        },
                        {
                            max: 500,
                            message: t('groupManagement.form.validation.maxLength', { max: 500 }),
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={t('groupManagement.form.placeholders.description')}
                        size="large"
                        rows={4}
                        showCount
                        maxLength={500}
                    />
                </Form.Item>
            </Form>
        );
    };

    const getModalTitle = () => {
        if (mode === 'view') {
            return (
                <Space>
                    <EyeOutlined />
                    {t('groupManagement.form.viewTitle')}
                </Space>
            );
        }
        return (
            <Space>
                <EditOutlined />
                {t('groupManagement.form.editTitle')}
            </Space>
        );
    };

    const getFooter = () => {
        if (mode === 'view') {
            return [
                <Button key="close" onClick={handleCancel} size="large">
                    {t('groupManagement.form.buttons.close')}
                </Button>,
                <Button key="edit" type="primary" onClick={handleEdit} size="large">
                    {t('groupManagement.form.buttons.edit')}
                </Button>,
            ];
        }

        return [
            <Button key="cancel" onClick={handleCancel} disabled={isSubmitting} size="large">
                {t('groupManagement.form.buttons.cancel')}
            </Button>,
            <Button
                key="submit"
                type="primary"
                loading={isSubmitting}
                onClick={() => form.submit()}
                size="large"
            >
                {isSubmitting
                    ? t('groupManagement.form.buttons.saving')
                    : t('groupManagement.form.buttons.save')}
            </Button>,
        ];
    };

    return (
        <Modal
            title={getModalTitle()}
            open={open}
            onCancel={handleCancel}
            width={700}
            footer={getFooter()}
            destroyOnHidden
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <div style={{ marginTop: 24 }}>
                    {mode === 'view' ? renderViewMode() : renderEditMode()}
                </div>
            )}
        </Modal>
    );
};
