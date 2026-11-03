'use client';
import { Modal } from 'antd';

interface PDFPreviewModalProps {
    open: boolean;
    onClose: () => void;
    pdfUrl: string;
    title?: string;
}

export const PDFPreviewModal = ({ open, onClose, pdfUrl, title }: PDFPreviewModalProps) => {
    return (
        <Modal
            title={title || 'PDF Preview'}
            open={open}
            onCancel={onClose}
            width="90vw"
            style={{ top: 20 }}
            footer={null}
            destroyOnHidden
        >
            <div style={{ height: '80vh', overflow: 'hidden' }}>
                <iframe
                    src={pdfUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                    title="PDF Preview"
                />
            </div>
        </Modal>
    );
};
