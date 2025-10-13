import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions, Session, User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { Provider } from "next-auth/providers/index";

const providers: Provider[] = [
  GitHubProvider({
    clientId: process.env.GITHUB_ID as string,
    clientSecret: process.env.GITHUB_SECRET as string,
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_ID as string,
    clientSecret: process.env.GOOGLE_SECRET as string,
  }),
];

if (process.env.NODE_ENV !== 'production') {
  providers.push(
    CredentialsProvider({
      name: 'Mock User',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "test@example.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }
        // Find or create a mock user for testing
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0], // Use part of email as name
              image: `https://source.boringavatars.com/beam/120/${encodeURIComponent(credentials.email)}` // Generate a consistent avatar
            },
          });
        }
        // The authorize callback needs to return an object with a string ID.
        return { ...user, id: user.id.toString() };
      },
    })
  );
}

export const authOptions: AuthOptions = {
  adapter: process.env.NODE_ENV === 'production' ? PrismaAdapter(prisma) : undefined,
  providers: providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: ({ session, token }: { session: Session; token: JWT }): Session => {
      if (session?.user) {
        // Explicitly assign and return the id
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id as number, // Ensure it's a number
          },
        };
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
  secret: process.env.NEXTAUTH_SECRET,
};