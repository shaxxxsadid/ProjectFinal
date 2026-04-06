import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/mongoose";
import { productService } from "@/app/services/Product.service";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json(
            { success: false, error: 'Product id is required' },
            { status: 400 }
        );
    }

    try {
        await connectToDatabase();
        
        // Получаем продукт (не аватар сразу)
        const product = await productService.getById(id);

        // ❌ 404 только если продукта НЕТ в базе
        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        // ✅ Продукт есть — пробуем получить аватар
        const productAvatar = await productService.getAvatar(id);

        // 🟡 Аватара нет — это ОК, возвращаем пустой успех
        if (!productAvatar?.data) {
            return NextResponse.json({ 
                success: true, 
                data: null,
                message: 'Product found, but no avatar available'
            });
        }

        // 🟢 Аватар есть — конвертируем в base64
        const bufferArray = productAvatar.data.data || productAvatar.data;
        
        if (!bufferArray || bufferArray.length === 0) {
            return NextResponse.json({ 
                success: true, 
                data: null 
            });
        }

        const base64 = Buffer.from(bufferArray).toString('base64');
        const mimeType = productAvatar.type || 'image/png';
        const imgSrc = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({ 
            success: true, 
            data: imgSrc 
        });

    } catch (error) {
        console.error('Avatar API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}