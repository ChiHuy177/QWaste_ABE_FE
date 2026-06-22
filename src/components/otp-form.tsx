import { Button, Card, Input } from 'antd';
import React, { useState } from 'react';

const { OTP } = Input;

export function OTPForm({ ...props }: React.ComponentProps<typeof Card>) {
    const [otpValue, setOtpValue] = useState('');

    return (
        <Card {...props} title="Enter verification code">
            <p style={{ color: 'var(--muted-foreground)', marginBottom: 16 }}>We sent a 6-digit code to your email.</p>
            <form>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label htmlFor="otp" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                            Verification code
                        </label>
                        <OTP length={6} value={otpValue} onChange={setOtpValue} size="large" />
                        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginTop: 8 }}>
                            Enter the 6-digit code sent to your email.
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Button type="primary" htmlType="submit" block>
                            Verify
                        </Button>
                        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted-foreground)', margin: 0 }}>
                            Didn&apos;t receive the code?{' '}
                            <a href="#" style={{ color: 'var(--primary)' }}>
                                Resend
                            </a>
                        </p>
                    </div>
                </div>
            </form>
        </Card>
    );
}
