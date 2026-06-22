import { useState, useCallback } from 'react';
import { Modal, Input } from 'antd';
import { toast } from 'sonner';
import { TFunction } from 'i18next';

interface EditConfirmModalProps {
    open: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    t: TFunction;
}

/**
 * Isolated confirmation modal for edit operations
 * This component manages its own input state to prevent parent re-renders
 */
export const EditConfirmModal: React.FC<EditConfirmModalProps> = ({
    open,
    onConfirm,
    onCancel,
    t,
}) => {
    const [confirmInput, setConfirmInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = useCallback(async () => {
        const keyword = t('common.editConfirmation.keyword');
        if (confirmInput.trim().toLowerCase() !== keyword.toLowerCase()) {
            toast.error(t('common.editConfirmation.invalidInput'));
            return;
        }

        try {
            setLoading(true);
            await onConfirm();
            // Reset input after successful confirmation
            setConfirmInput('');
        } catch (error) {
            // Error handling is done in parent
        } finally {
            setLoading(false);
        }
    }, [confirmInput, onConfirm, t]);

    const handleCancel = useCallback(() => {
        setConfirmInput('');
        onCancel();
    }, [onCancel]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmInput(e.target.value);
    }, []);

    return (
        <Modal
            title={t('common.editConfirmation.title')}
            open={open}
            onOk={handleConfirm}
            onCancel={handleCancel}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true, loading }}
            cancelButtonProps={{ disabled: loading }}
            zIndex={1100}
            mask={{ closable: !loading }}
            closable={!loading}
        >
            <p>
                {t('common.editConfirmation.description')}{' '}
                <strong>"{t('common.editConfirmation.keyword')}"</strong>
            </p>
            <Input
                placeholder={t('common.editConfirmation.placeholder')}
                value={confirmInput}
                onChange={handleInputChange}
                onPressEnter={handleConfirm}
                autoFocus
                disabled={loading}
            />
        </Modal>
    );
};
