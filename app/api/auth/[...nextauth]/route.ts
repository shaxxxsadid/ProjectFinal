import NextAuth, { NextAuthOptions, User } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import YandexProvider from "next-auth/providers/yandex";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/app/lib/mongoose";
import { rolesService } from "@/app/services/Roles.service";
import { Users } from "@/app/models/Users";

export const AuthOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
        }),
        YandexProvider({
            clientId: process.env.YANDEX_ID!,
            clientSecret: process.env.YANDEX_SECRET!,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: 'Email' },
                password: { label: 'Password', type: 'password', placeholder: 'Password' },
            },
            async authorize(credentials) {
                await connectToDatabase();
                try {
                    if (!credentials?.email || !credentials?.password) {
                        console.log("[Auth] Missing credentials");
                        return null;
                    }

                    const user = await Users.findOne({ email: credentials.email });
                    if (!user) {
                        console.log("[Auth] User not found in DB");
                        return null;
                    }

                    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
                    if (!isValidPassword) {
                        console.log("[Auth] Invalid password");
                        return null;
                    }

                    if (!user.roleId) {
                        console.log("[Auth] User has no role");
                        return null;
                    }
                    console.log("[Auth] User authorized", user);
                    const role = await rolesService.getRoleById(user.roleId.toString());

                    return {
                        id: String(user._id),
                        email: user.email,
                        role: role.name,
                        businessProfileId: user.businessProfileId?.toString(),
                        username: `${user.firstName} ${user.lastName}`,
                        passwordHash: user.passwordHash,
                        createdAt: user.createdAt
                    };
                } catch (error) {
                    console.error("Credentials authorize error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // Передаем только безопасные поля
                token.id = user.id;
                token.email = user.email;
                token.role = user.role;
                token.businessProfileId = user.businessProfileId;
                token.username = user.username;
                token.passwordHash = user.passwordHash;
                token.createdAt = user.createdAt;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.role = token.role as string;
                session.user.businessProfileId = token.businessProfileId as string;
                session.user.username = token.username as string;
                session.user.passwordHash = token.passwordHash as string;
                session.user.createdAt = token.createdAt as Date;
            }
            return session;
        },
        async signIn({ user, account, profile, email }) {
            try {

                if (account?.provider === 'credentials') {
                    if (!user?.email) {
                        console.warn('[SignIn] Credentials: No email in user object');
                        return false;
                    }

                    return true;
                }

                if (account?.provider === 'google' || account?.provider === 'github' || account?.provider === 'yandex') {

                    if (!user.email) {
                        console.warn(`[SignIn] OAuth ${account.provider}: Missing email`);
                        return false;
                    }

                    return true;
                }

                console.log(`[SignIn] Unknown provider: ${account?.provider}`);
                return true;

            } catch (error) {
                console.error('[SignIn] Critical error:', error);
                return false;
            }
        },
    },
    pages: {
        signIn: '/pages/login',
        signOut: '/auth/signout',
    },
}

const handler = NextAuth(AuthOptions);

export { handler as GET, handler as POST };