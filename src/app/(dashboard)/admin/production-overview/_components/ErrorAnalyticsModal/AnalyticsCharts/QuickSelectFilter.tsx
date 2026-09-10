'use client';

import React from 'react';
import { Button, Dropdown, Select } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface QuickSelectFilterProps {
    allIds: string[];
    selectedIds: string[];
    onChange: (value: string[]) => void;
    options: { label: React.ReactNode; value: string }[];
    top10HighIds: string[];
    top10LowIds: string[];
    placeholder?: string;
    style?: React.CSSProperties;
}

export const QuickSelectFilter: React.FC<QuickSelectFilterProps> = ({
    allIds,
    selectedIds,
    onChange,
    options,
    top10HighIds,
    top10LowIds,
    placeholder,
    style,
}) => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en';

    const limit = top10HighIds.length;

    const highestLabel =
        limit > 0
            ? currentLang.startsWith('vi')
                ? `Top ${limit} cao nhất`
                : `Top ${limit} Highest`
            : t('factoryOverview.filter.top10Highest');

    const lowestLabel =
        limit > 0
            ? currentLang.startsWith('vi')
                ? `Top ${limit} thấp nhất`
                : `Top ${limit} Lowest`
            : t('factoryOverview.filter.top10Lowest');

    const isTop10High =
        top10HighIds.length > 0 &&
        selectedIds.length === top10HighIds.length &&
        top10HighIds.every((id) => selectedIds.includes(id));

    const isTop10Low =
        top10LowIds.length > 0 &&
        selectedIds.length === top10LowIds.length &&
        top10LowIds.every((id) => selectedIds.includes(id));

    return (
        <>
            <style>
                {`
                .quick-select-filter-scroll::-webkit-scrollbar {
                    display: none;
                }
                `}
            </style>
            <div
                className="quick-select-filter-scroll"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexShrink: 0,
                    flexWrap: 'nowrap',
                    justifyContent: 'flex-start',
                    overflowX: 'auto',
                    maxWidth: '100%',
                    paddingBottom: 4,
                    scrollbarWidth: 'none' /* Firefox */,
                    msOverflowStyle: 'none' /* IE and Edge */,
                    ...style,
                }}
            >
                {selectedIds.length < allIds.length && (
                    <Button
                        size="middle"
                        style={{ flexShrink: 0 }}
                        onClick={() => onChange(allIds)}
                    >
                        {t('factoryOverview.filter.selectAll')}
                    </Button>
                )}
                {selectedIds.length > 0 && (
                    <Button size="middle" style={{ flexShrink: 0 }} onClick={() => onChange([])}>
                        {t('factoryOverview.filter.selectNone')}
                    </Button>
                )}
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: 'top10High',
                                label: highestLabel,
                                onClick: () => onChange(top10HighIds),
                            },
                            {
                                key: 'top10Low',
                                label: lowestLabel,
                                onClick: () => onChange(top10LowIds),
                            },
                        ],
                    }}
                    placement="bottomRight"
                >
                    <Button
                        size="middle"
                        type={isTop10High || isTop10Low ? 'primary' : 'default'}
                        style={{ flexShrink: 0 }}
                    >
                        {isTop10High
                            ? highestLabel
                            : isTop10Low
                              ? lowestLabel
                              : t('factoryOverview.filter.quickSelect')}{' '}
                        <DownOutlined />
                    </Button>
                </Dropdown>
                <Select
                    mode="multiple"
                    placeholder={placeholder}
                    size="middle"
                    maxTagCount="responsive"
                    options={options}
                    value={selectedIds}
                    onChange={(value) => onChange(value as string[])}
                    style={{ flex: 1, minWidth: 200, maxWidth: 280 }}
                    popupMatchSelectWidth={false}
                    allowClear
                />
            </div>
        </>
    );
};
