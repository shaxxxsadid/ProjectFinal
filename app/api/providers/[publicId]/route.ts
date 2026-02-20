import { connectToDatabase } from "@/app/lib/mongoose";
import { logger } from "@/app/lib/logger";
import { providersService } from "@/app/services/Providers.service";

export async function GET(
    request: Request,
    { params }: { params:  Promise<{ publicId: string }>} 
){
    try {
        await connectToDatabase();
        const providers = await providersService.getProviderByPublicId((await params).publicId);
        return new Response(JSON.stringify(providers), { status: 200 });
    } catch (error) { 
        logger.error(`Failed to fetch provider by publicId: ${error instanceof Error ? error.message : error}`);
        return new Response(JSON.stringify({ error: 'Failed to fetch provider by publicId' }), { status: 500 });
    }
}