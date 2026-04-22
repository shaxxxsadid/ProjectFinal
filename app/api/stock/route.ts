import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { stokeService } from "@/app/services/Stoke.service";

export async function GET() {
    try {
        await connectToDatabase();
        const stoke = await stokeService.getAllStoke();
        if (!stoke || stoke.length === 0) return Response.json({ success: false, error: 'Stoke not found' }, { status: 404 });
        return Response.json({ success: true, data: stoke });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

/* 
    Request Body: {
    - code: string
    - name: string
    - type: string
    - managerId: string (reference to User)
    - phone: string
    - email: string
    - maxPallets: number
    - totalAreaSqm: number
    - isActive: boolean
    - createdAt: Date (automatically set)
    - updatedAt: Date (automatically set)
    }
*/
export async function POST(request: Request) {
    const body = await request.json();
    try {
        await connectToDatabase();
        const newStoke = await stokeService.createStoke(body);
        return Response.json({ success: true, data: newStoke });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const body = await request.json();
    try {
        await connectToDatabase();
        const updatedStoke = await stokeService.updateStoke(body._id, body);
        if (!updatedStoke) return Response.json({ success: false, error: 'Stoke not found' }, { status: 404 });
        return Response.json({ success: true, data: updatedStoke });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { _id } = await request.json();
    try {
        await connectToDatabase();
        const deletedStoke = await stokeService.deleteStoke(_id);
        if (!deletedStoke) return Response.json({ success: false, error: 'Stoke not found' }, { status: 404 });
        return Response.json({ success: true, data: deletedStoke });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}
