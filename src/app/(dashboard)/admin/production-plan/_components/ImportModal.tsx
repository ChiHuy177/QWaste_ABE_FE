'use client';

import { Button, Descriptions, Modal, Table, Tag, Typography } from 'antd';
import { UploadOutlined, WarningOutlined } from '@ant-design/icons';
import { ExcelUpload } from '@/components/shared/ExcelUpload/ExcelUpload';
import { useExcelUpload } from '@/hooks/useExcelUpload';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { ImportResult, SkippedDay, ImportRowError } from '@/services/ProductionPlanService';

const { Text } = Typography;

interface ImportModalProps {
    open: boolean;
    onClose: () => void;
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
    const { file, loading, result, setFile, submit, reset } = useExcelUpload<ImportResult>({
        uploadFn: (f) => ProductionPlanService.importFromFile(f),
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    const footer = result ? (
        <Button onClick={handleClose}>Đóng</Button>
    ) : (
        <>
            <Button onClick={handleClose}>Hủy</Button>
            <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={loading}
                disabled={!file}
                onClick={submit}
            >
                Tải lên
            </Button>
        </>
    );

    return (
        <Modal
            title="Import kế hoạch sản xuất"
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
                    hint="File Excel chứa kế hoạch sản xuất — tối đa 10MB"
                />
            )}
        </Modal>
    );
}

function ImportResultView({ result }: { result: ImportResult }) {
    const skippedColumns = [
        { title: 'Ngày', dataIndex: 'date', key: 'date', width: 130 },
        { title: 'Lý do', dataIndex: 'reason', key: 'reason' },
    ];

    const errorColumns = [
        { title: 'Dòng', dataIndex: 'rowIndex', key: 'rowIndex', width: 60 },
        { title: 'Ngày', dataIndex: 'dayLabel', key: 'dayLabel', width: 80 },
        { title: 'Cột', dataIndex: 'column', key: 'column', width: 100 },
        { title: 'Lỗi', dataIndex: 'message', key: 'message' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Đã nhập">
                    <Text strong>{result.totalInserted} bản ghi</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đã nhập">
                    {result.importedDays.length > 0 ? (
                        result.importedDays.map((d) => <Tag key={d}>{d}</Tag>)
                    ) : (
                        <Text type="secondary">—</Text>
                    )}
                </Descriptions.Item>
                {result.deferredDays.length > 0 && (
                    <Descriptions.Item label="Ngày hoãn">
                        {result.deferredDays.map((d) => (
                            <Tag key={d} color="warning">{d}</Tag>
                        ))}
                    </Descriptions.Item>
                )}
                {result.requiresConfirmation && (
                    <Descriptions.Item label="Lưu ý">
                        <Text type="warning">
                            <WarningOutlined /> Cần xác nhận — sessionToken:{' '}
                            <Text code>{result.sessionToken.slice(0, 12)}…</Text>
                        </Text>
                    </Descriptions.Item>
                )}
            </Descriptions>

            {result.skippedDays.length > 0 && (
                <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Ngày bị bỏ qua ({result.skippedDays.length})
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
                        Lỗi ({result.errors.length})
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
