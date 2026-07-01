import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProductionStatus } from './types';

interface ProductStatusBadgeProps {
    status: ProductionStatus;
}

const STATUS_COLOR: Record<ProductionStatus, string> = {
    TODO: 'default',
    IN_PROGRESS: 'processing',
    PAUSE: 'warning',
    COMPLETE: 'success',
};

export default function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
    const { t } = useTranslation();
    return (
        <Tag color={STATUS_COLOR[status]} style={{ margin: 0 }}>
            {t(`productionPlan.monitor.status.${status}`)}
        </Tag>
    );
}
