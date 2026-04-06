import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface User {
        id?: string;
        username?: string;
        role?: string;
        businessProfileId?: string;
        passwordHash?: string;
        isActive?: boolean;
    }
    
    interface Session {
        user: {
            id?: string;
            username?: string;
            role?: string;
            avatar?: {
                filename: string;
                type: string;
                data: Buffer;
            };
            linkedProviders?: {
                id: string;
                provider: string;
            }
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        roleId?: string;
        role?: string;
        accessToken?: string;
        avatar?: string;
        username?: string;
    }
}
