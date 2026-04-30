// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import YandexProvider from "next-auth/providers/yandex";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { connectToDatabase } from "@/app/lib/mongoose";
import { Users } from "@/app/models/Users";
import { Accounts } from "@/app/models/Accounts";
import { Providers } from "@/app/models/Providers";
import { rolesService } from "@/app/services/Roles.service";
import bcrypt from "bcryptjs";

export const AuthOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: { params: { scope: "read:user user:email" } },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
            authorization: { params: { scope: "openid email profile", prompt: "select_account" } },
        }),
        YandexProvider({
            clientId: process.env.YANDEX_ID!,
            clientSecret: process.env.YANDEX_SECRET!,
            authorization: { params: { scope: "login:email login:info" } },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await connectToDatabase();
                if (!credentials?.email || !credentials?.password) return null;

                const user = await Users.findOne({ email: credentials.email }).lean();
                if (!user || !user.passwordHash) return null;

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (!isValid) return null;
                if (!user.roleId) return null;

                const role = await rolesService.getRoleById(user.roleId.toString());
                if (!role) return null;

                // ✅ Credentials: id сразу правильный MongoDB _id
                return {
                    id: user._id.toString(),
                    email: user.email,
                    username: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0],
                    role: role.name,
                    businessProfileId: user.businessProfileId?.toString(),
                    avatar: user.avatar?.fileName ? `/api/avatar/${user._id}` : undefined,
                    createdAt: user.createdAt,
                };
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },

    pages: {
        signIn: "/pages/login",
        signOut: "/auth/signout",
        error: "/pages/login",
    },

    callbacks: {
        async jwt({ token, user, account }): Promise<JWT> {
            // Этот блок выполняется только при первом логине или обновлении токена с данными пользователя
            if (user) {
                if (account?.provider === "credentials") {
                    // ✅ Credentials: user.id уже MongoDB _id из authorize()
                    token.dbUserId = user.id;
                    token.username = user.username;
                    token.role = user.role;
                    token.businessProfileId = user.businessProfileId;
                    token.avatar = user.avatar;
                    token.createdAt = user.createdAt;
                } else {
                    // ✅ OAuth: Ищем пользователя через Accounts по providerAccountId
                    try {
                        await connectToDatabase();

                        let dbUserId: string | undefined;

                        // 1. Находим документ провайдера
                        const providerDoc = await Providers.findOne({ publicId: account?.provider }).lean();

                        if (providerDoc) {
                            // 2. Ищем привязанный аккаунт по providerAccountId
                            const linkedAccount = await Accounts.findOne({
                                providerId: providerDoc._id,
                                providerAccountId: account?.providerAccountId,
                            }).lean();

                            // 3. Если аккаунт найден, берём userId
                            if (linkedAccount) {
                                dbUserId = linkedAccount.userId.toString();
                                console.log(`[JWT] Found dbUserId via Account: ${dbUserId}`);
                            }
                        }

                        if (dbUserId) {
                            token.dbUserId = dbUserId;

                            const dbUser = await Users.findById(dbUserId)
                                .select('roleId')
                                .lean();

                            if (dbUser && (dbUser as { roleId: string }).roleId) {
                                const role = await rolesService.getRoleById(
                                    (dbUser as { roleId: string }).roleId.toString()
                                );
                                token.role = role?.name;
                            }
                        } else {
                            console.warn('[JWT] Could not find linked account for OAuth user');
                            token.dbUserId = undefined;
                        }
                    } catch (err) {
                        console.error('[JWT] Failed to resolve dbUserId for OAuth user:', err);
                    }
                }

                token.email = user.email;
            }

            // Сохраняем провайдер и токены доступа
            if (account?.provider) {
                token.provider = account.provider;
            }
            if (account?.access_token && account.provider !== "credentials") {
                token.accessToken = account.access_token;
                token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user && token.dbUserId) {
                try {
                    await connectToDatabase();

                    // 🔥 Загружаем СВЕЖИЕ данные из БД по найденному userId
                    const dbUser = await Users.findById(token.dbUserId)
                        .select('_id email firstName lastName avatar roleId businessProfileId createdAt')
                        .lean();

                    if (dbUser) {
                        session.user.id = (dbUser as { _id: string })._id.toString();
                        session.user.email = (dbUser as { email: string }).email;
                        session.user.username = `${(dbUser as { firstName: string }).firstName || ""} ${(dbUser as { lastName: string }).lastName || ""}`.trim()
                            || (dbUser as { email: string }).email?.split("@")[0] || "";
                        session.user.businessProfileId = (dbUser as { businessProfileId: string }).businessProfileId?.toString();
                        session.user.avatar = (dbUser as { avatar: { fileName: string } }).avatar?.fileName
                            ? `/api/avatar/${(dbUser as { _id: string })._id}`
                            : undefined;
                        session.user.createdAt = (dbUser as { createdAt: Date }).createdAt;

                        // Резолвим роль из БД
                        if ((dbUser as { roleId: string }).roleId) {
                            const role = await rolesService.getRoleById((dbUser as { roleId: string }).roleId.toString());
                            session.user.role = role?.name;
                        }
                    }
                } catch (err) {
                    console.error('[Session] Failed to fetch fresh user ', err);
                    // Fallback: если БД недоступна, используем данные из токена (если есть)
                    session.user.id = token.dbUserId as string;
                    session.user.email = token.email as string;
                }
            } else {
                // Если dbUserId нет (ошибка или первый вход без создания юзера), очищаем ID
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                session.user.id = undefined as any;
            }

            return session;
        },

        async signIn({ user, account, profile }): Promise<boolean> {
            try {
                await connectToDatabase();

                if (account?.provider === "credentials") {
                    return !!user.email;
                }

                if (account?.provider && ["google", "github", "yandex"].includes(account.provider)) {
                    const providerName = account.provider;
                    const providerAccountId = account.providerAccountId;
                    const oauthEmail = user.email?.toLowerCase();

                    if (!oauthEmail) {
                        console.warn(`[SignIn] OAuth ${providerName}: Missing email`);
                        return false;
                    }

                    const providersDocEarly = await Providers.findOne({ publicId: providerName }).lean();
                    if (!providersDocEarly) {
                        console.error(`[SignIn] Provider "${providerName}" not found in DB`);
                        return false;
                    }

                    const linkedAccount = await Accounts.findOne({
                        providerId: providersDocEarly._id,
                        providerAccountId,
                    }).lean();

                    let targetUserId: string;

                    if (linkedAccount) {
                        // ✅ Уже есть привязка
                        targetUserId = linkedAccount.userId.toString();
                        console.log(`[SignIn] Found by providerAccountId, userId: ${targetUserId}`);
                    } else {
                        // 🔍 Ищем по email (вдруг пользователь сменил почту в провайдере, но аккаунт наш)
                        const targetUser = await Users.findOne({ email: oauthEmail }).select('_id').lean();

                        if (targetUser) {
                            targetUserId = targetUser._id.toString();
                            console.log(`[SignIn] Found user by email, linking ${providerName} to userId: ${targetUserId}`);
                        } else {
                            // 🆕 Новый пользователь — создаём
                            const defaultRole = await rolesService.getRoleByName("user");
                            if (!defaultRole) {
                                console.error('[SignIn] Default role "user" not found');
                                return false;
                            }

                            const firstName = (profile as { given_name: string })?.given_name || (profile as { first_name: string })?.first_name || (profile as { name: string })?.name?.split(" ")?.[0] || "";
                            const lastName = (profile as { family_name: string })?.family_name || (profile as { last_name: string })?.last_name || (profile as { name: string })?.name?.split(" ")?.[1] || "";

                            const newUser = await Users.create({
                                email: oauthEmail,
                                firstName,
                                lastName,
                                username: (profile as { name: string })?.name || oauthEmail.split("@")[0],
                                roleId: defaultRole._id,
                                isActive: true,
                                avatar: {
                                    fileName: (profile as { picture: string })?.picture || (profile as { avatar_url: string })?.avatar_url || "",
                                    type: "image/jpeg",
                                },
                            });

                            targetUserId = newUser._id.toString();
                            console.log(`[SignIn] Created new user: ${oauthEmail}, userId: ${targetUserId}`);
                        }
                    }

                    // ✅ Upsert аккаунта — привязываем providerAccountId к targetUserId
                    await Accounts.findOneAndUpdate(
                        { userId: targetUserId, providerId: providersDocEarly._id },
                        {
                            type: "oauth",
                            providerAccountId,
                            avatar: (profile as { picture: string })?.picture || (profile as { avatar_url: string })?.avatar_url,
                            accessToken: account.access_token,
                            refreshToken: account.refresh_token,
                            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
                            scope: account.scope,
                        },
                        { upsert: true, returnDocument: 'after' }
                    );

                    console.log(`[SignIn] Successfully linked ${providerName} to userId: ${targetUserId}`);
                    return true;
                }

                console.warn(`[SignIn] Unknown provider: ${account?.provider}`);
                return true;
            } catch (error) {
                console.error("[SignIn] Critical error:", error);
                return false;
            }
        },
    },

    debug: process.env.NODE_ENV === "development",
    logger: {
        error(code, metadata) { console.error(`[NextAuth] ${code}`, metadata); },
        warn(code) { console.warn(`[NextAuth] ${code}`); },
        debug(code, metadata) { if (process.env.NODE_ENV === "development") console.debug(`[NextAuth] ${code}`, metadata); },
    },
};

const handler = NextAuth(AuthOptions);
export { handler as GET, handler as POST };