// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/app/lib/mongoose';
import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  orderService,
  OrderServiceError,
} from '@/app/services/Order.service';
import type { CreateOrderInput } from '@/types/store.types';

type SessionUser = {
  id?: string;
  email?: string | null;
  role?: string;
};

function getStatusFromError(error: unknown): number {
  if (!(error instanceof OrderServiceError)) return 500;

  switch (error.code) {
    case 'VALIDATION_ERROR':
    case 'INVALID_USER':
    case 'INVALID_PRODUCT_PRICE':
      return 400;
    case 'PRODUCT_NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
    default:
      return 500;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(AuthOptions);
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const isAdmin =
      typeof user.role === 'string' &&
      user.role.toLowerCase().trim() === 'admin';

    const orders = isAdmin
      ? await orderService.getAllOrders()
      : await orderService.getOrdersByUser(user.id);

    return NextResponse.json(
      {
        success: true,
        data: orders,
        total: orders.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/orders failed:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch orders',
      },
      { status: getStatusFromError(error) }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(AuthOptions);
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateOrderInput;

    // Email авторизованного пользователя имеет приоритет:
    // клиент не может оформить заказ от чужого email,
    // если email уже есть в сессии.
    const payload: CreateOrderInput = {
      ...body,
      customer: {
        ...body.customer,
        email: user.email || body.customer?.email || '',
      },
    };

    await connectToDatabase();

    const order = await orderService.createOrder(user.id, payload);

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/orders failed:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create order',
      },
      { status: getStatusFromError(error) }
    );
  }
}
