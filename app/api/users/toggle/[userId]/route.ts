import { connectToDatabase } from "@/app/lib/mongoose";
import { usersService } from "@/app/services/Users.service";
import { NextRequest } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        await connectToDatabase();
        const toggledUser = await usersService.toggleUserActive(userId);
        return Response.json(toggledUser);
    } catch (error) {
        return Response.json({ error: 'Failed to toggle user' }, { status: 500 });
    }
}