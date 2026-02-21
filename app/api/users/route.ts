import { connectToDatabase } from "@/app/lib/mongoose";
import { logger } from "@/app/lib/logger";
import { usersService } from "@/app/services/Users.service";

export async function GET(){
    try {
        await connectToDatabase();
        const users = await usersService.getAllUsers();
        if (!users || users.length === 0) return Response.json({ success: false, error: 'Users not found' }, { status: 404 });
        return Response.json({ success: true, users });
    }catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    try {
        await connectToDatabase();
        const newUser = await usersService.createUser(body);
        return Response.json({ success: true, data: newUser });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const body = await request.json();
    try {
        await connectToDatabase();
        const updatedUser = await usersService.updateUser(body._id, body);
        if (!updatedUser) return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        return Response.json({ success: true, data: updatedUser });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { _id } = await request.json();
    try {
        await connectToDatabase();
        const deletedUser = await usersService.deleteUser(_id);
        if (!deletedUser) return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        return Response.json({ success: true, data: deletedUser });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}
