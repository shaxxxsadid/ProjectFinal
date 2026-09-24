// app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/app/lib/mongoose';
import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  orderService,
  OrderServiceError,
} from '@/app/services/Order.service';
import type { OrderStatus } from '@/types/store.types';

type SessionUser = {
  id?: string;
  role?: string;
};

type RouteContext = {
  params:
    | Promise<{ id: string }>
    | { id: string };
};

function isAdminRole(role: unknown): boolean {
  return (
    typeof role === 'string' &&
    role.toLowerCase().trim() === 'admin'
  );
}

function getStatusFromError(
  error: unknown
): number {
  if (!(error instanceof OrderServiceError)) {
    return 500;
  }

  switch (error.code) {
    case 'VALIDATION_ERROR':
    case 'INVALID_TRANSITION':
    case 'INVALID_USER':
    case 'WAREHOUSE_REQUIRED':
    case 'INVALID_WAREHOUSE':
    case 'INVALID_PRODUCT':
    case 'INVALID_QUANTITY':
    case 'INVALID_RESERVATION_ITEMS':
      return 400;

    case 'NOT_FOUND':
    case 'PRODUCT_NOT_FOUND':
      return 404;

    case 'FORBIDDEN':
      return 403;

    case 'INSUFFICIENT_STOCK':
    case 'STOCK_CHANGED':
    case 'STOCK_NOT_RESERVED':
    case 'RESERVATION_ALREADY_EXISTS':
      return 409;

    default:
      return 500;
  }
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

    const { id } = await Promise.resolve(
      context.params
    );

    await connectToDatabase();

    const order =
      await orderService.getOrderForRequester(
        id,
        user.id,
        isAdminRole(user.role)
      );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET /api/orders/[id] failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch order',
      },
      {
        status: getStatusFromError(error),
      }
    );
  }
}

export async function PATCH(
  request: Request,
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

    if (!isAdminRole(user.role)) {
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

    const body = (await request.json()) as {
      status?: OrderStatus;
      warehouseId?: string;
    };

    if (!body.status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status is required',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order =
      await orderService.updateOrderStatus(
        id,
        body.status,
        user.id,
        body.warehouseId
      );

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'PATCH /api/orders/[id] failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update order',
      },
      {
        status: getStatusFromError(error),
      }
    );
  }
}
