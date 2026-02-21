import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { productService } from "@/app/services/Product.service";

export async function GET(request: Request, 
    { params }: { params: { sku: string } }) {
    try {
        await connectToDatabase();
        const product = await productService.getProductBySku(params.sku);
        if (!product) return Response.json({ success: false, error: 'Product not found' }, { status: 404 });
        return Response.json({ success: true, data: product });
    } catch (error) {
        logger.error(`Failed to get product by SKU: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to get product by SKU' }, { status: 500 });
    }
}