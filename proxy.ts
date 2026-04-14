import { getToken, JWT } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export enum Role {
    Admin = 'admin',
    Manager = 'manager',
    User = 'user',
}

export enum Method {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

const ROLE_PERMISSIONS: Record<Role, Set<Method>> = {
    [Role.Admin]: new Set([Method.GET, Method.POST, Method.PUT, Method.DELETE]),
    [Role.Manager]: new Set([Method.GET, Method.POST, Method.PUT]),
    [Role.User]: new Set([Method.GET]),
};

const PUBLIC_BASE_PATH = '/api/public';

// Публичные пути (но только для GET-запросов!)
const PUBLIC_PATHS = [
    `${PUBLIC_BASE_PATH}/user/username`,
    `${PUBLIC_BASE_PATH}/user/password`,
];

const PROTECTED_PATHS = [
    '/api/users',
    '/api/profile',
    '/api/dashboard',
    '/api/admin',
];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PATHS.some((prefix) => pathname.startsWith(prefix));
}

async function getAuthenticatedUser(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email || !token?.role) return null;

    return {
        token,
        email: token.email as string,
        role: token.role as Role,
    };
}

function hasPermission(role: Role, method: Method): boolean {
    return ROLE_PERMISSIONS[role]?.has(method) ?? false;
}

function authError(message: string, status: 401 | 403 = 401) {
    return NextResponse.json({ error: message }, { status });
}

/*
    UPD: 2026-03-01 - Updated

    Next.js updated docs for middleware. Middleware is now middleware to proxy requests to the server.
    - export function middleware() {
    + export function proxy() {
    - middleware.ts
    + proxy.ts

    Middleware to check if the user is authenticated before allowing access to protected routes.
    - If the user is not authenticated, they will be redirected to the login page.
    - Roles routes can be added in the future to restrict access based on user roles (e.g., admin, manager, staff).

    Routes:
    - /api/modelName - Public route for getting data but protected for CRUD operations.
    - /api/modelName/{id} - Public route for getting specific data but protected for CRUD operations.
    - /api/auth/* - Public routes for authentication (login, register, etc.). 

    Access Control:
    - Admin: Full access to all routes and methods.
    - Manager: Access to dashboard and users routes with GET, POST, PUT methods.
    - Staff: Access to dashboard route with GET method only.
    - Default User: Access to public routes with GET method only.
*/
export async function proxy(request: NextRequest) {
    // const { pathname } = request.nextUrl;
    // const httpMethod = request.method.toUpperCase() as Method;

    // if (isPublicPath(pathname)) {
    //     if (httpMethod === Method.GET) {
    //         return NextResponse.next();
    //     }
    //     const user = await getAuthenticatedUser(request);
    //     if (!user) {
    //         return authError('Не авторизован', 401);
    //     }
    //     if ((pathname === '/api/public/user/username' || pathname === '/api/public/user/password') && httpMethod === Method.PUT) {

    //         try {
    //             const body = await request.clone().json();
    //             const targetEmail = body.email || user.email;

    //             if (targetEmail !== user.email && user.role !== Role.Admin) {
    //                 return authError('Можно изменять только свой профиль', 403);
    //             }

    //             const requestHeaders = new Headers(request.headers);
    //             requestHeaders.set('x-user-email', user.email);
    //             requestHeaders.set('x-user-role', user.role);
    //             requestHeaders.set('x-user-id', user.token.sub || '');
    //             return NextResponse.next({ request: { headers: requestHeaders } });

    //         } catch {
    //             const requestHeaders = new Headers(request.headers);
    //             requestHeaders.set('x-user-email', user.email);
    //             requestHeaders.set('x-user-role', user.role);
    //             requestHeaders.set('x-user-id', user.token.sub || '');
    //             return NextResponse.next({ request: { headers: requestHeaders } });
    //         }
    //     }
    //     // Проверяем права по роли
    //     if (!hasPermission(user.role, httpMethod)) {
    //         return authError('Доступ запрещён', 403);
    //     }
    //     // Добавляем пользователя в хедеры
    //     const requestHeaders = new Headers(request.headers);
    //     requestHeaders.set('x-user-email', user.email);
    //     requestHeaders.set('x-user-role', user.role);
    //     requestHeaders.set('x-user-id', user.token.sub || '');
    //     return NextResponse.next({ request: { headers: requestHeaders } });
    // }

    // if (isProtectedPath(pathname)) {
    //     const user = await getAuthenticatedUser(request);
    //     if (!user) {
    //         return authError('Не авторизован', 401);
    //     }

    //     if (!hasPermission(user.role, httpMethod)) {
    //         return authError('Доступ запрещён', 403);
    //     }

    //     const requestHeaders = new Headers(request.headers);
    //     requestHeaders.set('x-user-email', user.email);
    //     requestHeaders.set('x-user-role', user.role);
    //     requestHeaders.set('x-user-id', user.token.sub || '');
    //     return NextResponse.next({ request: { headers: requestHeaders } });
    // }

    return NextResponse.next();
}

// export const config = {
//     // matcher: ['/api/:path*'],
// };