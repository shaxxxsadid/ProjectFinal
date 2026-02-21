import { connectToDatabase } from "@/app/lib/mongoose";
import { accountsService } from "@/app/services/Account.service";
import { logger } from "@/app/lib/logger";

export async function GET() {
    try {
        logger.info(`API: Received GET request for accounts`);
        await connectToDatabase();
        const accounts = await accountsService.getAllAccounts();
        if (!accounts) return Response.json({ success: false, error: 'No accounts found' }, { status: 404 });
        return Response.json({ success: true, data: accounts });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to get accounts',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    const body = await request.json();
    try {
        logger.info(`API: Received PUT request to update account with data - ${JSON.stringify(body)}`);
        await connectToDatabase();
        const updatedAccount = await accountsService.updateAccount(body._id, body);
        if (!updatedAccount) return Response.json({ success: false, error: 'Account not found' }, { status: 404 });
        return Response.json({ success: true, data: updatedAccount });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to update account',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const { _id } = await request.json();
    try {
        logger.info(`API: Received DELETE request for account with ID - ${_id}`);
        await connectToDatabase();
        const deletedAccount = await accountsService.deleteAccount(_id);
        if (!deletedAccount) return Response.json({ success: false, error: 'Account not found' }, { status: 404 });
        return Response.json({ success: true, data: deletedAccount });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to delete account',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
