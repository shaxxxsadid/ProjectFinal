import { connectToDatabase } from "@/app/lib/mongoose";
import { usersService } from "@/app/services/Users.service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { AuthOptions } from "../../auth/[...nextauth]/route";
import { IAvatar } from "@/types/dbData";

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
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await req.json();
        const { avatar } = body;

        if (!avatar) {
            return NextResponse.json({ error: 'Avatar is required' }, { status: 400 });
        }

        // If client sent a data URL string (data:<mime>;base64,<data>) — convert it to Buffer
        const targetId = body._id;
        if (typeof avatar === 'string' && avatar.startsWith('data:')) {
            const parts = avatar.split(',');
            const meta = parts[0];
            const base64Data = parts[1];
            const mimeMatch = meta.match(/data:(.*);base64/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
            const buffer = Buffer.from(base64Data, 'base64');
            const avatarObj: IAvatar = {
                fileName: `${targetId || session.user.email}-avatar-${Date.now()}`,
                type: mimeType,
                data: buffer,
            };

            if (targetId) {
                const updatedUser = await usersService.updateUserAvatarById(targetId, avatarObj);
                return NextResponse.json({ success: true, user: updatedUser });
            } else {
                const updatedUser = await usersService.updateUserAvatar(session.user.email, avatarObj);
                return NextResponse.json({ success: true, user: updatedUser });
            }
            
        }

        // If client sent an object with fileName/type/data (data may be array or Buffer-like)
        if (typeof avatar === 'object') {
            let dataBuffer: Buffer | undefined = undefined;
            // avatar.data might be an array of numbers
            if (Array.isArray(avatar.data)) {
                dataBuffer = Buffer.from(avatar.data);
            } else if (typeof avatar.data === 'string' && avatar.data.startsWith('data:')) {
                const parts = (avatar.data as string).split(',');
                dataBuffer = Buffer.from(parts[1], 'base64');
            } else if (avatar.data && Buffer.isBuffer(avatar.data)) {
                dataBuffer = avatar.data;
            }

            const avatarObj: IAvatar = {
                fileName: avatar.fileName || `${targetId || session.user.email}-avatar-${Date.now()}`,
                type: avatar.type || 'image/png',
                data: dataBuffer || Buffer.from(''),
            };

            if (targetId) {
                await usersService.updateUserAvatarById(targetId, avatarObj);
            } else {
                await usersService.updateUserAvatar(session.user.email, avatarObj);
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid avatar format' }, { status: 400 });
    } catch (error) {
        console.error('❌ Avatar update failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update avatar' },
            { status: 500 }
        );
    }
}