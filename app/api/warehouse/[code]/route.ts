import { NextRequest } from "next/server";

import {
    authorizationErrorResponse,
    requireAdmin,
} from "@/app/lib/auth/authorization";
import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { warehouseService } from "@/app/services/Warehouse.service";

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ code: string }>;
    }
): Promise<Response> {
    try {
        await requireAdmin();

        const { code } = await params;

        await connectToDatabase();

        const warehouse =
            await warehouseService.getWarehouseByCode(code);

        if (
            !warehouse ||
            (Array.isArray(warehouse) && warehouse.length === 0)
        ) {
            return Response.json(
                {
                    success: false,
                    error: "Warehouse not found",
                },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            data: warehouse,
        });
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `GET /api/warehouse/[code] failed: ${
                error instanceof Error ? error.message : error
            }`
        );

        return Response.json(
            {
                success: false,
                error: "Failed to fetch warehouse",
            },
            { status: 500 }
        );
    }
}
