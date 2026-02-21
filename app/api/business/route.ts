import { connectToDatabase } from "@/app/lib/mongoose";
import { businessProfileService } from "@/app/services/BusinessProfile.service"; 
import { logger } from "@/app/lib/logger";

export async function GET() {
    try {
        await connectToDatabase();
        const business = await businessProfileService.getAllBusinessProfiles();
        if (!business || business.length === 0) return Response.json({ success: false, error: 'Business profiles not found' }, { status: 404 });
        return Response.json({ success: true, data: business });
    } catch (error) {
        logger.error({
            msg: 'API: Failed to get business profiles',
            error: error instanceof Error ? error.message : error,
        });
        return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    try {
        await connectToDatabase();
        const newBusiness = await businessProfileService.createBusinessProfile(body);
        return Response.json({ success: true, data: newBusiness });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}

/*
    Update an existing business profile
    Expected body: {
        _id: string (required),
        type: enum (required, one of "individual", "company"),
        profileNumber: string (required, unique),
        legalName: string (required),
        taxId: string (required, unique),
        avatar: string (required, valid URL),
        status: enum (required, one of "active", "inactive")
    }
    Note: createdAt and updatedAt are set automatically
*/    
export async function PUT(request: Request) {

    const body = await request.json();
    try {
        await connectToDatabase();
        const updatedBusiness = await businessProfileService.updateBusinessProfile(body._id, body);
        if (!updatedBusiness) return Response.json({ success: false, error: 'Business not found' }, { status: 404 });
        return Response.json({ success: true, data: updatedBusiness });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }

}

/*    Delete a business profile
    Expected body: {
        _id: string (required)
    }
*/
export async function DELETE(request: Request) {
    const { _id } = await request.json();
    try {
        await connectToDatabase();
        const deletedBusiness = await businessProfileService.deleteBusinessProfile(_id);
        if (!deletedBusiness) return Response.json({ success: false, error: 'Business not found' }, { status: 404 });
        return Response.json({ success: true, data: deletedBusiness });
    } catch (error) {
        logger.error(`Failed to connect to database: ${error instanceof Error ? error.message : error}`);
        return Response.json({ success: false, error: 'Failed to connect to database' }, { status: 500 });
    }
}