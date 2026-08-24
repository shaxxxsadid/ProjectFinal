// middleware/proxy.ts

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Rate Limiting ─────────────────────────────────────────────────────────
//
// ВАЖНО:
// Это application-level rate limiting. Он защищает приложение от обычного
// флуда/злоупотреблений, но не заменяет Cloudflare / nginx / WAF / CDN при
// настоящей volumetric DDoS-атаке.
//
// Лимиты разделены на независимые buckets, чтобы, например, загрузка аватаров
// не съедала лимит обычных API-запросов.

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

type RateLimitPolicy = {
    bucket: string;
    maxRequests: number;
    windowMs: number;
};

const rlStore = new Map<string, RateLimitEntry>();

const ONE_MINUTE = 60_000;

// Отдельные лимиты для разных типов трафика.
const RL_POLICIES = {
    // Изображения могут загружаться параллельно большим количеством карточек.
    avatar: {
        bucket: 'avatar',
        maxRequests: 600,
        windowMs: ONE_MINUTE,
    },

    // NextAuth может проверять session достаточно часто.
    session: {
        bucket: 'session',
        maxRequests: 240,
        windowMs: ONE_MINUTE,
    },

    // Sign-in/callback/signout и прочие auth-запросы ограничиваем заметно строже.
    auth: {
        bucket: 'auth',
        maxRequests: 40,
        windowMs: ONE_MINUTE,
    },

    // Изменяющие данные запросы — отдельный строгий bucket.
    mutation: {
        bucket: 'mutation',
        maxRequests: 60,
        windowMs: ONE_MINUTE,
    },

    // Обычные GET/HEAD API-запросы.
    apiRead: {
        bucket: 'api-read',
        maxRequests: 240,
        windowMs: ONE_MINUTE,
    },

    // Навигация по страницам.
    page: {
        bucket: 'page',
        maxRequests: 180,
        windowMs: ONE_MINUTE,
    },
} satisfies Record<string, RateLimitPolicy>;

let lastCleanupAt = Date.now();

function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const forwardedIp = forwardedFor?.split(',')[0]?.trim();

    return (
        forwardedIp ||
        req.headers.get('x-real-ip') ||
        // В локальной разработке IP может отсутствовать.
        // Это нормально: все локальные запросы будут в bucket "local".
        'local'
    );
}

function getRateLimitPolicy(path: string, method: string): RateLimitPolicy {
    if (path.startsWith('/api/avatar/')) {
        return RL_POLICIES.avatar;
    }

    if (path === '/api/auth/session') {
        return RL_POLICIES.session;
    }

    if (path.startsWith('/api/auth/')) {
        return RL_POLICIES.auth;
    }

    if (path.startsWith('/api/')) {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            return RL_POLICIES.mutation;
        }

        return RL_POLICIES.apiRead;
    }

    return RL_POLICIES.page;
}

function getRLKey(req: NextRequest, policy: RateLimitPolicy): string {
    const ip = getClientIp(req);

    // Ключ разделён по bucket:
    // avatar-запросы не уменьшают api-read/mutation/session лимиты.
    return `rl:${policy.bucket}:${ip}`;
}

function cleanupExpiredEntries(now: number): void {
    // Не обходим Map на каждом запросе.
    if (now - lastCleanupAt < ONE_MINUTE) {
        return;
    }

    lastCleanupAt = now;

    for (const [key, entry] of rlStore.entries()) {
        if (now > entry.resetAt) {
            rlStore.delete(key);
        }
    }
}

function checkRL(
    key: string,
    policy: RateLimitPolicy
): {
    allowed: boolean;
    resetAt: number;
    remaining: number;
    limit: number;
} {
    const now = Date.now();

    cleanupExpiredEntries(now);

    const entry = rlStore.get(key);

    if (!entry || now > entry.resetAt) {
        const resetAt = now + policy.windowMs;

        rlStore.set(key, {
            count: 1,
            resetAt,
        });

        return {
            allowed: true,
            resetAt,
            remaining: Math.max(0, policy.maxRequests - 1),
            limit: policy.maxRequests,
        };
    }

    entry.count += 1;

    return {
        allowed: entry.count <= policy.maxRequests,
        resetAt: entry.resetAt,
        remaining: Math.max(0, policy.maxRequests - entry.count),
        limit: policy.maxRequests,
    };
}

