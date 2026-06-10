import { Button, Card, Input } from 'antd';
import React, { useState } from 'react';

const { OTP } = Input;

export function OTPForm({ ...props }: React.ComponentProps<typeof Card>) {
    const [otpValue, setOtpValue] = useState('');

    return (
        <Card {...props} title="Enter verification code">
            <p className="text-muted-foreground mb-4">We sent a 6-digit code to your email.</p>
            <form>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium mb-2">
                            Verification code
                        </label>
                        <OTP length={6} value={otpValue} onChange={setOtpValue} size="large" />
                        <p className="text-sm text-muted-foreground mt-2">
                            Enter the 6-digit code sent to your email.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Button type="primary" htmlType="submit" block>
                            Verify
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            Didn&apos;t receive the code?{' '}
                            <a href="#" className="text-primary">
                                Resend
                            </a>
                        </p>
                    </div>
                </div>
            </form>
        </Card>
    );
}
