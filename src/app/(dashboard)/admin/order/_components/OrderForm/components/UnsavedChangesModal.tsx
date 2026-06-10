'use client';

import React from 'react';
import { Modal, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface UnsavedChangesModalProps {
    open: boolean;
    onCancel: () => void;
    onDiscard: () => void;
    onSave: () => void;
    isSubmitting?: boolean;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    open,
    onCancel,
    onDiscard,
    onSave,
    isSubmitting = false,
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            open={open}
            title={t('orderManagement.form.unsavedChanges.title')}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    {t('common.buttons.cancel')}
                </Button>,
                <Button key="discard" onClick={onDiscard}>
                    {t('orderManagement.form.unsavedChanges.discard')}
                </Button>,
                <Button key="save" type="primary" onClick={onSave} loading={isSubmitting}>
                    {t('orderManagement.form.unsavedChanges.save')}
                </Button>,
            ]}
        >
            {t('orderManagement.form.unsavedChanges.message')}
        </Modal>
    );
};