function rateLimitResponse(
    request: NextRequest,
    isApi: boolean,
    rl: {
        resetAt: number;
        remaining: number;
        limit: number;
    }
): NextResponse {
    const retryAfter = Math.max(
        1,
        Math.ceil((rl.resetAt - Date.now()) / 1000)
    );

    const headers = {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
    };

    if (isApi) {
        return NextResponse.json(
            {
                error: 'Too Many Requests',
                retryAfter,
            },
            {
                status: 429,
                headers,
            }
        );
    }

    const errorUrl = new URL('/pages/429', request.url);
    errorUrl.searchParams.set('retry', String(retryAfter));

    const response = NextResponse.redirect(errorUrl);

    for (const [name, value] of Object.entries(headers)) {
        response.headers.set(name, value);
    }

    return response;
}

// ─── Основная функция ─────────────────────────────────────────────────────

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const path = request.nextUrl.pathname;
    const method = request.method.toUpperCase();
    const isApi = path.startsWith('/api/');

    // 1. RSC/prefetch не считаем как пользовательские запросы.
    if (
        request.headers.has('RSC') ||
        request.nextUrl.searchParams.has('_rsc') ||
        request.headers.get('purpose') === 'prefetch'
    ) {
        return NextResponse.next();
    }

    // 2. Страница 429 никогда не проходит через rate limit,
    // иначе можно получить redirect loop.
    if (path === '/pages/429' || path === '/429') {
        return NextResponse.next();
    }

    // 3. Next.js static + обычные статические файлы.
    if (path.startsWith('/_next/') || path === '/favicon.ico') {
        return NextResponse.next();
    }

    if (
        /\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?|ttf|eot|map|json)$/i.test(
            path
        )
    ) {
        return NextResponse.next();
    }

    // OPTIONS/preflight не должен тратить пользовательский лимит.
    if (method === 'OPTIONS') {
        return NextResponse.next();
    }

    // 4. Rate limiting.
    //
    // Ничего полностью не исключаем:
    // даже /api/avatar и /api/auth/session имеют защиту от флуда,
    // просто используют собственные разумные buckets.
    const policy = getRateLimitPolicy(path, method);
    const rl = checkRL(getRLKey(request, policy), policy);

    if (!rl.allowed) {
        return rateLimitResponse(request, isApi, rl);
    }

    // ─── Public / protected paths ──────────────────────────────────────────

    const isPublicProductPath =
        path === '/api/product' ||
        path.startsWith('/api/product/');

    const isCategoriesPath =
        path === '/api/categories' ||
        path.startsWith('/api/categories/');

    const isPublicCategoriesGet =
        isCategoriesPath && method === 'GET';

    const isPublicPath =
        path === '/' ||
        path === '/pages/catalog' ||
        path === '/catalog' ||
        path === '/pages/login' ||
        path === '/login' ||
        path === '/pages/register' ||
        path === '/register' ||
        path === '/pages/forgot-password' ||
        path === '/forgot-password' ||
        path.startsWith('/api/auth/') ||
        path.startsWith('/api/public/') ||
        isPublicProductPath ||
        isPublicCategoriesGet ||
        path.startsWith('/api/avatar/');

    if (isPublicPath) {
        // /api/product (singular) — только GET.
        if (isPublicProductPath && method !== 'GET') {
            return NextResponse.json(
                { error: 'Method Not Allowed' },
                { status: 405 }
            );
        }

        return NextResponse.next();
    }

    // 5. Проверка авторизации.
    const token = await getToken({ req: request });

    if (!token) {
        if (isApi) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const loginUrl = new URL('/pages/login', request.url);
        loginUrl.searchParams.set('callbackUrl', path);

        return NextResponse.redirect(loginUrl);
    }

    // 6. Проверка admin-доступа.
    const isAdminPath =
        path === '/admin' ||
        path === '/pages/admin' ||
        path === '/dashboard/admin' ||
        path === '/pages/dashboard/admin' ||
        path.startsWith('/admin/') ||
        path.startsWith('/pages/admin/') ||
        path.startsWith('/api/user/') ||
        path.startsWith('/api/provider/') ||
        path.startsWith('/api/business/') ||
        path.startsWith('/api/stock/') ||
        path.startsWith('/api/account/') ||
        path.startsWith('/api/warehouse/') ||
        path.startsWith('/api/products') ||
        isCategoriesPath;

    if (isAdminPath) {
        const role =
            typeof token.role === 'string'
                ? token.role.toLowerCase().trim()
                : '';

        if (role !== 'admin') {
            if (isApi) {
                return NextResponse.json(
                    { error: 'Forbidden' },
                    { status: 403 }
                );
            }

            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export { proxy as middleware };

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|css|js|ico|woff2?|ttf|eot|map|json)$).*)',
    ],
};
