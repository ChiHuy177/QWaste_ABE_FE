import { NextRequest, NextResponse } from 'next/server';
import { BFF_ACCESS_TOKEN_COOKIE } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get(BFF_ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ token: accessToken });
}
