// app/api/public/user/accounts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/lib/mongoose';
import { Users } from '@/app/models/Users';
import { Accounts } from '@/app/models/Accounts';

// 🔷 DTO для ответа
interface AccountResponse {
    type: 'oauth' | 'credential';
    provider: {
        _id: string;
        name: 'google' | 'github' | 'yandex' | 'credentials';
    };
}

interface AccountLean {
    type?: unknown;
    providerId?: unknown;
}

interface PopulatedProvider {
    _id: unknown;
    publicId?: unknown;
    name?: unknown;
}

function isPopulatedProvider(
    value: unknown
): value is PopulatedProvider {
    return (
        typeof value === 'object' &&
        value !== null &&
        '_id' in value
    );
}

export async function GET() {
    try {
        const session = await getServerSession(AuthOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // 🔍 1. Находим пользователя ПО EMAIL из сессии
        const user = await Users.findOne({ email: session.user.email }).select('_id').lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 🔗 2. Получаем все аккаунты для этого userId
        const accounts = await Accounts.find({ userId: user._id })
            .populate('providerId', 'publicId name')
            .select('type providerId providerAccountId')
            .lean() as unknown as AccountLean[];

        // 🔁 3. Преобразуем в формат для фронтенда
        const result: AccountResponse[] = accounts
            .map((acc) => {
                const provider = acc.providerId;

                if (!isPopulatedProvider(provider)) {
                    console.warn(
                        '[Accounts API] Invalid provider reference:',
                        acc.providerId
                    );
                    return null;
                }

                const rawName = String(
                    provider.publicId ?? provider.name ?? ''
                )
                    .toLowerCase()
                    .trim();

                const providerName: AccountResponse['provider']['name'] =
                    rawName === 'google' ||
                    rawName === 'github' ||
                    rawName === 'yandex' ||
                    rawName === 'credentials'
                        ? rawName
                        : 'credentials';

                const accountType: AccountResponse['type'] =
                    acc.type === 'oauth'
                        ? 'oauth'
                        : 'credential';

                return {
                    type: accountType,
                    provider: {
                        _id: String(provider._id),
                        name: providerName,
                    },
                };
            })
            .filter((item): item is AccountResponse => item !== null);

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('[GET /api/public/user/accounts]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}