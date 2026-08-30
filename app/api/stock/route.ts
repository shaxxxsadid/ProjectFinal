import {
    authorizationErrorResponse,
    requireAdmin,
} from "@/app/lib/auth/authorization";
import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { stockMovementService } from "@/app/services/StockMovement.service";
import { stokeService } from "@/app/services/Stoke.service";
import type {
    StockMutationResult,
    StockQuantitySnapshot,
} from "@/types/stockMovement.types";

function toSnapshot(value: {
    quantity?: unknown;
    reserved?: unknown;
    available?: unknown;
}): StockQuantitySnapshot {
    return {
        quantity: Number(value.quantity) || 0,
        reserved: Number(value.reserved) || 0,
        available: Number(value.available) || 0,
    };
}

function toMovementMutation(
    stock: {
        _id: unknown;
        productId?: unknown;
        warehouseId?: unknown;
        batchNumber?: unknown;
    },
    before: StockQuantitySnapshot,
    after: StockQuantitySnapshot
): StockMutationResult {
    return {
        stockId: String(stock._id),
        productId: String(stock.productId ?? ""),
        warehouseId: String(stock.warehouseId ?? ""),
        batchNumber: String(stock.batchNumber ?? ""),
        quantity: Math.max(
            Math.abs(after.quantity - before.quantity),
            Math.abs(after.reserved - before.reserved),
            Math.abs(after.available - before.available)
        ),
        before,
        after,
    };
}

async function writeManualMovementSafely(input: {
    type: "receipt" | "adjustment";
    actorId: string;
    mutation: StockMutationResult;
}): Promise<boolean> {
    try {
        return await stockMovementService.recordManualMovement(input);
    } catch (error) {
        logger.error(
            `Critical: stock changed, but StockMovement was not written: ${
                error instanceof Error ? error.message : error
            }`
        );

        return false;
    }
}

export async function GET() {
    try {
        await requireAdmin();
        await connectToDatabase();

        const stoke = await stokeService.getAllStoke();

        if (!stoke || stoke.length === 0) {
            return Response.json(
                {
                    success: false,
                    error: "Stoke not found",
                },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            data: stoke,
        });
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `GET /api/stock failed: ${
                error instanceof Error ? error.message : error
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

export async function POST(request: Request) {
    try {
        const admin = await requireAdmin();
        const body = await request.json();

        await connectToDatabase();

        const newStoke = await stokeService.createStoke(body);

        const before: StockQuantitySnapshot = {
            quantity: 0,
            reserved: 0,
            available: 0,
        };

        const after = toSnapshot(newStoke);

        const mutation = toMovementMutation(
            newStoke,
            before,
            after
        );

        const movementLogged = await writeManualMovementSafely({
            type: "receipt",
            actorId: admin.id,
            mutation,
        });

        return Response.json(
            {
                success: true,
                data: newStoke,
                movementLogged,
            },
            { status: 201 }
        );
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `POST /api/stock failed: ${
                error instanceof Error ? error.message : error
            }`
        );

        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create stock",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const admin = await requireAdmin();
        const body = await request.json();

        const stockId =
            typeof body?._id === "string"
                ? body._id.trim()
                : String(body?._id ?? "").trim();

        if (!stockId) {
            return Response.json(
                {
                    success: false,
                    error: "Stock id is required",
                },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const beforeDocument =
            await stokeService.getStokeById(stockId);

        if (!beforeDocument) {
            return Response.json(
                {
                    success: false,
                    error: "Stoke not found",
                },
                { status: 404 }
            );
        }

        const before = toSnapshot(beforeDocument);

        const updatedStoke = await stokeService.updateStoke(
            stockId,
            body
        );

        if (!updatedStoke) {
            return Response.json(
                {
                    success: false,
                    error: "Stoke not found",
                },
                { status: 404 }
            );
        }

        const after = toSnapshot(updatedStoke);

        const mutation = toMovementMutation(
            updatedStoke,
            before,
            after
        );

        const movementLogged = await writeManualMovementSafely({
            type: "adjustment",
            actorId: admin.id,
            mutation,
        });

        return Response.json({
            success: true,
            data: updatedStoke,
            movementLogged,
        });
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `PATCH /api/stock failed: ${
                error instanceof Error ? error.message : error
            }`
        );

        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to update stock",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const admin = await requireAdmin();
        const body = await request.json();

        const stockId =
            typeof body?._id === "string"
                ? body._id.trim()
                : String(body?._id ?? "").trim();

        if (!stockId) {
            return Response.json(
                {
                    success: false,
                    error: "Stock id is required",
                },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const beforeDocument =
            await stokeService.getStokeById(stockId);

        if (!beforeDocument) {
            return Response.json(
                {
                    success: false,
                    error: "Stoke not found",
                },
                { status: 404 }
            );
        }

        const before = toSnapshot(beforeDocument);

        const deletedStoke =
            await stokeService.deleteStoke(stockId);

        if (!deletedStoke) {
            return Response.json(
                {
                    success: false,
                    error: "Stoke not found",
                },
                { status: 404 }
            );
        }

        const after: StockQuantitySnapshot = {
            quantity: 0,
            reserved: 0,
            available: 0,
        };

        const mutation = toMovementMutation(
            deletedStoke,
            before,
            after
        );

        const movementLogged = await writeManualMovementSafely({
            type: "adjustment",
            actorId: admin.id,
            mutation,
        });

        return Response.json({
            success: true,
            data: deletedStoke,
            movementLogged,
        });
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `DELETE /api/stock failed: ${
                error instanceof Error ? error.message : error
            }`
        );

        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete stock",
            },
            { status: 500 }
        );
    }
}
