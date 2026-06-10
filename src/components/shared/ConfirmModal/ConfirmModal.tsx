import { useState, useCallback } from 'react';
import { Modal, Input } from 'antd';
import { toast } from 'sonner';
import { TFunction } from 'i18next';

export type ConfirmationType = 'create' | 'edit' | 'delete' | 'restore';

interface ConfirmModalProps {
    open: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    t: TFunction;
    type: ConfirmationType;
}

/**
 * Universal confirmation modal for all CRUD operations
 * Requires keyword input to confirm critical actions
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    onConfirm,
    onCancel,
    t,
    type,
}) => {
    const [confirmInput, setConfirmInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = useCallback(async () => {
        const keyword = t(`common.confirmations.${type}.keyword`);
        const action = t(`common.confirmations.${type}.action`);
        if (confirmInput.trim().toLowerCase() !== keyword.toLowerCase()) {
            toast.error(
                t('common.confirmations.invalidInput', {
                    keyword,
                    action,
                })
            );
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
    }, [confirmInput, onConfirm, t, type]);

    const handleCancel = useCallback(() => {
        setConfirmInput('');
        onCancel();
    }, [onCancel]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmInput(e.target.value);
    }, []);

    return (
        <Modal
            title={t(`common.confirmations.${type}.title`)}
            open={open}
            onOk={handleConfirm}
            onCancel={handleCancel}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: type === 'delete', loading }}
            cancelButtonProps={{ disabled: loading }}
            zIndex={1100}
            maskClosable={!loading}
            closable={!loading}
        >
            <p>
                {t(`common.confirmations.${type}.description`)}{' '}
                <strong>"{t(`common.confirmations.${type}.keyword`)}"</strong>
            </p>
            <Input
                placeholder={t(`common.confirmations.${type}.placeholder`)}
                value={confirmInput}
                onChange={handleInputChange}
                onPressEnter={handleConfirm}
                autoFocus
                disabled={loading}
            />
        </Modal>
    );
};
