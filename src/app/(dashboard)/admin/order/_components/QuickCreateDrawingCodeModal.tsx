'use client';

import React, { useState } from 'react';
import {
    Modal,
    Form,
    Input,
    Button,
    Row,
    Col,
    Typography,
    Upload,
    message,
    theme,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
    PlusOutlined,
    InboxOutlined,
    SaveOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { CreateDrawingCodeRequest, DrawingCodePickingResponse, StepTemplate } from '@/types/DrawingCode';
import { DrawingCodeService } from '@/services';
import { DurationPicker } from '@/components/shared/DurationPicker';
import { useUploadThing } from '@/utils/uploadthing';
import { StepBuilder } from '../../categories/drawingCode/_components/StepBuilder';
import { DemoOrderService, USE_MOCK_ORDERS } from '@/mockData/admin/orders';


const { Text } = Typography;
const { Dragger } = Upload;

interface QuickCreateDrawingCodeModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (newDrawingCode: DrawingCodePickingResponse) => void;
}

export const QuickCreateDrawingCodeModal: React.FC<QuickCreateDrawingCodeModalProps> = ({
    open,
    onClose,
    onCreated,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfError, setPdfError] = useState<string>('');
    const { startUpload } = useUploadThing('imageUploader');

    const handleClose = () => {
        form.resetFields();
        setPdfFile(null);
        setPdfError('');
        onClose();
    };

    const onFinish = async (values: any) => {
        if (!pdfFile) {
            setPdfError(t('drawingCodeManagement.form.validation.pdfLink'));
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload PDF
            let pdfUrl = 'https://example.com/demo/drawing-code.pdf';
            if (!USE_MOCK_ORDERS) {
                const result = await startUpload([pdfFile]);
                if (result && result[0]) {
                    pdfUrl = result[0].ufsUrl || result[0].url;
                } else {
                    throw new Error('PDF upload failed');
                }
            }

            // 2. Build payload
            const stepTemplates: StepTemplate[] = (values.stepTemplates || []).map(
                (step: any, idx: number) => ({
                    stepOrder: idx + 1,
                    stepName: step.stepName,
                    description: step.description || null,
                    requiresQc: step.requiresQc ?? false,
                    defaultCompletionTimeSeconds: step.defaultCompletionTimeSeconds || 0,
                    materialName: step.materialName,
                })
            );

            const payload: CreateDrawingCodeRequest = {
                drawingCode: values.drawingCode?.toUpperCase(),
                drawingCodeName: values.drawingCodeName,
                description: values.description || undefined,
                pdfLink: pdfUrl,
                defaultCompletionTimeSeconds: values.defaultCompletionTimeSeconds || 0,
                stepTemplates,
                ofCustomer: 'Woodsland'
                // productionType: values.productionType,
            };

            console.log('Payload to create drawing code:', payload);

            // 3. Call API
            if (USE_MOCK_ORDERS) {
                const newCode = await DemoOrderService.createDrawingTemplate(payload);
                message.success(t('drawingCodeManagement.form.createSuccess'));
                onCreated(newCode);
                handleClose();
                return;
            }

            await DrawingCodeService.createDrawingCode(payload);
            message.success(t('drawingCodeManagement.form.createSuccess'));

            // 4. Fetch updated picking list to get the new drawing's full data
            const updatedList = await DrawingCodeService.getDrawingCodesForPicking();
            const newCode = updatedList.find(
                (dc) => dc.drawingCode === payload.drawingCode
            );

            if (newCode) {
                onCreated(newCode);
            }

            handleClose();
        } catch (err: any) {
            console.error(err);
            message.error(
                err?.message || t('drawingCodeManagement.form.createError')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            title={
                <span>
                    <PlusOutlined style={{ marginRight: 8 }} />
                    {t('drawingCodeManagement.form.createTitle')}
                </span>
            }
            width={900}
            footer={null}
            destroyOnHidden
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={() =>
                    message.error(t('common.server.validationFailed'))
                }
                disabled={isSubmitting}
                style={{ marginTop: 16 }}
            >
                <Row gutter={[16, 0]}>
                    {/* Drawing Code */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="drawingCode"
                            label={
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('drawingCodeManagement.form.fields.drawingCode')}
                                    <Text type="danger"> *</Text>
                                </Text>
                            }
                            rules={[
                                {
                                    required: true,
                                    message: t('drawingCodeManagement.form.validation.drawingCodeRequired'),
                                },
                                {
                                    max: 50,
                                    message: t('drawingCodeManagement.form.validation.maxLength', { max: 50 }),
                                },
                                {
                                    whitespace: true,
                                    message: t('drawingCodeManagement.form.validation.noWhitespaceOnly'),
                                },
                            ]}
                            normalize={(val) => val?.toUpperCase()}
                        >
                            <Input
                                placeholder={t('drawingCodeManagement.form.placeholders.drawingCode')}
                            />
                        </Form.Item>
                    </Col>

                    {/* Drawing Code Name */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="drawingCodeName"
                            label={
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('drawingCodeManagement.form.fields.drawingCodeName')}
                                    <Text type="danger"> *</Text>
                                </Text>
                            }
                            rules={[
                                {
                                    required: true,
                                    message: t('drawingCodeManagement.form.validation.nameRequired'),
                                },
                                {
                                    max: 100,
                                    message: t('drawingCodeManagement.form.validation.maxLength', { max: 100 }),
                                },
                            ]}
                        >
                            <Input
                                placeholder={t('drawingCodeManagement.form.placeholders.drawingCodeName')}
                            />
                        </Form.Item>
                    </Col>

                    {/* Default Completion Time */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="defaultCompletionTimeSeconds"
                            label={
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('drawingCodeManagement.form.fields.defaultCompletionTime')}
                                </Text>
                            }
                            extra={t('drawingCodeManagement.form.fields.defaultCompletionTimeHint')}
                            rules={[
                                {
                                    required: true,
                                    message: t('Vui lòng nhập thời gian hoàn thành'),
                                },
                                {
                                    validator: (_, value) => {
                                        if (value !== undefined && value !== null && value <= 0) {
                                            return Promise.reject(new Error(t('Thời gian phải lớn hơn 0')));
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <DurationPicker disabled={false} />
                        </Form.Item>
                    </Col>

                    {/* Description */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="description"
                            label={
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('drawingCodeManagement.form.fields.description')}
                                </Text>
                            }
                        >
                            <Input.TextArea
                                placeholder={t('drawingCodeManagement.form.placeholders.description')}
                                rows={3}
                                maxLength={2000}
                                showCount
                            />
                        </Form.Item>
                    </Col>

                    {/* PDF Upload */}
                    <Col xs={24}>
                        <Form.Item
                            label={
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('drawingCodeManagement.form.fields.pdfLink')}
                                    <Text type="danger"> *</Text>
                                </Text>
                            }
                            validateStatus={pdfError ? 'error' : ''}
                            help={pdfError || ''}
                        >
                            <Dragger
                                accept=".pdf"
                                maxCount={1}
                                beforeUpload={(file) => {
                                    setPdfFile(file);
                                    setPdfError('');
                                    return false; // prevent auto upload
                                }}
                                onRemove={() => {
                                    setPdfFile(null);
                                }}
                                fileList={
                                    pdfFile
                                        ? [
                                            {
                                                uid: '-1',
                                                name: pdfFile.name,
                                                status: 'done',
                                            },
                                        ]
                                        : []
                                }
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">
                                    {t('common.upload.pdf.dragAndDrop')}
                                </p>
                                <p className="ant-upload-hint">
                                    {t('common.upload.pdf.supportText')}
                                </p>
                            </Dragger>
                        </Form.Item>
                    </Col>
                </Row>

                {/* Step Builder */}
                <StepBuilder t={t} />

                {/* Footer Actions */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 12,
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        icon={<CloseOutlined />}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        icon={<SaveOutlined />}
                    >
                        {t('drawingCodeManagement.form.buttons.create')}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};
