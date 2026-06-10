'use client';

import React, { useEffect, useState } from 'react';
import { Select, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { UserService } from '@/services/UserService';
import { UserForPickingByRole } from '@/types/User';
import { DemoOrderService, USE_MOCK_ORDERS } from '@/mockData/admin/orders';

interface OperatorSelectorProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    operators?: any[];
    isLoadingOperators?: boolean;
}

export const OperatorSelector: React.FC<OperatorSelectorProps> = ({
    value,
    onChange,
    placeholder,
    disabled = false,
    className,
    operators: operatorsProp,
    isLoadingOperators: isLoadingOperatorsProp,
}) => {
    const { t } = useTranslation();
    const [operatorsLocal, setOperatorsLocal] = useState<UserForPickingByRole[]>([]);
    const [loadingLocal, setLoadingLocal] = useState(false);

    // Use props if provided, otherwise fetch locally (backward compatibility)
    const operators = operatorsProp || operatorsLocal;
    const loading = isLoadingOperatorsProp !== undefined ? isLoadingOperatorsProp : loadingLocal;

    useEffect(() => {
        // Only fetch if operators not provided via props
        if (operatorsProp) return;

        const fetchOperators = async () => {
            try {
                setLoadingLocal(true);
                const data = USE_MOCK_ORDERS
                    ? await DemoOrderService.getOperators()
                    : await UserService.getUsersByRole('OPERATOR');
                setOperatorsLocal(data);
            } catch (error) {
                console.error('Failed to fetch operators:', error);
                setOperatorsLocal([]);
            } finally {
                setLoadingLocal(false);
            }
        };

        fetchOperators();
    }, [operatorsProp]);

    return (
        <Select
            mode="multiple"
            value={value}
            onChange={onChange}
            placeholder={placeholder || t('orderManagement.task.selectOperatorPlaceholder')}
            disabled={disabled || loading}
            className={className}
            showSearch
            filterOption={(input, option) =>
                (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={loading ? <Spin size="small" /> : t('orderManagement.task.noOperatorFound')}
            options={operators.map((op) => ({
                value: op.userId,
                label: `${op.userCode} - ${op.fullname}`,
            }))}
            style={{ width: '100%' }}
        />
    );
};
