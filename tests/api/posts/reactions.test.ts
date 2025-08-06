import { POST, DELETE } from "@/app/api/posts/[postId]/reactions/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { ReactionType } from "@prisma/client";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    postLike: {
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("POST /api/posts/[postId]/reactions", () => {
  const MOCK_USER_ID = "test-user-id";
  const MOCK_POST_ID = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should upsert a reaction successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.postLike.upsert as jest.Mock).mockResolvedValue({
      userId: MOCK_USER_ID,
      postId: MOCK_POST_ID,
      type: ReactionType.LIKE,
    });

    const req = {
      json: async () => ({ type: ReactionType.LIKE }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        userId: MOCK_USER_ID,
        postId: MOCK_POST_ID,
        type: ReactionType.LIKE,
      })
    );
    expect(prisma.postLike.upsert).toHaveBeenCalledWith({
      where: {
        userId_postId: {
          userId: MOCK_USER_ID,
          postId: MOCK_POST_ID,
        },
      },
      update: {
        type: ReactionType.LIKE,
      },
      create: {
        userId: MOCK_USER_ID,
        postId: MOCK_POST_ID,
        type: ReactionType.LIKE,
      },
    });
  });

  it("should return 401 if unauthorized (no session)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({ type: ReactionType.LIKE }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(prisma.postLike.upsert).not.toHaveBeenCalled();
  });

  it("should return 400 if invalid reaction type", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });

    const req = {
      json: async () => ({ type: "INVALID_TYPE" }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid reaction type" });
    expect(prisma.postLike.upsert).not.toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.postLike.upsert as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {
      json: async () => ({ type: ReactionType.LIKE }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.postLike.upsert).toHaveBeenCalled();
  });
});

describe("DELETE /api/posts/[postId]/reactions", () => {
  const MOCK_USER_ID = "test-user-id";
  const MOCK_POST_ID = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a reaction successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.postLike.delete as jest.Mock).mockResolvedValue({});

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(prisma.postLike.delete).toHaveBeenCalledWith({
      where: {
        userId_postId: {
          userId: MOCK_USER_ID,
          postId: MOCK_POST_ID,
        },
      },
    });
  });

  it("should return 401 if unauthorized (no session)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(prisma.postLike.delete).not.toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.postLike.delete as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.postLike.delete).toHaveBeenCalled();
  });
});
