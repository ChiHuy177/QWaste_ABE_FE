'use client';

import React from 'react';
import { Button, Col, Row, Select, Space, Tag, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, LaptopOutlined } from '@ant-design/icons';
import {
    MachineDetailMockPayload,
    MachineOeeData,
} from '@/configs/mockData/productionOverviewMockData';
import { KpiCardsSection } from './KpiCardsSection';
import { MachineHourlyOutputChart } from './MachineHourlyOutputChart';
import { Machine7DaysEfficiencyChart } from './Machine7DaysEfficiencyChart';

const { Text, Title } = Typography;

interface MachineDetailViewProps {
    machineDetail: MachineDetailMockPayload;
    machineList: MachineOeeData[];
    onSelectMachine: (machineCode: string) => void;
    onBack: () => void;
}

export const MachineDetailView: React.FC<MachineDetailViewProps> = ({
    machineDetail,
    machineList,
    onSelectMachine,
    onBack,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { info } = machineDetail;

    return (
        <div>
            {/* Machine Header & Switcher Bar */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}
                        style={{ borderRadius: token.borderRadius }}
                    >
                        {t('productionOverview.machineDetail.backToOverview')}
                    </Button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
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
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                                    {info.machineCode}
                                </Title>
                                <Tag
                                    color="blue"
                                    style={{ borderRadius: 6, margin: 0, fontSize: 11 }}
                                >
                                    {info.lineName}
                                </Tag>
                                <Tag
                                    color={info.status === 'RUNNING' ? 'success' : 'error'}
                                    style={{
                                        borderRadius: 6,
                                        margin: 0,
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                >
                                    ●{' '}
                                    {info.status === 'RUNNING'
                                        ? t('productionOverview.machineDetail.statusRunning')
                                        : t('productionOverview.machineDetail.statusStopped')}
                                </Tag>
                                <Tag
                                    color="warning"
                                    style={{
                                        borderRadius: 6,
                                        margin: 0,
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    {machineDetail.kpi.oee.current}%
                                </Tag>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Fast Machine Switcher Dropdown */}
                <Space size={8} align="center">
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                        {t('productionOverview.machineDetail.selectMachine')}:
                    </Text>
                    <Select
                        value={info.machineCode}
                        onChange={onSelectMachine}
                        style={{ width: 160, borderRadius: token.borderRadius }}
                        options={machineList.map((m) => ({
                            label: m.machineCode,
                            value: m.machineCode,
                        }))}
                    />
                </Space>
            </div>

            {/* 4 KPI Cards for this machine */}
            <KpiCardsSection
                data={machineDetail.kpi}
                isMachineView={true}
                machineCode={info.machineCode}
            />

            {/* Charts Section: Timeline Output & 7-Day Efficiency */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <MachineHourlyOutputChart
                        machineCode={info.machineCode}
                        data={machineDetail.outputTimeline}
                        granularity={machineDetail.granularity}
                        hasPlanLine={machineDetail.hasPlanLine}
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <Machine7DaysEfficiencyChart
                        machineCode={info.machineCode}
                        data={machineDetail.recent7DaysEfficiency}
                    />
                </Col>
            </Row>
        </div>
    );
};
