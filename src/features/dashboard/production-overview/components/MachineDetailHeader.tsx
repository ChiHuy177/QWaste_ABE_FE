'use client';

import React, { useMemo, useCallback } from 'react';
import { Button, Select, Space, Tag, Tooltip, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, LaptopOutlined } from '@ant-design/icons';
import { MachineListItem } from './MachineDetailView';

const { Text, Title } = Typography;

export interface MachineDetailHeaderProps {
    machineCode: string;
    machineName?: string | null;
    machineList: MachineListItem[];
    isRunning: boolean;
    onSelectMachine: (machineCode: string, machineId?: string) => void;
    onBack: () => void;
}

export const MachineDetailHeader: React.FC<MachineDetailHeaderProps> = React.memo(
    ({ machineCode, machineName, machineList, isRunning, onSelectMachine, onBack }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        const primaryTitle = machineName || machineCode;
        const subCodeTag = machineName && machineName !== machineCode ? machineCode : null;

        const selectOptions = useMemo(() => {
            return machineList.map((m) => {
                const labelText = m.machineName || m.machineCode || 'N/A';
                return {
                    label: (
                        <Tooltip title={labelText} placement="left">
                            <span
                                style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {labelText}
                            </span>
                        </Tooltip>
                    ),
                    value: m.machineCode,
                };
            });
        }, [machineList]);

        const handleSelectChange = useCallback(
            (code: string) => {
                const found = machineList.find((m) => m.machineCode === code);
                onSelectMachine(code, found?.machineId);
            },
            [machineList, onSelectMachine]
        );

        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: token.borderRadiusLG,
                    backgroundColor: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    marginBottom: 16,
                }}
            >
                {/* Left: Back button + Machine Title & Status */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                        minWidth: 0,
                        flex: 1,
                    }}
                >
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}
                        style={{ borderRadius: token.borderRadius }}
                    >
                        {t('productionOverview.machineDetail.backToOverview')}
                    </Button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                borderRadius: 8,
                                backgroundColor: token.colorPrimaryBg,
                                color: token.colorPrimary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                            }}
                        >
                            <LaptopOutlined />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    minWidth: 0,
                                }}
                            >
                                <Tooltip
                                    title={
                                        subCodeTag
                                            ? `${primaryTitle} (${subCodeTag})`
                                            : primaryTitle
                                    }
                                >
                                    <Title
                                        level={4}
                                        style={{
                                            margin: 0,
                                            fontWeight: 800,
                                            maxWidth: 320,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {primaryTitle}
                                    </Title>
                                </Tooltip>
                                {subCodeTag && (
                                    <Tooltip
                                        title={`${t('productionOverview.machineDetail.machineCode', 'Mã máy')}: ${subCodeTag}`}
                                    >
                                        <Tag
                                            color="blue"
                                            style={{
                                                borderRadius: 6,
                                                margin: 0,
                                                fontSize: 11,
                                                maxWidth: 140,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {subCodeTag}
                                        </Tag>
                                    </Tooltip>
                                )}
                                <Tag
                                    color={isRunning ? 'success' : 'error'}
                                    style={{
                                        borderRadius: 6,
                                        margin: 0,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        flexShrink: 0,
                                    }}
                                >
                                    ●{' '}
                                    {isRunning
                                        ? t('productionOverview.machineDetail.statusRunning')
                                        : t('productionOverview.machineDetail.statusStopped')}
                                </Tag>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Fast Machine Switcher Dropdown (with search and machineName prominent) */}
                <Space size={8} align="center" style={{ flexShrink: 0 }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                        {t('productionOverview.machineDetail.selectMachine')}:
                    </Text>
                    <Select
                        showSearch
                        value={machineCode}
                        onChange={handleSelectChange}
                        style={{ width: 260, borderRadius: token.borderRadius }}
                        popupMatchSelectWidth={false}
                        options={selectOptions}
                        filterOption={(input, option) => {
                            const m = machineList.find(
                                (item) => item.machineCode === option?.value
                            );
                            if (!m) return false;
                            const searchTarget =
                                `${m.machineName || ''} ${m.machineCode || ''}`.toLowerCase();
                            return searchTarget.includes(input.toLowerCase());
                        }}
                        styles={{ popup: { root: { minWidth: 280, maxWidth: 440 } } }}
                    />
                </Space>
            </div>
        );
    }
);

MachineDetailHeader.displayName = 'MachineDetailHeader';
