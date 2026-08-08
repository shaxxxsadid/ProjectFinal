// app/api/products/[sku]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/app/services/Product.service';
import { getServerSession } from 'next-auth';
import { AuthOptions } from '../../auth/[...nextauth]/route';

// GET /api/products/[sku] - Получить товар по SKU
export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const result = await productService.getProductBySku(params.sku);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code === 'NOT_FOUND' ? 404 : 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/products/[sku] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[sku] - Полное обновление товара
export async function PUT(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const session = await getServerSession(AuthOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await productService.updateProduct(params.sku, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('PUT /api/products/[sku] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[sku] - Частичное обновление
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const session = await getServerSession(AuthOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await productService.updateProduct(params.sku, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('PATCH /api/products/[sku] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
