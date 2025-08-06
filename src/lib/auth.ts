import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions, Session, User, Account, Profile } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    CredentialsProvider({
      name: "Guest",
      credentials: {
        guest: { label: "Guest Mode", type: "boolean" },
      },
                                                                                                            async authorize(credentials) {
        if (credentials?.guest === "true") {
          try {
            const guestUser = await prisma.user.create({
              data: {
                name: `Guest-${Math.random().toString(36).substring(7)}`,
                email: null,
                guest: true,
              },
            });
            return guestUser;
          } catch (error) {
            console.error("Failed to create guest user:", error);
            return null;
          }
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: ({ session, token }: { session: Session; token: JWT }): Session => {
      if (session?.user) {
        session.user.id = token.id;
      }
      return session;
    },
    jwt: async ({ token, user, account: _account, profile: _profile, isNewUser: _isNewUser }: { token: JWT; user?: User | AdapterUser; account?: Account | null; profile?: Profile; isNewUser?: boolean }): Promise<JWT> => {
      if (user) {
        token.id = user.id as number;
      }

      // Fetch user from DB to ensure latest data and correct type
      const dbUser = await prisma.user.findUnique({
        where: {
          id: token.id as number,
        },
      });

      if (!dbUser) {
        return token; // User not found in DB, return existing token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        sub: token.sub, // Preserve sub from original token
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};