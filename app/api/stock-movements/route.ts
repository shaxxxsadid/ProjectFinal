import { NextResponse } from "next/server";

import {
    authorizationErrorResponse,
    requireAdmin,
} from "@/app/lib/auth/authorization";
import { connectToDatabase } from "@/app/lib/mongoose";
import { stockMovementService } from "@/app/services/StockMovement.service";

export async function GET(request: Request) {
    try {
        await requireAdmin();

        const url = new URL(request.url);

        const rawLimit = Number(
            url.searchParams.get("limit") ?? 500
        );

        const limit =
            Number.isFinite(rawLimit)
                ? rawLimit
                : 500;

        await connectToDatabase();

        const movements =
            await stockMovementService.getAllMovements(limit);

        return NextResponse.json(
            {
                success: true,
                data: movements,
            },
            { status: 200 }
        );
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        console.error(
            "GET /api/stock-movements failed:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch stock movements",
            },
            { status: 500 }
        );
    }
}
