import {
    authorizationErrorResponse,
    requireAdmin,
} from "@/app/lib/auth/authorization";
import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { warehouseService } from "@/app/services/Warehouse.service";

export async function GET() {
    try {
        await requireAdmin();
        await connectToDatabase();

        const warehouses =
            await warehouseService.getAllWarehouses();

        return Response.json({
            success: true,
            data: warehouses || [],
        });
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `GET /api/warehouse failed: ${
                error instanceof Error ? error.message : error
            }`
        );

        return Response.json(
            {
                success: false,
                error: "Failed to fetch warehouses",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await requireAdmin();
        const body = await request.json();

        await connectToDatabase();

        const newWarehouse =
            await warehouseService.createWarehouse(body);

        return Response.json(
            {
                success: true,
                data: newWarehouse,
            },
            { status: 201 }
        );
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `POST /api/warehouse failed: ${
                error instanceof Error ? error.message : error
            }`
        );

        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create warehouse",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        await requireAdmin();
        const body = await request.json();

        const warehouseId =
            typeof body?._id === "string"
                ? body._id.trim()
                : String(body?._id ?? "").trim();

        if (!warehouseId) {
            return Response.json(
                {
                    success: false,
                    error: "Warehouse id is required",
                },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const updatedWarehouse =
            await warehouseService.updateWarehouse(
                warehouseId,
                body
            );

        if (!updatedWarehouse) {
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
            data: updatedWarehouse,
        });
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `PATCH /api/warehouse failed: ${
                error instanceof Error ? error.message : error
            }`
        );

        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to update warehouse",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        await requireAdmin();
        const body = await request.json();

        const warehouseId =
            typeof body?._id === "string"
                ? body._id.trim()
                : String(body?._id ?? "").trim();

        if (!warehouseId) {
            return Response.json(
                {
                    success: false,
                    error: "Warehouse id is required",
                },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const deletedWarehouse =
            await warehouseService.deleteWarehouse(
                warehouseId
            );

        if (!deletedWarehouse) {
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
            data: deletedWarehouse,
        });
    } catch (error) {
        const authResponse = authorizationErrorResponse(error);

        if (authResponse) {
            return authResponse;
        }

        logger.error(
            `DELETE /api/warehouse failed: ${
                error instanceof Error ? error.message : error
            }`
        );

        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete warehouse",
            },
            { status: 500 }
        );
    }
}
