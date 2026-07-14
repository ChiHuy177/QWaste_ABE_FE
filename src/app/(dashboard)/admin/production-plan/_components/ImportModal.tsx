'use client';

import { useState } from 'react';
import { Alert, Button, Modal, Space, Table, Tag, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ExcelUpload } from '@/components/shared/ExcelUpload/ExcelUpload';
import { useExcelUpload } from '@/hooks/useExcelUpload';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import { ImportOption, ImportResult, ImportRowError, SkippedDay } from '@/types';

const { Text } = Typography;

interface ImportModalProps {
    open: boolean;
    onClose: () => void;
    /** Gọi sau khi import ghi dữ liệu thành công để page refetch. */
    onImported?: () => void;
}

export default function ImportModal({ open, onClose, onImported }: ImportModalProps) {
    const { t } = useTranslation();
    const { handleError } = useApiErrorHandler();
    const { file, loading, result, setFile, submit, reset } = useExcelUpload<ImportResult>({
        uploadFn: (f) => ProductionPlanService.importFromFile(f),
        onSuccess: (uploaded) => {
            // Chỉ refetch khi BE đã ghi dữ liệu ngay (không cần bước xác nhận).
            if (!uploaded.requiresConfirmation && uploaded.totalInserted > 0) {
                onImported?.();
            }
        },
    });
    const [confirmResult, setConfirmResult] = useState<ImportResult | null>(null);
    const [confirming, setConfirming] = useState(false);

    const displayedResult = confirmResult ?? result;
    const needsConfirmation = !!displayedResult?.requiresConfirmation && !confirmResult;

    const handleClose = () => {
        reset();
        setConfirmResult(null);
        onClose();
    };

    const handleConfirm = async (option: ImportOption) => {
        if (!displayedResult?.sessionToken) return;
        try {
            setConfirming(true);
            const confirmed = await ProductionPlanService.confirmImport({
                token: displayedResult.sessionToken,
                option,
            });
            setConfirmResult(confirmed);
            if (option !== 'CANCEL') {
                onImported?.();
            }
        } catch (error) {
            handleError(error, { fallbackKey: 'productionPlan.import.confirmError' });
        } finally {
            setConfirming(false);
        }
    };

    const footer = needsConfirmation ? (
        <Space wrap>
            <Button onClick={() => handleConfirm('CANCEL')} loading={confirming} danger>
                {t('productionPlan.import.confirmOptions.cancel')}
            </Button>
            <Button onClick={() => handleConfirm('OVERWRITE_RETAIN')} loading={confirming}>
                {t('productionPlan.import.confirmOptions.overwriteRetain')}
            </Button>
            <Button
                type="primary"
                onClick={() => handleConfirm('OVERWRITE_ALL')}
                loading={confirming}
            >
                {t('productionPlan.import.confirmOptions.overwriteAll')}
            </Button>
        </Space>
    ) : displayedResult ? (
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
            {displayedResult ? (
                <ImportResultView result={displayedResult} />
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

/**
 * BE trả import theo kiểu tất-cả-hoặc-không-gì ở cấp cả file (xem
 * ProductionPlanImportServiceImplementation#importFile): có lỗi validate thì
 * totalInserted/importedDays luôn rỗng, nên `errors` và dữ liệu đã ghi không
 * bao giờ cùng khác rỗng trong một response.
 */
type ImportResultState = 'error' | 'confirm' | 'success';

function getResultState(result: ImportResult): ImportResultState {
    if (result.errors.length > 0) return 'error';
    if (result.requiresConfirmation) return 'confirm';
    return 'success';
}

function ImportResultView({ result }: { result: ImportResult }) {
    const { t } = useTranslation();
    const state = getResultState(result);

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
            <ResultBanner state={state} result={result} />

            {state === 'error' && (
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
                        scroll={{ y: 260 }}
                    />
                </div>
            )}

            {state === 'confirm' && result.deferredDays.length > 0 && (
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        {t('productionPlan.import.result.deferredDaysCount', {
                            count: result.deferredDays.length,
                        })}
                    </Text>
                    <Space wrap>
                        {result.deferredDays.map((d) => (
                            <Tag key={d} color="warning">
                                {d}
                            </Tag>
                        ))}
                    </Space>
                </div>
            )}

            {state === 'success' && result.importedDays.length > 0 && (
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        {t('productionPlan.import.result.importedDaysCount', {
                            count: result.importedDays.length,
                        })}
                    </Text>
                    <Space wrap>
                        {result.importedDays.map((d) => (
                            <Tag key={d} color="success">
                                {d}
                            </Tag>
                        ))}
                    </Space>
                </div>
            )}

            {state !== 'error' && result.skippedDays.length > 0 && (
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
        </div>
    );
}

function ResultBanner({ state, result }: { state: ImportResultState; result: ImportResult }) {
    const { t } = useTranslation();

    if (state === 'error') {
        return (
            <Alert
                type="error"
                showIcon
                title={t('productionPlan.import.result.banner.error.title', {
                    count: result.errors.length,
                })}
                description={t('productionPlan.import.result.banner.error.description')}
            />
        );
    }

    if (state === 'confirm') {
        return (
            <Alert
                type="warning"
                showIcon
                title={t('productionPlan.import.result.banner.confirm.title', {
                    count: result.deferredDays.length,
                })}
                description={t('productionPlan.import.result.banner.confirm.description')}
            />
        );
    }

    if (result.totalInserted === 0) {
        return (
            <Alert
                type="warning"
                showIcon
                title={t('productionPlan.import.result.banner.empty.title')}
                description={t('productionPlan.import.result.banner.empty.description')}
            />
        );
    }

    return (
        <Alert
            type="success"
            showIcon
            message={t('productionPlan.import.result.banner.success.title', {
                count: result.totalInserted,
            })}
            description={t('productionPlan.import.result.banner.success.description')}
        />
    );
}
