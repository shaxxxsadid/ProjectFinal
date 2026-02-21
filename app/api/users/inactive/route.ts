import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { usersService } from "@/app/services/Users.service";

export async function PUT(request: Request) {
    const { _id } = await request.json();
    try {
        await connectToDatabase();
        const activateUser = await usersService.updateActiveStatus(_id, false);
        if (!activateUser) return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        return Response.json({ success: true, data: activateUser });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}