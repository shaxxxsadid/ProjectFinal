// app/api/public/user/accounts/link/callback/route.ts
// OAuth callback для ЛИНКОВКИ — НЕ логинит пользователя заново.

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongoose';
import { Users } from '@/app/models/Users';
import { Accounts } from '@/app/models/Accounts';
import { Providers } from '@/app/models/Providers';

const TOKEN_CONFIGS = {
    google: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: () => process.env.GOOGLE_ID_LINK!,
        clientSecret: () => process.env.GOOGLE_LINK_SECRET!,
        userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    github: {
        tokenUrl: 'https://github.com/login/oauth/access_token',
        clientId: () => process.env.GITHUB_ID!,
        clientSecret: () => process.env.GITHUB_SECRET!,
        userInfoUrl: 'https://api.github.com/user',
    },
    yandex: {
        tokenUrl: 'https://oauth.yandex.ru/token',
        clientId: () => process.env.YANDEX_ID!,
        clientSecret: () => process.env.YANDEX_SECRET!,
        userInfoUrl: 'https://login.yandex.ru/info',
    },
} as const;

type SupportedProvider = keyof typeof TOKEN_CONFIGS;

const PROFILE_URL = '/pages/profile';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const stateToken = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) return redirectToProfile('oauth_cancelled');
    if (!code || !stateToken) return redirectToProfile('missing_params');

    // ── Декодируем state ──────────────────────────────────────────────────────
    let statePayload: { email: string; provider: string; nonce: string };
    try {
        statePayload = JSON.parse(Buffer.from(stateToken, 'base64url').toString('utf8'));
    } catch {
        return redirectToProfile('invalid_state');
    }

    const { email: userEmail, provider, nonce } = statePayload;
    if (!userEmail || !provider || !nonce) return redirectToProfile('invalid_state');

    // ── Проверяем nonce из cookie (CSRF защита) ───────────────────────────────
    const cookieNonce = req.cookies.get('link_state_nonce')?.value;
    if (!cookieNonce || cookieNonce !== nonce) {
        console.warn('[LinkCallback] Nonce mismatch — possible CSRF or expired session');
        return redirectToProfile('invalid_state');
    }

    if (!(provider in TOKEN_CONFIGS)) return redirectToProfile('unknown_provider');

    const config = TOKEN_CONFIGS[provider as SupportedProvider];
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/public/user/accounts/link/callback`;

    try {
        await connectToDatabase();

        // ── Резолвим email → MongoDB ObjectId ────────────────────────────────
        const sessionUser = await Users.findOne({ email: userEmail }).select('_id').lean();
        if (!sessionUser) {
            console.error(`[LinkCallback] User not found by email: ${userEmail}`);
            return redirectToProfile('user_not_found');
        }
        const userId = sessionUser._id;

        // ── 1. Обмениваем code → access_token ────────────────────────────────
        const tokenRes = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
            body: new URLSearchParams({
                client_id: config.clientId(),
                client_secret: config.clientSecret(),
                code,
                grant_type: 'authorization_code',
                redirect_uri: callbackUrl,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('[LinkCallback] No access_token:', tokenData);
            return redirectToProfile('token_exchange_failed');
        }

        // ── 2. Получаем профиль от провайдера ────────────────────────────────
        const profileRes = await fetch(config.userInfoUrl, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/json',
                ...(provider === 'github' ? { 'User-Agent': 'NextApp' } : {}),
            },
        });
        const profile = await profileRes.json();

        const providerAccountId =
            provider === 'github' ? String(profile.id) :
            provider === 'google' ? String(profile.sub) :
            String(profile.id);

        const oauthEmail: string | undefined =
            provider === 'github'
                ? profile.email || (await getGithubPrimaryEmail(tokenData.access_token))
                : provider === 'google'
                ? profile.email
                : profile.default_email || profile.emails?.[0]?.email;

        if (!oauthEmail) {
            console.warn('[LinkCallback] Could not get email from provider');
            return redirectToProfile('no_email');
        }

        // ── 3. Email провайдера не должен принадлежать другому юзеру ─────────
        const emailOwner = await Users.findOne({ email: oauthEmail.toLowerCase() }).select('_id').lean();
        if (emailOwner && emailOwner._id.toString() !== userId.toString()) {
            console.warn(`[LinkCallback] Email ${oauthEmail} belongs to another user`);
            return redirectToProfile('email_taken');
        }

        // ── 4. providerAccountId не должен быть привязан к другому юзеру ─────
        const providerDoc = await Providers.findOne({ publicId: provider }).lean();
        if (!providerDoc) {
            console.error(`[LinkCallback] Provider "${provider}" not found in DB`);
            return redirectToProfile('provider_not_found');
        }

        const existingAccount = await Accounts.findOne({ providerId: providerDoc._id, providerAccountId }).lean();
        if (existingAccount && existingAccount.userId.toString() !== userId.toString()) {
            console.warn(`[LinkCallback] providerAccountId already linked to another user`);
            return redirectToProfile('account_taken');
        }

        // ── 5. Upsert ─────────────────────────────────────────────────────────
        await Accounts.findOneAndUpdate(
            { userId, providerId: providerDoc._id },
            {
                type: 'oauth',
                providerAccountId,
                avatar: profile.picture || profile.avatar_url || profile.default_avatar_id,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
                scope: tokenData.scope,
            },
            { upsert: true, returnDocument: 'after' }
        );

        console.log(`[LinkCallback] Successfully linked ${provider} to userId: ${userId}`);

        // Чистим cookie
        const res = redirectToProfile(null, provider);
        res.cookies.delete('link_state_nonce');
        return res;

    } catch (error) {
        console.error('[LinkCallback] Error:', error);
        return redirectToProfile('server_error');
    }
}

function redirectToProfile(error: string | null, linked?: string) {
    const params = new URLSearchParams();
    if (error) params.set('link_error', error);
    else if (linked) params.set('link_success', linked);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}${PROFILE_URL}?${params.toString()}`);
}

async function getGithubPrimaryEmail(accessToken: string): Promise<string | undefined> {
    try {
        const res = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'User-Agent': 'NextApp' },
        });
        const emails: Array<{ email: string; primary: boolean; verified: boolean }> = await res.json();
        return emails.find((e) => e.primary && e.verified)?.email;
    } catch {
        return undefined;
    }
}