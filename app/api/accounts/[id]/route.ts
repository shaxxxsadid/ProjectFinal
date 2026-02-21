import { connectToDatabase } from "@/app/lib/mongoose";
import { accountsService } from "@/app/services/Account.service";
import { logger } from "@/app/lib/logger";

export async function GET(
    request: Request, 
    { params }: { params: { id: string } }
) {
    try {
        logger.info(`API: Received GET request for account with ID - ${params.id}`);
        await connectToDatabase();
        const accounts = await accountsService.getAccountById(params.id);
        if (!accounts) return Response.json({ success: false, error: 'Account not found' }, { status: 404 });
        return Response.json({ success: true, data: accounts });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to get account by ID',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}