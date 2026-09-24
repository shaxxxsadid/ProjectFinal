import 'server-only';

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';

export type AuthorizedUser = {
    id: string;
    role: string;
    email?: string | null;
};

type SessionUser = {
    id?: unknown;
    role?: unknown;
    email?: unknown;
};

export class AuthorizationError extends Error {
    readonly status: 401 | 403;

    constructor(
        message: 'Unauthorized' | 'Forbidden',
        status: 401 | 403
    ) {
        super(message);
        this.name = 'AuthorizationError';
        this.status = status;
    }
}

function normalizeRole(role: unknown): string {
    return typeof role === 'string'
        ? role.trim().toLowerCase()
        : '';
}

export async function requireUser(): Promise<AuthorizedUser> {
    const session = await getServerSession(AuthOptions);

    const sessionUser = session?.user as SessionUser | undefined;

    const id =
        typeof sessionUser?.id === 'string'
            ? sessionUser.id.trim()
            : '';

    if (!id) {
        throw new AuthorizationError('Unauthorized', 401);
    }

    return {
        id,
        role: normalizeRole(sessionUser?.role),
        email:
            typeof sessionUser?.email === 'string'
                ? sessionUser.email
                : null,
    };
}

export async function requireAdmin(): Promise<AuthorizedUser> {
    const user = await requireUser();

    if (user.role !== 'admin') {
        throw new AuthorizationError('Forbidden', 403);
    }

    return user;
}

export function authorizationErrorResponse(
    error: unknown
): NextResponse | null {
    if (!(error instanceof AuthorizationError)) {
        return null;
    }

    return NextResponse.json(
        {
            success: false,
            error: error.message,
        },
        {
            status: error.status,
        }
    );
}
