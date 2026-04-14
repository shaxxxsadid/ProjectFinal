// app/api/users/profile/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongoose';
import { Users } from '@/app/models/Users';

export async function PUT(request: Request) {
  try {

    

    const body = await request.json();
    const { newUsername, email } = body;

    if (!newUsername) {
      return NextResponse.json({ error: 'Требуется поле newUsername' }, { status: 400 });
    }

    const firstName = newUsername.split(' ')[0];
    const lastName = newUsername.split(' ')[1];
    
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Требуется поле firstName и lastName' }, { status: 400 });
    }
    
    if (firstName.length > 50 || lastName.length > 50) {
      return NextResponse.json(
        { error: 'Имя или фамилия не должны превышать 50 символов' },
        { status: 400 }
      );
    }
    // Разрешаем буквы (включая кириллицу), цифры, пробелы, дефисы, подчёркивания
    if (!/^[\p{L}\p{N}\s\-_]+$/u.test(firstName) || !/^[\p{L}\p{N}\s\-_]+$/u.test(lastName)) {
      return NextResponse.json(
        { error: 'Имя содержит недопустимые символы' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedUser = await Users.findOneAndUpdate(
      { email },
      { firstName: firstName.trim(), lastName: lastName.trim() },
      { new: true, runValidators: true } 
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
      }
    });

  } catch (error) {
    console.error('[PUT /api/users/profile] Error:', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}