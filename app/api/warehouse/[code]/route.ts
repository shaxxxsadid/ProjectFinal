import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { warehouseService } from "@/app/services/Warehouse.service";
import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
): Promise<Response> {
    try {
        const { code } = await params;
        await connectToDatabase();
        const stoke = await warehouseService.getWarehouseByCode(code);
        if (!stoke || stoke.length === 0) return Response.json({ success: false, error: 'Stoke not found' }, { status: 404 });
        return Response.json({ success: true, stoke });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}
    
