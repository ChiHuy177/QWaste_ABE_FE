'use client';

import { useState, useCallback } from 'react';
import { useUploadThing } from '@/utils/uploadthing';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useOrderAttachmentUpload = () => {
    const { t } = useTranslation();
    const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
    const { startUpload } = useUploadThing('imageUploader');

    const uploadLocalAttachments = useCallback(
        async (
            attachmentsValue: any[]
        ): Promise<{ attachmentUrl: string; attachmentName: string }[]> => {
            if (!attachmentsValue || attachmentsValue.length === 0) return [];

            const existingAttachments: { attachmentUrl: string; attachmentName: string }[] = [];
            const filesToUpload: File[] = [];
            const filesToUploadNames: string[] = [];

            // Phân loại: existing vs new files
            attachmentsValue.forEach((item: any) => {
                if (item.originFileObj) {
                    filesToUpload.push(item.originFileObj as File);
                    filesToUploadNames.push(item.name || 'file');
                } else if (item.attachmentUrl && item.attachmentName) {
                    existingAttachments.push({
                        attachmentUrl: item.attachmentUrl,
                        attachmentName: item.attachmentName,
                    });
                } else if (item.url && item.name) {
                    existingAttachments.push({
                        attachmentUrl: item.url,
                        attachmentName: item.name,
                    });
                }
            });

            if (filesToUpload.length === 0) {
                return existingAttachments;
            }

            try {
                setIsUploadingAttachments(true);
                const uploadResults = await startUpload(filesToUpload);

                if (!uploadResults) {
                    throw new Error('Upload failed');
                }

                const newlyUploaded: { attachmentUrl: string; attachmentName: string }[] =
                    uploadResults.map((res: any, idx: number) => ({
                        attachmentUrl: res.ufsUrl || res.url,
                        attachmentName: filesToUploadNames[idx] || res.name || 'File',
                    }));

                return [...existingAttachments, ...newlyUploaded];
            } catch (error) {
                console.error('Error uploading attachments:', error);
                toast.error(t('orderManagement.form.messages.uploadError'));
                throw error;
            } finally {
                setIsUploadingAttachments(false);
            }
        },
        [startUpload, t]
    );

    return {
        uploadLocalAttachments,
        isUploadingAttachments,
    };
};
