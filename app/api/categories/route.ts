import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/app/services/Category.service';
import { getServerSession } from 'next-auth';
import { AuthOptions } from '../auth/[...nextauth]/route';

// GET /api/categories?search=xxx&isActive=true
export async function GET(request: NextRequest) {
  const session = await getServerSession(AuthOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter = {
    search: searchParams.get('search') || undefined,
    isActive: searchParams.get('isActive') === 'true' ? true : undefined,
    level: searchParams.get('level') ? Number(searchParams.get('level')) : undefined,
  };

  const result = await categoryService.getAll(filter);
  return NextResponse.json(
    result.success ? result.data : { error: result.error },
    { status: result.success ? 200 : 400 }
  );
}

// POST /api/categories
export async function POST(request: NextRequest) {
  const session = await getServerSession(AuthOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = await categoryService.create(body);

  return NextResponse.json(
    result.success ? result.data : { error: result.error, code: result.code },
    { status: result.success ? 201 : 400 }
  );
}