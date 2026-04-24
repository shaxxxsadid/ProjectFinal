import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { productService } from "@/app/services/Product.service";

export async function GET() {
    try {
        await connectToDatabase();
        const products = await productService.getAllProducts();
        if (!products || products.length === 0) {
            return new Response(JSON.stringify({ error: 'Products not found' }), { status: 404 });
        }
        return new Response(JSON.stringify(products), { status: 200 });
    } catch (error) {
        logger.error(`GET /api/products failed: ${error instanceof Error ? error.message : error}`);
        return new Response(JSON.stringify({ error: 'Failed to fetch products' }), { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const productData = await request.json();
        const newProduct = await productService.createProduct(productData);
        return new Response(JSON.stringify(newProduct), { status: 201 });
    } catch (error) {
        logger.error(`POST /api/products failed: ${error instanceof Error ? error.message : error}`);
        return new Response(JSON.stringify({ error: 'Failed to create product' }), { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        await connectToDatabase();
        const productData = await request.json();
        const updatedProduct = await productService.updateProduct(productData._id, productData);

        if (!updatedProduct) {
            return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
        }

        // Конверт MongoDB документ в объект + добавляем avatarUrl
        const productObj = updatedProduct.toObject();
        const productWithAvatarUrl = {
            ...productObj,
            // Base64 строку из Buffer для фронтенда
            avatarUrl: updatedProduct.avatar?.data
                ? `data:${updatedProduct.avatar.type || 'image/png'};base64,${updatedProduct.avatar.data.toString('base64')}`
                : null,
        };

        return new Response(JSON.stringify(productWithAvatarUrl), { status: 200 });
    } catch (error) {
        logger.error(`PATCH /api/products failed: ${error instanceof Error ? error.message : error}`);
        return new Response(JSON.stringify({ error: 'Failed to update product' }), { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await connectToDatabase();
        const { _id } = await request.json();
        const deletedProduct = await productService.deleteProduct(_id);
        if (!deletedProduct) {
            return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
        }
        return new Response(JSON.stringify(deletedProduct), { status: 200 });
    } catch (error) {
        logger.error(`DELETE /api/products failed: ${error instanceof Error ? error.message : error}`);
        return new Response(JSON.stringify({ error: 'Failed to delete product' }), { status: 500 });
    }
}
