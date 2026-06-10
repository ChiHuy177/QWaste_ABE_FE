'use client';

import React from 'react';
import { Input, Select, Button, Space, Typography, Row, Col } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { theme } from 'antd';
import { ZoneFilter } from '@/types/Machine';

const { Title } = Typography;
const { Option } = Select;

interface MachineHeaderProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  selectedZone: ZoneFilter;
  onZoneChange: (value: ZoneFilter) => void;
  onAddMachine: () => void;
}

const MachineHeader: React.FC<MachineHeaderProps> = ({
  searchText,
  onSearchChange,
  selectedZone,
  onZoneChange,
  onAddMachine,
}) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  return (
    <Row 
      justify="space-between" 
      align="middle" 
      gutter={[16, 16]}
      style={{ marginBottom: 24 }}
      wrap
    >
      <Col xs={24} sm={12} md={8}>
        <Title 
          level={2} 
          style={{ 
            color: token.colorPrimary, 
            margin: 0,
            fontSize: 28,
            fontWeight: 600
          }}
        >
          {t("machineManagement.header.title")}
        </Title>
      </Col>
      
      <Col xs={24} sm={12} md={16}>
        <Space 
          size="middle" 
          wrap
          style={{ 
            width: '100%', 
            justifyContent: 'flex-end' 
          }}
        >
          <Input
            placeholder={t("machineManagement.filters.searchPlaceholder")}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ 
              width: 280,
              borderRadius: 8
            }}
            size="large"
          />
          
          <Select
            value={selectedZone}
            onChange={onZoneChange}
            style={{ width: 140 }}
            size="large"
          >
            <Option value="all">{t("machineManagement.options.allZones")}</Option>
            <Option value="zone1">{t("machineManagement.options.zone1")}</Option>
            <Option value="zone2">{t("machineManagement.options.zone2")}</Option>
            <Option value="zone3">{t("machineManagement.options.zone3")}</Option>
          </Select>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddMachine}
            size="large"
            style={{
              background: token.colorPrimary,
              borderColor: token.colorPrimary,
              borderRadius: 8,
              fontWeight: 500
            }}
          >
            {t("machineManagement.actions.addMachine")}
          </Button>
        </Space>
      </Col>
    </Row>
  );
};

export default MachineHeader;