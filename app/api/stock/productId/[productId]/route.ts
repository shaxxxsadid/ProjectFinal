import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { stokeService } from "@/app/services/Stoke.service";

export async function GET(request: Request,
    { params }: { params: { productId: string } }) {
    try {
        await connectToDatabase();
        const stoke = await stokeService.getStokeByProductId(params.productId);
        if (!stoke) return Response.json({ success: false, error: 'Stoke not found' }, { status: 404 });
        return Response.json({ success: true, stoke });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}