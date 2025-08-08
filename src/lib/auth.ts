import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions, Session, User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
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
    jwt: async ({ token, user }: { token: JWT; user?: User | AdapterUser }): Promise<JWT> => {
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