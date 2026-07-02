'use client';

import { Button, Descriptions, Modal, Table, Tag, Typography } from 'antd';
import { UploadOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ExcelUpload } from '@/components/shared/ExcelUpload/ExcelUpload';
import { useExcelUpload } from '@/hooks/useExcelUpload';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import { ImportResult, ImportRowError, SkippedDay } from '@/types';

const { Text } = Typography;

interface ImportModalProps {
    open: boolean;
    onClose: () => void;
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
    const { t } = useTranslation();
    const { file, loading, result, setFile, submit, reset } = useExcelUpload<ImportResult>({
        uploadFn: (f) => ProductionPlanService.importFromFile(f),
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    const footer = result ? (
        <Button onClick={handleClose}>{t('common.close')}</Button>
    ) : (
        <>
            <Button onClick={handleClose}>{t('common.cancel')}</Button>
            <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={loading}
                disabled={!file}
                onClick={submit}
            >
                {t('productionPlan.import.upload')}
            </Button>
        </>
    );

    return (
        <Modal
            title={t('productionPlan.import.title')}
            open={open}
            onCancel={handleClose}
            footer={footer}
            width={600}
            destroyOnHidden
        >
            {result ? (
                <ImportResultView result={result} />
            ) : (
                <ExcelUpload
                    onFileSelect={setFile}
                    disabled={loading}
                    hint={t('productionPlan.import.hint')}
                />
            )}
        </Modal>
    );
}

function ImportResultView({ result }: { result: ImportResult }) {
    const { t } = useTranslation();
    const skippedColumns = [
        {
            title: t('productionPlan.import.columns.date'),
            dataIndex: 'date',
            key: 'date',
            width: 130,
        },
        { title: t('productionPlan.import.columns.reason'), dataIndex: 'reason', key: 'reason' },
    ];

    const errorColumns = [
        {
            title: t('productionPlan.import.columns.row'),
            dataIndex: 'rowIndex',
            key: 'rowIndex',
            width: 60,
        },
        {
            title: t('productionPlan.import.columns.date'),
            dataIndex: 'dayLabel',
            key: 'dayLabel',
            width: 80,
        },
        {
            title: t('productionPlan.import.columns.column'),
            dataIndex: 'column',
            key: 'column',
            width: 100,
        },
        { title: t('productionPlan.import.columns.error'), dataIndex: 'message', key: 'message' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label={t('productionPlan.import.result.inserted')}>
                    <Text strong>
                        {t('productionPlan.import.result.records', {
                            count: result.totalInserted,
                        })}
                    </Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('productionPlan.import.result.importedDays')}>
                    {result.importedDays.length > 0 ? (
                        result.importedDays.map((d) => <Tag key={d}>{d}</Tag>)
                    ) : (
                        <Text type="secondary">-</Text>
                    )}
                </Descriptions.Item>
                {result.deferredDays.length > 0 && (
                    <Descriptions.Item label={t('productionPlan.import.result.deferredDays')}>
                        {result.deferredDays.map((d) => (
                            <Tag key={d} color="warning">
                                {d}
                            </Tag>
                        ))}
                    </Descriptions.Item>
                )}
                {result.requiresConfirmation && (
                    <Descriptions.Item label={t('productionPlan.import.result.note')}>
                        <Text type="warning">
                            <WarningOutlined />{' '}
                            {t('productionPlan.import.result.requiresConfirmation')}{' '}
                            <Text code>{result.sessionToken.slice(0, 12)}...</Text>
                        </Text>
                    </Descriptions.Item>
                )}
            </Descriptions>

            {result.skippedDays.length > 0 && (
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        {t('productionPlan.import.result.skippedDays', {
                            count: result.skippedDays.length,
                        })}
                    </Text>
                    <Table<SkippedDay>
                        size="small"
                        dataSource={result.skippedDays}
                        rowKey="date"
                        columns={skippedColumns}
                        pagination={false}
                    />
                </div>
            )}

            {result.errors.length > 0 && (
                <div>
                    <Text strong type="danger" style={{ display: 'block', marginBottom: 8 }}>
                        {t('productionPlan.import.result.errors', {
                            count: result.errors.length,
                        })}
                    </Text>
                    <Table<ImportRowError>
                        size="small"
                        dataSource={result.errors}
                        rowKey={(r) => `${r.rowIndex}-${r.column}-${r.dayLabel}`}
                        columns={errorColumns}
                        pagination={false}
                    />
                </div>
            )}
        </div>
    );
}
