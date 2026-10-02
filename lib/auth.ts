import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import crypto from "node:crypto";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser, getPrimaryWorkspace } from "@/lib/workspace";
import { getRedisConnection } from "@/lib/queue/client";

function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || typeof password !== "string") {
    return false;
  }
  const passwordBuffer = Buffer.from(password, "utf8");
  const adminBuffer = Buffer.from(adminPassword, "utf8");
  if (passwordBuffer.length !== adminBuffer.length) {
    crypto.timingSafeEqual(passwordBuffer, passwordBuffer);
    return false;
  }
  return crypto.timingSafeEqual(passwordBuffer, adminBuffer);
}

export const authConfig = {
  providers: [
    Credentials({
      id: "credentials",
      name: "Owner Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const password = credentials?.password;
        if (typeof password !== "string") {
          return null;
        }

        // Rate limiting check via Redis
        let redis = null;
        try {
          redis = getRedisConnection();
        } catch {
          // If Redis is not yet initialized or reachable, proceed with password verification
        }

        const attemptKey = "login:admin:attempts";
        const lockoutKey = "login:admin:locked";

        if (redis) {
          try {
            const isLocked = await redis.get(lockoutKey);
            if (isLocked) {
              throw new Error("Too many failed attempts. Locked out for 15 minutes.");
            }
          } catch (err: unknown) {
            if (err instanceof Error && err.message.includes("Too many failed attempts")) {
              throw err;
            }
          }
        }

        const isValid = verifyAdminPassword(password);
        if (!isValid) {
          if (redis) {
            try {
              const attempts = await redis.incr(attemptKey);
              if (attempts === 1) {
                await redis.expire(attemptKey, 900); // 15 minutes window
              }
              if (attempts >= 5) {
                await redis.set(lockoutKey, "1", "EX", 900); // 15 minutes lockout
                await redis.del(attemptKey);
                throw new Error("Too many failed attempts. Locked out for 15 minutes.");
              }
            } catch (err: unknown) {
              if (err instanceof Error && err.message.includes("Too many failed attempts")) {
                throw err;
              }
            }
          }
          return null;
        }

        // Authentication successful - reset failure counter
        if (redis) {
          try {
            await redis.del(attemptKey);
            await redis.del(lockoutKey);
          } catch {
            // Ignore Redis cleanup error
          }
        }

        const email = "owner@openreply.local";
        const name = "Admin Owner";

        let user = await prisma.user.findFirst({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
            },
          });
        }

        await ensureWorkspaceForUser(user.id, user.email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.email = (token.email as string) ?? "owner@openreply.local";
        session.user.name = (token.name as string) ?? "Admin Owner";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getCurrentWorkspaceId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const workspace = await getPrimaryWorkspace(userId);
  if (workspace) return workspace.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const createdWorkspace = await ensureWorkspaceForUser(userId, user?.email);
  return createdWorkspace.id;
}
