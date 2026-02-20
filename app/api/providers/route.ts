import { connectToDatabase } from "@/app/lib/mongoose";
import { logger } from "@/app/lib/logger";
import { providersService } from "@/app/services/Providers.service";

export async function GET() {
    try {
        await connectToDatabase();
        const providers = await providersService.getAllProviders();
        return new Response(JSON.stringify(providers), { status: 200 });
    } catch (error) { 
        logger.error(`Failed to fetch providers: ${error instanceof Error ? error.message : error}`);
        return new Response(JSON.stringify({ error: 'Failed to fetch providers' }), { status: 500 });
    }
}

export async function PUT (request: Request) {
    const { _id, name, displayName, isActive } = await request.json();
    try {
        await connectToDatabase();
        const updatedProvider = await providersService.updateProvider(_id, name, { displayName, isActive });
        if (!updatedProvider) {
            return new Response(JSON.stringify({ error: 'Provider not found' }), { status: 404 });
        }
        return new Response(JSON.stringify(updatedProvider), { status: 200 });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return new Response(JSON.stringify({ error: 'Failed to connect to database' }), { status: 500 });
    }
}

export async function DELETE (request: Request) {
    const { _id } = await request.json();
    try {
        await connectToDatabase();
        const deletedProvider = await providersService.deleteProvider(_id);
        if (!deletedProvider) {
            return new Response(JSON.stringify({ error: 'Provider not found' }), { status: 404 });
        }
        return new Response(JSON.stringify(deletedProvider), { status: 200 });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return new Response(JSON.stringify({ error: 'Failed to connect to database' }), { status: 500 });
    }   
}