import { connectToDatabase } from "@/app/lib/mongoose";
import { logger } from "@/app/lib/logger";
import { usersService } from "@/app/services/Users.service";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        await connectToDatabase();
        const users = await usersService.getAllUsers();
        if (!users || users.length === 0) return Response.json({ success: false, error: 'Users not found' }, { status: 404 });
        return Response.json({ success: true, users });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    
    try {
        await connectToDatabase();

        if (!body.password) {
            return Response.json({ success: false, error: 'Password is required' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(body.password, salt);

        const { password, ...bodyWithoutPassword } = body;

        const cleanBody = Object.fromEntries(
            Object.entries(bodyWithoutPassword).map(([key, value]) => [
                key,
                value === '' ? undefined : value
            ])
        ) as { email: string; isActive: boolean; username?: string; firstName?: string; lastName?: string; roleId?: string; businessProfileId?: string; };

        const newUser = await usersService.createUser({
            ...cleanBody,
            passwordHash,
        });

        const { passwordHash: _, ...safeUser } = newUser.toObject ? newUser.toObject() : newUser;

        return Response.json({ success: true, data: safeUser });

    } catch (error) {
        logger.error(`Failed to create user: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const body = await request.json();

    try {
        await connectToDatabase();

        // Если в теле запроса есть пароль, хешируем его
        if (body.password && body.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            body.password = await bcrypt.hash(body.password, salt);
        } else {
            // Если пароль пустой или не передан, удаляем поле, 
            // чтобы сервис обновления не затер существующий хеш пустой строкой
            delete body.password;
        }

        // Обновляем пользователя
        const updatedUser = await usersService.updateUser(body._id, body);

        if (!updatedUser) {
            return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Убираем хеш из ответа клиенту
        const { password, ...safeUser } = updatedUser.toObject ? updatedUser.toObject() : updatedUser;

        return Response.json({ success: true, data: safeUser });

    } catch (error) {
        logger.error(`Failed to update user: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { _id } = await request.json();
    try {
        await connectToDatabase();
        const deletedUser = await usersService.deleteUser(_id);
        if (!deletedUser) return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        return Response.json({ success: true, data: deletedUser });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const body = await request.json();

    try {
        await connectToDatabase();

        // Если пароль передан и не пустой → хешируем
        if (body.password && body.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            body.password = await bcrypt.hash(body.password, salt);
        } else {
            // Иначе удаляем поле, чтобы не затереть существующий хеш пустой строкой
            delete body.password;
        }

        // Обновляем пользователя
        const updatedUser = await usersService.updateUser(body._id, body);
        if (!updatedUser) {
            return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Убираем хеш/пароль из ответа клиенту
        const { password, ...safeUser } = updatedUser.toObject ? updatedUser.toObject() : updatedUser;

        return Response.json({ success: true, data: safeUser });

    } catch (error) {
        logger.error(`Failed to update user: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}