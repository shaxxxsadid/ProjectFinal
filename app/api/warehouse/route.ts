import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { warehouseService } from "@/app/services/Warehouse.service";

export async function GET() {
    try {
        await connectToDatabase();
        const warehouses = await warehouseService.getAllWarehouses();
        return Response.json({ success: true, warehouses: warehouses || [] });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    try {
        await connectToDatabase();
        const newWarehouse = await warehouseService.createWarehouse(body);
        return Response.json({ success: true, data: newWarehouse });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function PUT(request: Request) { 
    const body = await request.json();
    try {
        await connectToDatabase();
        const updatedWarehouse = await warehouseService.updateWarehouse(body._id, body);
        if (!updatedWarehouse) return Response.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
        return Response.json({ success: true, data: updatedWarehouse });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { _id } = await request.json();
    try {
        await connectToDatabase();
        const deletedWarehouse = await warehouseService.deleteWarehouse(_id);
        if (!deletedWarehouse) return Response.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
        return Response.json({ success: true, data: deletedWarehouse });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}