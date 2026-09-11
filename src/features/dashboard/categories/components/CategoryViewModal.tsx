'use client';

import { Modal, Skeleton, Image, Typography, Divider, theme } from 'antd';
import { CalendarOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { cloneElement } from 'react';
import type { ReactNode, ReactElement, CSSProperties } from 'react';
import type { AuditMetaData } from '@/types/Metadata';

const { Text } = Typography;

export type CategoryViewItem = {
    key: string;
    label: string;
    children: ReactNode;
    icon?: ReactNode;
    /** 24 = stacked (label top, value below), default = inline (label left, value right) */
    span?: number;
};

type CategoryViewModalProps = {
    open: boolean;
    title?: ReactNode;
    items: CategoryViewItem[];
    auditMetaData?: AuditMetaData | null;
    onClose: () => void;
    t: (key: string) => string;
    width?: number | string;
    imageUrl?: string;
    imageAlt?: string;
    loading?: boolean;
    isMobile?: boolean;
    sectionLabel?: string;
    embedInTab?: boolean;
};

type CompactRowProps = {
    icon?: ReactNode;
    label: string;
    value: ReactNode;
    stacked?: boolean;
    isLast?: boolean;
};

const SectionHeader = ({
    label,
    token,
}: {
    label: string;
    token: ReturnType<typeof theme.useToken>['token'];
}) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div
            style={{
                width: 3,
                height: 14,
                borderRadius: 2,
                background: token.colorPrimary,
                flexShrink: 0,
            }}
        />
        <Text
            type="secondary"
            style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            }}
        >
            {label}
        </Text>
    </div>
);

const CompactRow = ({ icon, label, value, stacked = false, isLast = false }: CompactRowProps) => {
    const { token } = theme.useToken();
    const rowStyle: React.CSSProperties = {
        padding: '10px 2px',
        borderBottom: isLast ? 'none' : `1px solid ${token.colorBorderSecondary}`,
    };
    const labelNode = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon && (
                <span style={{ color: token.colorPrimary, fontSize: 13, lineHeight: 1 }}>
                    {icon}
                </span>
            )}
            <Text
                type="secondary"
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                }}
            >
                {label}
            </Text>
        </div>
    );

    if (stacked) {
        return (
            <div style={rowStyle}>
                <div style={{ marginBottom: 6 }}>{labelNode}</div>
                <div
                    style={{
                        fontSize: 14,
                        color: token.colorText,
                        lineHeight: 1.6,
                        paddingLeft: 4,
                    }}
                >
                    {value}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                ...rowStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
            }}
        >
            {labelNode}
            <div style={{ fontSize: 14, color: token.colorText }}>{value}</div>
        </div>
    );
};

const SkeletonRows = () => {
    const { token } = theme.useToken();
    return (
        <div>
            {[1, 2, 3, 4].map((i, idx) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 2px',
                        borderBottom: idx < 3 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                    }}
                >
                    <Skeleton.Input active style={{ width: 120, height: 14 }} />
                    <Skeleton.Input active style={{ width: 80, height: 14 }} />
                </div>
            ))}
        </div>
    );
};

export const CategoryViewModal = ({
    open,
    title,
    items,
    auditMetaData,
    onClose,
    t,
    width,
    imageUrl,
    imageAlt,
    loading = false,
    isMobile = false,
    sectionLabel,
    embedInTab = false,
}: CategoryViewModalProps) => {
    const { token } = theme.useToken();
    const resolvedWidth = width ?? (isMobile ? '95%' : 620);

    const auditRows: CompactRowProps[] = auditMetaData
        ? [
              {
                  icon: <CalendarOutlined />,
                  label: t('common.auditInfo.createdAt'),
                  value: auditMetaData.createdAt
                      ? dayjs(auditMetaData.createdAt).format('DD/MM/YYYY HH:mm:ss')
                      : '-',
              },
              {
                  icon: <UserOutlined />,
                  label: t('common.auditInfo.createdBy'),
                  value: auditMetaData.createdBy || '-',
              },
              {
                  icon: <CalendarOutlined />,
                  label: t('common.auditInfo.updatedAt'),
                  value: auditMetaData.updatedAt
                      ? dayjs(auditMetaData.updatedAt).format('DD/MM/YYYY HH:mm:ss')
                      : '-',
              },
              {
                  icon: <UserOutlined />,
                  label: t('common.auditInfo.updatedBy'),
                  value: auditMetaData.updatedBy || '-',
              },
          ]
        : [];

    const mainContent = loading ? (
        <SkeletonRows />
    ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {imageUrl && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                        style={{
                            borderRadius: 14,
                            overflow: 'hidden',
                            border: `1px solid ${token.colorBorderSecondary}`,
                            background: token.colorFillQuaternary,
                            width: 160,
                            height: 160,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            width={160}
                            height={160}
                            style={{ objectFit: 'contain' }}
                            preview={{
                                imageRender: (originalNode) => {
                                    const node = originalNode as ReactElement<{
                                        style?: CSSProperties;
                                    }>;
                                    return cloneElement(node, {
                                        style: {
                                            ...node.props.style,
                                            background: token.colorBgContainer,
                                        },
                                    });
                                },
                            }}
                        />
                    </div>
                </div>
            )}

            {items.length > 0 && (
                <div>
                    {sectionLabel && <SectionHeader label={sectionLabel} token={token} />}
                    {items.map((item, idx) => (
                        <CompactRow
                            key={item.key}
                            icon={item.icon}
                            label={item.label}
                            value={item.children}
                            stacked={item.span === 24}
                            isLast={idx === items.length - 1}
                        />
                    ))}
                </div>
            )}

            {auditMetaData && (
                <>
                    <Divider style={{ margin: 0 }} />
                    <div>
                        <SectionHeader label={t('common.auditInfo.title')} token={token} />
                        {auditRows.map((row, idx) => (
                            <CompactRow
                                key={idx}
                                icon={row.icon}
                                label={row.label}
                                value={row.value}
                                isLast={idx === auditRows.length - 1}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    if (embedInTab) {
        return mainContent;
    }

    return (
        <Modal
            title={title}
            open={open}
            onCancel={onClose}
            footer={null}
            width={resolvedWidth}
            styles={{ body: { paddingTop: 12 } }}
            destroyOnHidden
        >
            {mainContent}
        </Modal>
    );
};
