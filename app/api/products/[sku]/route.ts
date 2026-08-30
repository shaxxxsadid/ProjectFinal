// app/api/products/[sku]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/app/lib/mongoose';
import { productService } from '@/app/services/Product.service';
import { AuthOptions } from '../../auth/[...nextauth]/route';

const statusFromProductCode = (code?: string) => code === 'NOT_FOUND' ? 404 : 400;

// GET /api/products/[sku] - Получить товар по SKU
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;

    await connectToDatabase();
    const result = await productService.getProductBySku(sku);

    return NextResponse.json(
      result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error, code: result.code },
      { status: result.success ? 200 : statusFromProductCode(result.code) }
    );
  } catch (error) {
    console.error('GET /api/products/[sku] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[sku] - Полное обновление товара по SKU
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;

    const session = await getServerSession(AuthOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const result = await productService.updateProductBySku(sku, body);

    return NextResponse.json(
      result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error, code: result.code },
      { status: result.success ? 200 : statusFromProductCode(result.code) }
    );
  } catch (error) {
    console.error('PUT /api/products/[sku] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[sku] - Частичное обновление по SKU
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;

    const session = await getServerSession(AuthOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const result = await productService.updateProductBySku(sku, body);

    return NextResponse.json(
      result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error, code: result.code },
      { status: result.success ? 200 : statusFromProductCode(result.code) }
    );
  } catch (error) {
    console.error('PATCH /api/products/[sku] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
