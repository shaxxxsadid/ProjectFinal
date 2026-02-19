import { connectToDatabase } from "@/app/lib/mongoose";

export async function GET(request: Request) {
    try {
        await connectToDatabase();
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ success: false });
    }
}    