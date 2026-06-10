'use client';

import { Descriptions, Modal, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import type { AuditMetaData } from '@/types/Metadata';

const { Text, Title } = Typography;

export type CategoryViewItem = {
    key: string;
    label: ReactNode;
    children: ReactNode;
    span?: number;
};

type CategoryViewModalProps = {
    open: boolean;
    title?: ReactNode;
    items: CategoryViewItem[];
    auditMetaData?: AuditMetaData | null;
    onClose: () => void;
    t: (key: string) => string;
    width?: number;
};

export const CategoryViewModal = ({
    open,
    title,
    items,
    auditMetaData,
    onClose,
    t,
    width = 720,
}: CategoryViewModalProps) => {
    return (
        <Modal
            title={title}
            open={open}
            onCancel={onClose}
            footer={null}
            width={width}
            destroyOnHidden
        >
            <Descriptions bordered column={1} size="middle">
                {items.map((item) => (
                    <Descriptions.Item key={item.key} label={item.label} span={item.span}>
                        {item.children}
                    </Descriptions.Item>
                ))}
            </Descriptions>

            {auditMetaData && (
                <>
                    <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
                        {t('common.auditInfo.title')}
                    </Title>
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label={t('common.auditInfo.createdAt')}>
                            <Text type="secondary">
                                {auditMetaData.createdAt
                                    ? dayjs(auditMetaData.createdAt).format('DD/MM/YYYY HH:mm:ss')
                                    : '-'}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('common.auditInfo.createdBy')}>
                            <Text type="secondary">{auditMetaData.createdBy || '-'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('common.auditInfo.updatedAt')}>
                            <Text type="secondary">
                                {auditMetaData.updatedAt
                                    ? dayjs(auditMetaData.updatedAt).format('DD/MM/YYYY HH:mm:ss')
                                    : '-'}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('common.auditInfo.updatedBy')}>
                            <Text type="secondary">{auditMetaData.updatedBy || '-'}</Text>
                        </Descriptions.Item>
                    </Descriptions>
                </>
            )}
        </Modal>
    );
};
