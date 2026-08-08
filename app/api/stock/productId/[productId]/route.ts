import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { stokeService } from "@/app/services/Stoke.service";
import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
): Promise<Response> {
    try {
        const { productId } = await params;
        await connectToDatabase();
        const stoke = await stokeService.getStokeByProductId(productId);
        if (!stoke) return Response.json({ success: false, error: 'Stoke not found' }, { status: 404 });
        return Response.json({ success: true, stoke });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}