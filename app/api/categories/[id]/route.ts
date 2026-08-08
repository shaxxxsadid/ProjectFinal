import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/app/services/Category.service';
import { getServerSession } from 'next-auth';
import { AuthOptions } from '../../auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await categoryService.getById(params.id);
  return NextResponse.json(
    result.success ? result.data : { error: result.error },
    { status: result.success ? 200 : 404 }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(AuthOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = await categoryService.update(params.id, body);

  return NextResponse.json(
    result.success ? result.data : { error: result.error },
    { status: result.success ? 200 : 400 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(AuthOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await categoryService.delete(params.id);
  return NextResponse.json(
    result.success ? { success: true } : { error: result.error },
    { status: result.success ? 200 : 400 }
  );
}