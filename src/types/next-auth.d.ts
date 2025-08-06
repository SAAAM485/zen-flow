import { DefaultSession } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number; // Changed from string to number
    } & DefaultSession["user"];
  }

  interface User {
    id: number; // Ensure User object from authorize has number id
  }
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id: number; // Changed from string to number
    picture?: string | null;
  }
}
