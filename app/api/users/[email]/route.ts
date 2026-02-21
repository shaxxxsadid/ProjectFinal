import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { usersService } from "@/app/services/Users.service";

export async function GET(request: Request, 
    { params }: {
         params: Promise<{ email: string }> 
        }) {
    try {
        const paramsData = await params;
        const email = paramsData.email;
        logger.info(`API: Received GET request with email - ${email}`);
        await connectToDatabase();
        const user = await usersService.getUserByEmail(email || '');
        if (!user) return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        return Response.json({ success: true, data: user });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to get user by email',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }

}