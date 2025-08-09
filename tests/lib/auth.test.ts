import { authOptions } from "@/lib/auth";
import { JWT } from "next-auth/jwt";
import { AdapterUser } from "next-auth/adapters";
import { Session, User } from "next-auth";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));







describe("authOptions callbacks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("session callback", () => {
    it("should set session.user.id from token.id", async () => {
      const mockToken: JWT = { id: 123, sub: "123" };
      const mockSession: Session = { user: { id: 0 }, expires: "" };

      const resultSession = await authOptions.callbacks?.session!({
        session: mockSession,
        token: mockToken,
        user: { id: "123" } as AdapterUser, // user is present on initial sign-in
        newSession: {} as any,
        trigger: "update" as any,
      }) as Session;

      expect(resultSession.user?.id).toBe(123);
    });

    

    
  });

  describe("jwt callback", () => {
    it("should set token.id from user.id when user is provided (initial sign-in)", async () => {
      const mockUser: User = { id: 123 };
      const mockToken: JWT = { id: 0, sub: "0" }; // Initial token might not have id

      const resultToken = await authOptions.callbacks?.jwt!({
        token: mockToken,
        user: mockUser,
        account: null,
      }) as JWT;

      expect(resultToken.id).toBe(123);
    });

    it("should update token with user info from DB when user is not provided (subsequent requests)", async () => {
      const mockToken: JWT = { id: 123, sub: "123", name: "Old Name", email: "old@example.com" };
      const dbUser = {
        id: 123,
        name: "New Name",
        email: "new.email@example.com",
        image: "new.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser);

      const resultToken = await authOptions.callbacks?.jwt!({
        token: mockToken,
        user: undefined as any, // Explicitly pass undefined for user
        account: null,
      }) as JWT;

      expect(resultToken).toEqual({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        sub: mockToken.sub, // sub should persist
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
      });
    });

    it("should return existing token if user not found in DB", async () => {
      const mockToken: JWT = { id: 123, sub: "123", name: "Test User" };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const resultToken = await authOptions.callbacks?.jwt!({
        token: mockToken,
        user: undefined as any, // Explicitly pass undefined for user
        account: null,
      }) as JWT;

      expect(resultToken).toEqual(mockToken);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
      });
    });
  });
});

