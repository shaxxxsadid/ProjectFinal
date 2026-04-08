import { connectToDatabase } from "@/app/lib/mongoose";
import { usersService } from "@/app/services/Users.service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { AuthOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json(
            { success: false, error: 'User email is required' },
            { status: 400 }
        );
    }

    try {
        await connectToDatabase();
        

        const user = await usersService.getUserByEmail(email);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const userAvatar = await usersService.getAvatar(email);

        // 🟡 Аватара нет — это ОК, возвращаем пустой успех
        if (!userAvatar?.data) {
            return NextResponse.json({ 
                success: true, 
                data: null,
                message: 'Product found, but no avatar available'
            });
        }

        // 🟢 Аватар есть — конвертируем в base64
        const bufferArray = userAvatar.data.data || userAvatar.data;
        
        if (!bufferArray || bufferArray.length === 0) {
            return NextResponse.json({ 
                success: true, 
                data: null 
            });
        }

        const base64 = Buffer.from(bufferArray).toString('base64');
        const mimeType = userAvatar.type || 'image/png';
        const imgSrc = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({ 
            success: true, 
            data: imgSrc 
        });

    } catch (error) {
        console.error('Avatar API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(AuthOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const { avatar } = await req.json();

    await usersService.updateUserAvatar(session.user.email, avatar);
    console.log(`Avatar updated for ${session.user.email} to ${avatar}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}