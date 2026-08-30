import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/app/lib/mongoose';
import { categoryService } from '@/app/services/Category.service';
import { AuthOptions } from '../../auth/[...nextauth]/route';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await connectToDatabase();
  const result = await categoryService.getById(id);

  return NextResponse.json(
    result.success
      ? { success: true, data: result.data }
      : { success: false, error: result.error, code: result.code },
    { status: result.success ? 200 : 404 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(AuthOptions);
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const body = await request.json();
  const result = await categoryService.update(id, body);

  return NextResponse.json(
    result.success
      ? { success: true, data: result.data }
      : { success: false, error: result.error, code: result.code },
    { status: result.success ? 200 : 400 }
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(AuthOptions);
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const result = await categoryService.delete(id);

  return NextResponse.json(
    result.success
      ? { success: true }
      : { success: false, error: result.error, code: result.code },
    { status: result.success ? 200 : 400 }
  );
}
