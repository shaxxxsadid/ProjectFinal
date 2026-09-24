import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/app/lib/mongoose';
import { Accounts } from '@/app/models/Accounts';
import { Providers } from '@/app/models/Providers';
import { Users } from '@/app/models/Users';
import { rolesService } from '@/app/services/Roles.service';

const EMAIL_IN_USE = 'Пользователь с таким email уже существует. Войдите существующим способом авторизации.';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isDuplicateEmail(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const mongoError = error as { code?: number; keyPattern?: { email?: number } };
    return mongoError.code === 11000 && mongoError.keyPattern?.email === 1;
}

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Некорректные данные формы' }, { status: 400 });
    }

    if (typeof body !== 'object' || body === null) {
        return Response.json({ error: 'Некорректные данные формы' }, { status: 400 });
    }

    const fields = body as Record<string, unknown>;
    const { firstName, lastName, email, password, confirmPassword } = fields;
    if ([firstName, lastName, email, password, confirmPassword].some((value) => typeof value !== 'string')) {
        return Response.json({ error: 'Заполните все поля формы' }, { status: 400 });
    }

    const normalizedFirstName = (firstName as string).trim();
    const normalizedLastName = (lastName as string).trim();
    const normalizedEmail = (email as string).trim().toLowerCase();

    if (!normalizedFirstName || !normalizedLastName) {
        return Response.json({ error: 'Укажите имя и фамилию' }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
        return Response.json({ error: 'Укажите корректный email' }, { status: 400 });
    }
    if ((password as string).length < 8) {
        return Response.json({ error: 'Пароль должен содержать не менее 8 символов' }, { status: 400 });
    }
    if (password !== confirmPassword) {
        return Response.json({ error: 'Пароли не совпадают' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        const existingUser = await Users.findOne({ email: normalizedEmail })
            .collation({ locale: 'en', strength: 2 })
            .select('_id')
            .lean();
        if (existingUser) {
            return Response.json({ error: EMAIL_IN_USE }, { status: 409 });
        }

        const role = await rolesService.getRoleByName('user');
        if (!role) {
            console.error('[Register] Default user role is missing');
            return Response.json({ error: 'Регистрация временно недоступна' }, { status: 500 });
        }

        const credentialsProvider = await Providers.findOneAndUpdate(
            { publicId: 'credentials' },
            { $setOnInsert: { publicId: 'credentials', displayName: 'Email и пароль', isActive: true } },
            { upsert: true, new: true }
        );

        const passwordHash = await bcrypt.hash(password as string, 12);
        const user = await Users.create({
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            username: `${normalizedFirstName} ${normalizedLastName}`,
            email: normalizedEmail,
            passwordHash,
            roleId: role._id,
            isActive: true,
        });

        try {
            await Accounts.create({
                userId: user._id,
                providerId: credentialsProvider._id,
                type: 'credential',
                providerAccountId: normalizedEmail,
            });
        } catch (error) {
            try {
                await Users.deleteOne({ _id: user._id });
            } catch (cleanupError) {
                console.error('[Register] Failed to roll back user creation:', cleanupError);
            }
            throw error;
        }

        return Response.json({ success: true }, { status: 201 });
    } catch (error) {
        if (isDuplicateEmail(error)) {
            return Response.json({ error: EMAIL_IN_USE }, { status: 409 });
        }
        console.error('[Register] Failed to create account:', error);
        return Response.json({ error: 'Не удалось завершить регистрацию. Попробуйте позже.' }, { status: 500 });
    }
}
