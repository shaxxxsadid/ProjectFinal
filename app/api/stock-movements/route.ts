import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { AuthOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/lib/mongoose';
import { stockMovementService } from '@/app/services/StockMovement.service';

type SessionUser = {
  id?: string;
  role?: string;
};

function canViewStockMovements(
  role: unknown
): boolean {
  if (typeof role !== 'string') {
    return false;
  }

  const normalized =
    role.toLowerCase().trim();

  return (
    normalized === 'admin' ||
    normalized === 'manager'
  );
}

export async function GET(
  request: Request
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
        {
          status: 401,
        }
      );
    }

    if (
      !canViewStockMovements(
        user.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
        },
        {
          status: 403,
        }
      );
    }

    const url = new URL(request.url);

    const rawLimit = Number(
      url.searchParams.get('limit') ?? 500
    );

    const limit = Number.isFinite(rawLimit)
      ? rawLimit
      : 500;

    await connectToDatabase();

    const movements =
      await stockMovementService.getAllMovements(
        limit
      );

    return NextResponse.json(
      {
        success: true,
        data: movements,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/stock-movements failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch stock movements',
      },
      {
        status: 500,
      }
    );
  }
}
