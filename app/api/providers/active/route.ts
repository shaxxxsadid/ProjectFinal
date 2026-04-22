import { logger } from "@/app/lib/logger";
import { connectToDatabase } from "@/app/lib/mongoose";
import { providersService } from "@/app/services/Providers.service";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { _id, active } = body; 

        if (!_id || typeof active !== "boolean") {
            return NextResponse.json({ error: "Invalid payload: _id and active are required" }, { status: 400 });
        }

        await connectToDatabase();
        const updatedProvider = await providersService.toggleActiveProvider(_id, active);

        return NextResponse.json({ success: true, data: updatedProvider }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to toggle provider: ${message}`);
        
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}