import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';
import { usersService } from '@/app/services/Users.service';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/app/lib/mongoose';

export async function POST(req: NextRequest) {
    try {

        const session = await getServerSession(AuthOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, currentPassword, newPassword } = await req.json();

        // Проверка: пользователь меняет свой пароль
        if (email !== session.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        await connectToDatabase();
        console.log(email, currentPassword, newPassword);
        // 1. Получаем пользователя с passwordHash
        const user = await usersService.getUserByEmail(email);
        if (!user || !user.passwordHash) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await usersService.updateUserPassword(email, newHash);
        
        console.log(`✅ Password updated for ${email}`);

        return NextResponse.json({ success: true, message: 'Пароль изменён' });

    } catch (error) {
        console.error('[Password Change Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}