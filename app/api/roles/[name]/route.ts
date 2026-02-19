import { rolesService } from "@/app/services/Roles.service";
import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
export async function GET(
    request: Request,
    { params }: { params:  Promise<{ name: string }>}
){
    try {
        const paramsData = await params;
        const name = paramsData.name;
        logger.info(`API: Received GET request with name - ${name}`);
        await connectToDatabase();
        const roles = await rolesService.getRoleByName(name || '');
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