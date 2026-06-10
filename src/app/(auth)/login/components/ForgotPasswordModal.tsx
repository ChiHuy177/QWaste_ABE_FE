'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { X, CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [success] = useState(true);
    const [error] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isLoading] = useState(false);
    // const { isLoading } = useAuth();

    // Use the unified password reset hook
    // const {
    //     initiateReset,
    //     isLoadingForgot: isLoading,
    //     errorForgot: error,
    //     successForgot: success,
    //     clearMessages
    // } = usePasswordReset();

    const handleSubmit = async (_e: React.FormEvent) => {
        // e.preventDefault();
        // // const result = await initiateReset(email);
        // // Clear email field on success
        // if (result.success) {
        //     setEmail('');
        // }
    };

    const resetForm = () => {
        setEmail('');
    };

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    // Handle ESC key press
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleClose]);

    // Handle outside click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            handleClose();
        }
    };

    // Auto-close modal after successful email send (optional)
    useEffect(() => {
        if (success && isOpen) {
            const timer = setTimeout(() => {
                handleClose();
            }, 6000); // Close after 6 seconds

            return () => clearTimeout(timer);
        }
    }, [success, isOpen, handleClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform animate-in zoom-in-95 duration-300 ease-out"
            >
                <div className="p-8 relative">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {t('forgotPassword.title')}
                            </h2>
                            <p className="text-gray-500 text-sm">{t('forgotPassword.subtitle')}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-green-800 text-sm font-medium">{success}</p>
                                    <p className="text-green-700 text-xs mt-1">
                                        {t('forgotPassword.messages.instructions.checkInbox')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="modal-email"
                                className="block text-sm font-semibold text-gray-700 mb-3"
                            >
                                {t('forgotPassword.form.fields.email')}
                            </label>
                            <div className="relative">
                                <input
                                    id="modal-email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading || !!success}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 /50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                                    placeholder={t('forgotPassword.form.placeholders.email')}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-800 text-sm font-medium">{error}</p>
                                        <p className="text-red-700 text-xs mt-1">
                                            {t(
                                                'forgotPassword.messages.instructions.contactSupport'
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover: focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 hover:border-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {success
                                    ? t('forgotPassword.form.buttons.close')
                                    : t('forgotPassword.form.buttons.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !!success}
                                aria-busy={isLoading}
                                aria-disabled={isLoading || !!success}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:from-blue-600 disabled:hover:to-blue-700 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl cursor-pointer"
                            >
                                {isLoading && (
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                )}
                                <span>
                                    {success
                                        ? t('forgotPassword.form.buttons.emailSent')
                                        : isLoading
                                        ? t('forgotPassword.form.buttons.sending')
                                        : t('forgotPassword.form.buttons.sendResetLink')}
                                </span>
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="text-blue-600 hover:text-blue-700 font-medium ml-1 transition-colors duration-200 cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('forgotPassword.form.buttons.backToLogin')}
                            </button>
                        </p>
                    </div>

                    {/* Loading overlay for better UX */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                            <div className="bg-white rounded-xl shadow-lg p-4 flex items-center space-x-3">
                                <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                                <span className="text-gray-700 font-medium">
                                    {t('forgotPassword.form.buttons.sending')}...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
