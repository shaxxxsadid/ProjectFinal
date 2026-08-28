// app/api/orders/[id]/eligible-warehouses/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/lib/mongoose';
import { orderService } from '@/app/services/Order.service';
import {
  stokeService,
  StokeReservationError,
} from '@/app/services/Stoke.service';

type SessionUser = {
  id?: string;
  role?: string;
};

type RouteContext = {
  params:
    | Promise<{ id: string }>
    | { id: string };
};

function canViewAdminOrders(role: unknown): boolean {
  if (typeof role !== 'string') return false;

  const normalized = role.toLowerCase().trim();

  return (
    normalized === 'admin' ||
    normalized === 'manager'
  );
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const session =
      await getServerSession(AuthOptions);

    const user = session?.user as
      | SessionUser
      | undefined;

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!canViewAdminOrders(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
        },
        { status: 403 }
      );
    }

    const { id } = await Promise.resolve(
      context.params
    );

    await connectToDatabase();

    const order =
      await orderService.getOrderById(id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Выбор склада нужен только до подтверждения.
    if (order.status !== 'new') {
      return NextResponse.json(
        {
          success: true,
          data: {
            warehouseIds: order.warehouseId
              ? [String(order.warehouseId)]
              : [],
          },
        },
        { status: 200 }
      );
    }

    const warehouseIds =
      await stokeService.getEligibleWarehouseIds(
        order.items.map((item: { productId: string; quantity: number; name: string; }) => ({
          productId: String(item.productId),
          quantity: Number(item.quantity),
          name: String(item.name),
        }))
      );

    return NextResponse.json(
      {
        success: true,
        data: {
          warehouseIds,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET /api/orders/[id]/eligible-warehouses failed:',
      error
    );

    if (error instanceof StokeReservationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check eligible warehouses',
      },
      { status: 500 }
    );
  }
}
