// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            username: string;
            role: string;
            businessProfileId?: string;
            avatar?: string;
            createdAt?: Date;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        id: string;
        email: string;
        username: string;
        role: string;
        businessProfileId?: string;
        avatar?: string;
        createdAt?: Date;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends NextAuthJWT {
        id: string;
        email: string;
        username: string;
        role: string;
        businessProfileId?: string;
        avatar?: string;
        createdAt?: Date;
        provider?: string;
        accessToken?: string;
        accessTokenExpires?: number;
    }
}