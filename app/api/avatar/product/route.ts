import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/mongoose";
import { productService } from "@/app/services/Product.service";

interface AvatarPayload {
  data?: unknown;
  type?: string;
  [key: string]: unknown;
}

/** Безопасное извлечение Buffer из любых форматов Mongoose */
function extractBuffer(raw: unknown): Buffer | null {
  if (!raw) return null;
  if (Buffer.isBuffer(raw)) return raw;
  if (raw instanceof Uint8Array) return Buffer.from(raw);
  if (Array.isArray(raw)) return Buffer.from(raw);
  if (raw instanceof ArrayBuffer) return Buffer.from(new Uint8Array(raw));

  // Mongoose Binary / Legacy обёртки
  const obj = raw as Record<string, unknown>;
  const source = obj.buffer ?? obj.data;
  if (source !== undefined && source !== raw) {
    return extractBuffer(source);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'Product id is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    
    const product = await productService.getById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const productAvatar = (await productService.getAvatar(id)) as AvatarPayload | null;
    if (!productAvatar?.data) {
      return NextResponse.json({ success: true, data: null });
    }

    const buffer = extractBuffer(productAvatar.data);
    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const mimeType = productAvatar.type?.trim() || 'image/jpeg';
    const base64 = buffer.toString('base64');
    // Формат: data:<mime>;base64,<data> (без пробелов!)
    const imgSrc = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ success: true, data: imgSrc });
  } catch (error) {
    console.error('Avatar API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}