import { NextRequest } from "next/server";

import {
    authorizationErrorResponse,
    requireAdmin,
} from "@/app/lib/auth/authorization";
import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { stokeService } from "@/app/services/Stoke.service";

export async function GET(
    _request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            productId: string;
        }>;
    }
): Promise<Response> {
    try {
        await requireAdmin();

        const { productId } = await params;

        await connectToDatabase();

        const stoke =
            await stokeService.getStokeByProductId(
                productId
            );

        if (!stoke) {
            return Response.json(
                {
                    success: false,
                    error: "Stoke not found",
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                stoke,
            },
            { status: 200 }
        );
    } catch (error) {
        const authResponse =
            authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `GET /api/stock/productId/[productId] failed: ${
                error instanceof Error
                    ? error.message
                    : error
            }`
        );

        return Response.json(
            {
                success: false,
                error: "Failed to fetch stock",
            },
            { status: 500 }
        );
    }
}
