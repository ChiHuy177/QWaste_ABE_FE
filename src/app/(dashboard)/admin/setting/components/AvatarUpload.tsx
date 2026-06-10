'use client';

import { useState, useEffect } from 'react';
import { Avatar, Upload, theme, message } from 'antd';
import { UserOutlined, CameraOutlined, EyeOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { UserProfile } from '@/types/User';
import type { RcFile } from 'antd/es/upload/interface';
import { useTranslation } from 'react-i18next';

interface AvatarUploadProps {
    currentUser?: UserProfile;
    currentAvatarUrl?: string;
    onFileSelect?: (file: File | null) => void;
    previewUrl?: string;
    onPreview?: (url: string) => void;
    disableUpload?: boolean;
    showCameraIcon?: boolean;
    helperText?: string;
}

export const AvatarUpload = ({
    currentUser,
    currentAvatarUrl,
    onFileSelect,
    previewUrl,
    onPreview,
    disableUpload = false,
    showCameraIcon = true,
    helperText,
}: AvatarUploadProps) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [isClientMounted, setIsClientMounted] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | undefined>(undefined);

    useEffect(() => {
        setIsClientMounted(true);
    }, []);

    useEffect(() => {
        if (isClientMounted) {
            const initialAvatarUrl =
                previewUrl || currentUser?.preferences.avatarUrl || currentAvatarUrl;
            setLocalPreview(initialAvatarUrl);
        }
    }, [isClientMounted, currentUser?.preferences.avatarUrl, currentAvatarUrl, previewUrl]);

    const beforeUpload = (file: RcFile): boolean => {
        // Validate file type
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error(
                t('avatarUpload.errors.invalidType') || 'You can only upload image files!'
            );
            return false;
        }

        // Validate file size (4MB)
        const isLt4M = file.size / 1024 / 1024 < 4;
        if (!isLt4M) {
            message.error(
                t('avatarUpload.errors.fileTooLarge') || 'Image must be smaller than 4MB!'
            );
            return false;
        }

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setLocalPreview(result);
        };
        reader.readAsDataURL(file);

        // Notify parent component about file selection
        if (onFileSelect) {
            onFileSelect(file);
        }

        // Prevent auto upload
        return false;
    };

    const handleRemove = () => {
        setLocalPreview(currentUser?.preferences.avatarUrl || currentAvatarUrl);
        if (onFileSelect) {
            onFileSelect(null);
        }
    };

    const handlePreview = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering file upload
        if (localPreview && onPreview) {
            onPreview(localPreview);
        }
    };

    if (!isClientMounted) {
        return (
            <div
                style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: token.colorBgLayout,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <UserOutlined style={{ fontSize: 56, color: token.colorTextQuaternary }} />
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: 160,
                    height: 160,
                }}
            >
                <Upload
                    disabled={disableUpload}
                    openFileDialogOnClick={!disableUpload}
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    accept="image/*"
                    maxCount={1}
                    className="avatar-upload-wrapper"
                >
                    <div
                        style={{
                            position: 'relative',
                            width: 160,
                            height: 160,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            background: `linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorBorderSecondary} 100%)`,
                            padding: 4,
                        }}
                    >
                        <Avatar
                            size={152}
                            icon={
                                <UserOutlined
                                    style={{ fontSize: 56, color: token.colorTextQuaternary }}
                                />
                            }
                            src={
                                localPreview ? (
                                    <Image
                                        src={localPreview}
                                        alt={t('avatarUpload.profilePicture') || 'Profile Picture'}
                                        width={152}
                                        height={152}
                                        style={{ objectFit: 'cover' }}
                                        unoptimized
                                    />
                                ) : undefined
                            }
                            style={{
                                border: `3px solid ${token.colorBgContainer}`,
                                background: token.colorBgLayout,
                                boxShadow: token.boxShadow,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        />

                        {/* Hover Overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                right: 4,
                                bottom: 4,
                                borderRadius: '50%',
                                background: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                opacity: 0,
                                transition: 'opacity 0.3s',
                                pointerEvents: 'none',
                            }}
                            className="avatar-overlay"
                        >
                            {showCameraIcon && (
                                <CameraOutlined
                                    style={{
                                        fontSize: 32,
                                        color: '#fff',
                                    }}
                                />
                            )}
                            {localPreview && onPreview && (
                                <>
                                    <div
                                        style={{
                                            width: 50,
                                            height: 1,
                                            background: 'rgba(255,255,255,0.3)',
                                        }}
                                    />
                                    <div
                                        onClick={handlePreview}
                                        style={{
                                            pointerEvents: 'auto',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '6px 10px',
                                            borderRadius: 4,
                                            background: 'rgba(255,255,255,0.2)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background =
                                                'rgba(255,255,255,0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background =
                                                'rgba(255,255,255,0.2)';
                                        }}
                                    >
                                        <EyeOutlined style={{ fontSize: 32, color: '#fff' }} />
                                        <span
                                            style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}
                                        >
                                            {t('avatarUpload.preview') || 'Preview'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Upload>
            </div>

            <div
                style={{
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: 200,
                }}
            >
                <p
                    style={{
                        fontSize: 12,
                        color: token.colorTextTertiary,
                        margin: 0,
                        lineHeight: 1.5,
                    }}
                >
                    {helperText ?? t('avatarUpload.helperText')}
                </p>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    .avatar-upload-wrapper .ant-upload {
                        width: 120px !important;
                        height: 120px !important;
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    
                    .avatar-upload-wrapper .ant-upload:hover .avatar-overlay {
                        opacity: 1 !important;
                    }
                    
                    .avatar-upload-wrapper .ant-upload-select {
                        width: 120px !important;
                        height: 120px !important;
                        border: none !important;
                        background: transparent !important;
                    }
                `,
                }}
            />
        </div>
    );
};
