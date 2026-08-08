import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { productService } from "@/app/services/Product.service";

export async function GET() {
    try {
        await connectToDatabase();
        const products = await productService.getAllProducts();
        return Response.json({ success: true, data: products, total: products.length }, { status: 200 });
    } catch (error) {
        logger.error(`GET /api/products failed: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const productData = await request.json();
        const newProduct = await productService.createProduct(productData);
        return Response.json({ success: true, data: newProduct }, { status: 201 });
    } catch (error) {
        logger.error(`POST /api/products failed: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to create product' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        await connectToDatabase();
        const productData = await request.json();
        const updatedProduct = await productService.updateProduct(productData._id, productData);

        if (!updatedProduct) {
            return Response.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        const productObj = updatedProduct.toObject();
        const productWithAvatarUrl = {
            ...productObj,
            avatarUrl: updatedProduct.avatar?.data
                ? `data:${updatedProduct.avatar.type || 'image/png'};base64,${updatedProduct.avatar.data.toString('base64')}`
                : null,
        };

        return Response.json({ success: true, data: productWithAvatarUrl }, { status: 200 });
    } catch (error) {
        logger.error(`PATCH /api/products failed: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await connectToDatabase();
        const { _id } = await request.json();
        const deletedProduct = await productService.deleteProduct(_id);
        if (!deletedProduct) {
            return Response.json({ success: false, error: 'Product not found' }, { status: 404 });
        }
        return Response.json({ success: true, data: deletedProduct }, { status: 200 });
    } catch (error) {
        logger.error(`DELETE /api/products failed: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
    }
}