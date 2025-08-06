import { POST, DELETE } from "@/app/api/comments/[commentId]/reactions/route";
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
    commentLike: {
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("POST /api/comments/[commentId]/reactions", () => {
  const MOCK_USER_ID = "test-user-id";
  const MOCK_COMMENT_ID = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should upsert a reaction successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.commentLike.upsert as jest.Mock).mockResolvedValue({
      userId: MOCK_USER_ID,
      commentId: MOCK_COMMENT_ID,
      type: ReactionType.LIKE,
    });

    const req = {
      json: async () => ({ type: ReactionType.LIKE }),
    } as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        userId: MOCK_USER_ID,
        commentId: MOCK_COMMENT_ID,
        type: ReactionType.LIKE,
      })
    );
    expect(prisma.commentLike.upsert).toHaveBeenCalledWith({
      where: {
        userId_commentId: {
          userId: MOCK_USER_ID,
          commentId: MOCK_COMMENT_ID,
        },
      },
      update: {
        type: ReactionType.LIKE,
      },
      create: {
        userId: MOCK_USER_ID,
        commentId: MOCK_COMMENT_ID,
        type: ReactionType.LIKE,
      },
    });
  });

  it("should return 401 if unauthorized (no session)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({ type: ReactionType.LIKE }),
    } as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(prisma.commentLike.upsert).not.toHaveBeenCalled();
  });

  it("should return 400 if invalid reaction type", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });

    const req = {
      json: async () => ({ type: "INVALID_TYPE" }),
    } as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid reaction type" });
    expect(prisma.commentLike.upsert).not.toHaveBeenCalled();
  });

  it("should return 400 if invalid commentId", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });

    const req = {
      json: async () => ({ type: ReactionType.LIKE }),
    } as NextRequest;
    const params = { commentId: "invalid" };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid comment ID" });
    expect(prisma.commentLike.upsert).not.toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.commentLike.upsert as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {
      json: async () => ({ type: ReactionType.LIKE }),
    } as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.commentLike.upsert).toHaveBeenCalled();
  });
});

describe("DELETE /api/comments/[commentId]/reactions", () => {
  const MOCK_USER_ID = "test-user-id";
  const MOCK_COMMENT_ID = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a reaction successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.commentLike.delete as jest.Mock).mockResolvedValue({});

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(prisma.commentLike.delete).toHaveBeenCalledWith({
      where: {
        userId_commentId: {
          userId: MOCK_USER_ID,
          commentId: MOCK_COMMENT_ID,
        },
      },
    });
  });

  it("should return 401 if unauthorized (no session)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(prisma.commentLike.delete).not.toHaveBeenCalled();
  });

  it("should return 400 if invalid commentId", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });

    const req = {} as NextRequest;
    const params = { commentId: "invalid" };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid comment ID" });
    expect(prisma.commentLike.delete).not.toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.commentLike.delete as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.commentLike.delete).toHaveBeenCalled();
  });
});
