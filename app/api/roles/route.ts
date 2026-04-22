import { connectToDatabase } from "@/app/lib/mongoose";
import { rolesService } from "@/app/services/Roles.service";
import { logger } from "@/app/lib/logger";

export async function GET() {
    try {
        await connectToDatabase();
        const roles = await rolesService.getAllRoles();
        return Response.json({ success: true, data: roles });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to get roles',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/*
    Create a new role
    Expected body: {
        name: string (required, unique),
        description: string (required),
        priority: number (required)
    }
    Note: createdAt and updatedAt are set automatically
*/
export async function POST(request: Request) {
    try {
        const body = await request.json();
        logger.info(`API: Received POST request with body - ${JSON.stringify(body)}`);
        await connectToDatabase();
        const newRole = await rolesService.createRole(body);
        return Response.json({ success: true, data: newRole });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to create role',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/*
    Update an existing role
    Expected body: {
        _id: string (required),
        name: string (required, unique),
        description: string (required),
        priority: number (required)
    }
    Note: createdAt and updatedAt are set automatically
*/

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        logger.info(`API: Received PATCH request with body - ${JSON.stringify(body)}`);
        await connectToDatabase();
        const { _id, ...updateData } = body;
        const updatedRole = await rolesService.updateRole(_id, updateData);
        return Response.json({ success: true, data: updatedRole });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to update role',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/*
    Delete a role
    Expected body: {
        _id: string (required)
    }
*/

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        logger.info(`API: Received DELETE request with body - ${JSON.stringify(body)}`);
        await connectToDatabase();
        const deletedRole = await rolesService.deleteRole(body._id);
        return Response.json({ success: true, data: deletedRole });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to delete role',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}