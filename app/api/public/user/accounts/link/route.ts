// app/api/public/user/accounts/link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';
import crypto from 'crypto';

const OAUTH_CONFIGS = {
    google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientId: () => process.env.GOOGLE_ID_LINK!,
        scope: 'openid email profile',
    },
    github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        clientId: () => process.env.GITHUB_ID!,
        scope: 'read:user user:email',
    },
    yandex: {
        authUrl: 'https://oauth.yandex.ru/authorize',
        clientId: () => process.env.YANDEX_ID!,
        scope: 'login:email login:info',
    },
} as const;

type SupportedProvider = keyof typeof OAUTH_CONFIGS;

export async function GET(req: NextRequest) {
    const session = await getServerSession(AuthOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = req.nextUrl.searchParams.get('provider') as SupportedProvider | null;
    if (!provider || !(provider in OAUTH_CONFIGS)) {
        return NextResponse.json({ error: 'Invalid provider. Use: google, github, yandex' }, { status: 400 });
    }

    const config = OAUTH_CONFIGS[provider];

    // Генерируем nonce для CSRF защиты
    const nonce = crypto.randomBytes(16).toString('hex');

    // state содержит email + provider + nonce — всё что нужно в callback
    // Email резолвится в MongoDB ObjectId в callback (не зависит от session.user.id)
    const statePayload = { email: session.user.email, provider, nonce };
    const stateToken = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/public/user/accounts/link/callback`;

    const params = new URLSearchParams({
        client_id: config.clientId(),
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: config.scope,
        state: stateToken,
        ...(provider === 'google' ? { prompt: 'select_account', access_type: 'offline' } : {}),
    });

    // Сохраняем nonce в httpOnly cookie — переживает hot-reload, HMR, редиректы
    const res = NextResponse.json({ url: `${config.authUrl}?${params.toString()}` });
    res.cookies.set('link_state_nonce', nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60, // 10 минут
    });

    return res;
}