import { POST, DELETE } from "@/app/api/comments/[commentId]/highlight/route";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt"; // Import getToken

// Mock next-auth/jwt
jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    comment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("POST /api/comments/[commentId]/highlight", () => {
  const MOCK_USER_ID = 1;
  const MOCK_POST_AUTHOR_ID = MOCK_USER_ID; // For successful cases, user is post author
  const MOCK_COMMENT_ID = 1;
  const MOCK_POST_ID = 101;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should highlight a comment successfully", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: MOCK_USER_ID });
    (prisma.comment.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_COMMENT_ID,
      authorId: "some-comment-author-id",
      postId: MOCK_POST_ID,
      post: { authorId: MOCK_POST_AUTHOR_ID },
      isHighlighted: false,
    });
    (prisma.comment.update as jest.Mock).mockResolvedValue({
      id: MOCK_COMMENT_ID,
      isHighlighted: true,
    });

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        id: MOCK_COMMENT_ID,
        isHighlighted: true,
      })
    );
    expect(prisma.comment.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_COMMENT_ID },
      include: { post: true },
    });
    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: MOCK_COMMENT_ID },
      data: { isHighlighted: true },
      include: { author: true },
    });
  });

  it("should return 401 if unauthorized (no session)", async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(prisma.comment.findUnique).not.toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("should return 400 if invalid commentId", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: MOCK_USER_ID });

    const req = {} as NextRequest;
    const params = { commentId: "invalid" };

    const res = await POST(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid comment ID" });
    expect(prisma.comment.findUnique).not.toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("should return 404 if comment not found", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: MOCK_USER_ID });
    (prisma.comment.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({ error: "Comment not found" });
    expect(prisma.comment.findUnique).toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("should return 403 if user is not the post author", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: "another-user-id" });
    (prisma.comment.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_COMMENT_ID,
      authorId: "some-comment-author-id",
      postId: MOCK_POST_ID,
      post: { authorId: MOCK_POST_AUTHOR_ID }, // MOCK_POST_AUTHOR_ID is MOCK_USER_ID
      isHighlighted: false,
    });

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
    expect(prisma.comment.findUnique).toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: MOCK_USER_ID });
    (prisma.comment.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_COMMENT_ID,
      authorId: "some-comment-author-id",
      postId: MOCK_POST_ID,
      post: { authorId: MOCK_POST_AUTHOR_ID },
      isHighlighted: false,
    });
    (prisma.comment.update as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await POST(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.comment.update).toHaveBeenCalled();
  });
});

describe("DELETE /api/comments/[commentId]/highlight", () => {
  const MOCK_USER_ID = 1;
  const MOCK_POST_AUTHOR_ID = MOCK_USER_ID; // For successful cases, user is post author
  const MOCK_COMMENT_ID = 1;
  const MOCK_POST_ID = 101;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should unhighlight a comment successfully", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: MOCK_USER_ID });
    (prisma.comment.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_COMMENT_ID,
      authorId: "some-comment-author-id",
      postId: MOCK_POST_ID,
      post: { authorId: MOCK_POST_AUTHOR_ID },
      isHighlighted: true,
    });
    (prisma.comment.update as jest.Mock).mockResolvedValue({
      id: MOCK_COMMENT_ID,
      isHighlighted: false,
    });

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await DELETE(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        id: MOCK_COMMENT_ID,
        isHighlighted: false,
      })
    );
    expect(prisma.comment.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_COMMENT_ID },
      include: { post: true },
    });
    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: MOCK_COMMENT_ID },
      data: { isHighlighted: false },
      include: { author: true },
    });
  });

  it("should return 401 if unauthorized (no session)", async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await DELETE(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(prisma.comment.findUnique).not.toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("should return 400 if invalid commentId", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: MOCK_USER_ID });

    const req = {} as NextRequest;
    const params = { commentId: "invalid" };

    const res = await DELETE(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid comment ID" });
    expect(prisma.comment.findUnique).not.toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("should return 404 if comment not found", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: MOCK_USER_ID });
    (prisma.comment.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await DELETE(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({ error: "Comment not found" });
    expect(prisma.comment.findUnique).toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("should return 403 if user is not the post author", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: "another-user-id" });
    (prisma.comment.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_COMMENT_ID,
      authorId: "some-comment-author-id",
      postId: MOCK_POST_ID,
      post: { authorId: MOCK_POST_AUTHOR_ID },
      isHighlighted: true,
    });

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await DELETE(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
    expect(prisma.comment.findUnique).toHaveBeenCalled();
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (getToken as jest.Mock).mockResolvedValue({ id: MOCK_USER_ID });
    (prisma.comment.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_COMMENT_ID,
      authorId: "some-comment-author-id",
      postId: MOCK_POST_ID,
      post: { authorId: MOCK_POST_AUTHOR_ID },
      isHighlighted: true,
    });
    (prisma.comment.update as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {} as NextRequest;
    const params = { commentId: MOCK_COMMENT_ID.toString() };

    const res = await DELETE(req, { params: Promise.resolve(params) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.comment.update).toHaveBeenCalled();
  });
});
