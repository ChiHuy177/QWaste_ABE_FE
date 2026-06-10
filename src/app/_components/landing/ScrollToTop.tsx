'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <>
            <button
                onClick={scrollToTop}
                style={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(7, 70, 149, 0.3)',
                    opacity: isVisible ? 1 : 0,
                    visibility: isVisible ? 'visible' : 'hidden',
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 1000,
                }}
                className="scroll-to-top-button"
                aria-label="Scroll to top"
            >
                <ArrowUp size={20} strokeWidth={2.5} />
            </button>

            <style jsx global>{`
                .scroll-to-top-button:hover {
                    transform: translateY(-4px) scale(1.05) !important;
                    box-shadow: 0 8px 20px rgba(7, 70, 149, 0.4) !important;
                }

                .scroll-to-top-button:active {
                    transform: translateY(-2px) scale(1) !important;
                }

                @media (max-width: 768px) {
                    .scroll-to-top-button {
                        bottom: 20px !important;
                        right: 20px !important;
                        width: 44px !important;
                        height: 44px !important;
                    }
                }
            `}</style>
        </>
    );
}
