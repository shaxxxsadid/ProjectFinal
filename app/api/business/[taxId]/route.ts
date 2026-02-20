import { connectToDatabase } from "@/app/lib/mongoose";
import { businessProfileService } from "@/app/services/BusinessProfile.service"; 
import { logger } from "@/app/lib/logger";


/*    Get a business profile by taxId
    Expected params: {
        taxId: string (required)
    }
*/
export async function GET(
    request: Request,
    { params }: { params:  Promise<{ taxId: string }>} 
){
    try {
        await connectToDatabase();
        const business = await businessProfileService.getBusinessProfileByTaxId((await params).taxId);
        if (!business) return Response.json({ success: false, error: 'Business profile not found' }, { status: 404 });
        return Response.json({ success: true, data: business });
    } catch (error) {
        logger.error(`Failed to get business profile by taxId: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to get business profile by taxId' }, { status: 500 });
    }
}