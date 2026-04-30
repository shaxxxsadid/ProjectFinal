// app/api/public/user/accounts/unlink/route.ts
// DELETE /api/public/user/accounts/unlink?provider=google

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/lib/mongoose';
import { Accounts } from '@/app/models/Accounts';
import { Providers } from '@/app/models/Providers';

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(AuthOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = req.nextUrl.searchParams.get('provider');
    if (!provider || !['google', 'github', 'yandex'].includes(provider)) {
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        const userId = session.user.id;

        // Проверяем что у юзера останется хотя бы один способ входа
        const allAccounts = await Accounts.find({ userId })
            .populate('providerId', 'publicId')
            .lean();

        const remaining = allAccounts.filter(
            (a: { providerId: { publicId: string } }) => (a.providerId?.publicId || '').toLowerCase() !== provider
        );

        if (remaining.length === 0) {
            return NextResponse.json(
                { error: 'Нельзя отвязать единственный способ входа' },
                { status: 400 }
            );
        }

        const providerDoc = await Providers.findOne({ publicId: provider }).lean();
        if (!providerDoc) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        const deleted = await Accounts.findOneAndDelete({
            userId,
            providerId: providerDoc._id,
        });

        if (!deleted) {
            return NextResponse.json({ error: 'Account not linked' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/public/user/accounts/unlink]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}