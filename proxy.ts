// middleware/proxy.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const rlStore = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW_MS = 60_000;
const RL_MAX_REQ = 60;

function getRLKey(req: NextRequest): string {
    return `rl:${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'}`;
}

function checkRL(key: string): { allowed: boolean; resetAt: number } {
    const now = Date.now();
    const entry = rlStore.get(key);
    if (!entry || now > entry.resetAt) {
        rlStore.set(key, { count: 1, resetAt: now + RL_WINDOW_MS });
        return { allowed: true, resetAt: now + RL_WINDOW_MS };
    }
    entry.count += 1;
    return { allowed: entry.count <= RL_MAX_REQ, resetAt: entry.resetAt };
}

// ─── Основная функция ─────────────────────────────────────────────────────
export async function proxy(request: NextRequest): Promise<NextResponse> {
    const path = request.nextUrl.pathname;
    const method = request.method.toUpperCase();
    const isApi = path.startsWith('/api/');

    // 🔥 1. RSC и prefetch — пропускаем БЕЗ ВСЕХ ПРОВЕРОК (самое важное!)
    if (request.headers.has('RSC') ||
        request.nextUrl.searchParams.has('_rsc') ||
        request.headers.get('purpose') === 'prefetch') {
        return NextResponse.next();
    }

    // 🔥 2. Страница 429 — пропускаем БЕЗ проверки лимита (чтобы не зациклить)
    if (path === '/pages/429' || path === '/429') {
        return NextResponse.next();
    }

    // 🔥 3. Статика и ресурсы — пропускаем
    if (path.startsWith('/_next/') || path === '/favicon.ico') {
        return NextResponse.next();
    }
    if (/\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?|ttf|eot|map|json)$/.test(path)) {
        return NextResponse.next();
    }

    // 🔥 4. Rate Limiting — только после всех исключений выше
    const rl = checkRL(getRLKey(request));
    if (!rl.allowed) {
        const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);

        if (isApi) {
            return NextResponse.json(
                { error: 'Too Many Requests', retryAfter },
                { status: 429, headers: { 'Retry-After': String(retryAfter) } }
            );
        }

        // Для страниц — редирект на /pages/429 (который уже исключён выше!)
        const errorUrl = new URL('/pages/429', request.url);
        errorUrl.searchParams.set('retry', String(retryAfter));
        return NextResponse.redirect(errorUrl);
    }

    // 🔥 5. Публичные пути
    const isPublicPath =
        path === '/' ||
        path === '/pages/catalog' || path === '/catalog' ||
        path === '/pages/login' || path === '/login' ||
        path === '/pages/register' || path === '/register' ||
        path === '/pages/forgot-password' || path === '/forgot-password' ||
        path.startsWith('/api/auth/') ||
        path.startsWith('/api/public/') ||
        path.startsWith('/api/product');

    if (isPublicPath) {
        // /api/product — только GET
        if (path.startsWith('/api/product') && method !== 'GET') {
            return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
        }
        return NextResponse.next();
    }

    // 🔥 6. Проверка авторизации
    const token = await getToken({ req: request });

    if (!token) {
        if (isApi) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/pages/login', request.url);
        loginUrl.searchParams.set('callbackUrl', path);
        return NextResponse.redirect(loginUrl);
    }

    // 🔥 7. Проверка админ-доступа
    const isAdminPath =
        path === '/admin' || path === '/pages/admin' ||
        path === '/dashboard/admin' || path === '/pages/dashboard/admin' ||
        path.startsWith('/admin/') || path.startsWith('/pages/admin/') ||
        path.startsWith('/api/user/') ||
        path.startsWith('/api/provider/') ||
        path.startsWith('/api/business/') ||
        path.startsWith('/api/stock/') ||
        path.startsWith('/api/account/') ||
        path.startsWith('/api/warehouse/');

    if (isAdminPath) {
        const role = (typeof token.role === 'string') ? token.role.toLowerCase().trim() : '';
        if (role !== 'admin') {
            if (isApi) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // ✅ Всё ок
    return NextResponse.next();
}

// ─── Экспорт ───────────────────────────────────────────────────────────────
export { proxy as middleware };

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|css|js|ico|woff2?|ttf|eot|map|json)$).*)',
    ],
};