import { GET, PUT, DELETE } from "@/app/api/posts/[postId]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("GET /api/posts/[postId]", () => {
  const MOCK_POST_ID = 1;
  const MOCK_USER_ID = "test-user-id";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a single post successfully", async () => {
    const mockPost = {
      id: MOCK_POST_ID,
      text: "Test Post",
      authorId: MOCK_USER_ID,
      createdAt: new Date().toISOString(),
      author: { id: MOCK_USER_ID, name: "Test User" },
      comments: [],
      postLikes: [],
    };
    (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockPost);
    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_POST_ID },
      include: {
        author: true,
        comments: {
          include: {
            author: true,
            commentLikes: true,
          },
          orderBy: { createdAt: "asc" },
        },
        postLikes: true,
      },
    });
  });

  it("should return 400 if invalid postId", async () => {
    const req = {} as NextRequest;
    const params = { postId: "invalid" };

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid post ID" });
    expect(prisma.post.findUnique).not.toHaveBeenCalled();
  });

  it("should return 404 if post not found", async () => {
    (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toEqual({ error: "Post not found" });
    expect(prisma.post.findUnique).toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (prisma.post.findUnique as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.post.findUnique).toHaveBeenCalled();
  });
});

describe("PUT /api/posts/[postId]", () => {
  const MOCK_USER_ID = "test-user-id";
  const MOCK_POST_ID = 1;
  const MOCK_UPDATED_TEXT = "Updated post text.";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a post successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      text: "Original text",
      authorId: MOCK_USER_ID,
    });
    (prisma.post.update as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      text: MOCK_UPDATED_TEXT,
      authorId: MOCK_USER_ID,
    });

    const req = {
      json: async () => ({ text: MOCK_UPDATED_TEXT }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await PUT(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(
      expect.objectContaining({
        id: MOCK_POST_ID,
        text: MOCK_UPDATED_TEXT,
        authorId: MOCK_USER_ID,
      })
    );
    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_POST_ID },
    });
    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: MOCK_POST_ID },
      data: { text: MOCK_UPDATED_TEXT },
    });
  });

  it("should return 401 if unauthorized (no session)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({ text: MOCK_UPDATED_TEXT }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await PUT(req, { params });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(prisma.post.findUnique).not.toHaveBeenCalled();
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("should return 400 if invalid postId", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });

    const req = {
      json: async () => ({ text: MOCK_UPDATED_TEXT }),
    } as NextRequest;
    const params = { postId: "invalid" };

    const res = await PUT(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid post ID" });
    expect(prisma.post.findUnique).not.toHaveBeenCalled();
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("should return 403 if user is not the post author", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "another-user-id" },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      text: "Original text",
      authorId: MOCK_USER_ID,
    });

    const req = {
      json: async () => ({ text: MOCK_UPDATED_TEXT }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await PUT(req, { params });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
    expect(prisma.post.findUnique).toHaveBeenCalled();
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("should return 400 if text content is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      text: "Original text",
      authorId: MOCK_USER_ID,
    });

    const req = {
      json: async () => ({}),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await PUT(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Text content is required" });
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("should return 400 if text content is empty", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      text: "Original text",
      authorId: MOCK_USER_ID,
    });

    const req = {
      json: async () => ({ text: "" }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await PUT(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Text content is required" });
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("should return 400 if text content is not a string", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      text: "Original text",
      authorId: MOCK_USER_ID,
    });

    const req = {
      json: async () => ({ text: 123 }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await PUT(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Text content is required" });
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      text: "Original text",
      authorId: MOCK_USER_ID,
    });
    (prisma.post.update as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {
      json: async () => ({ text: MOCK_UPDATED_TEXT }),
    } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await PUT(req, { params });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.post.update).toHaveBeenCalled();
  });
});

describe("DELETE /api/posts/[postId]", () => {
  const MOCK_USER_ID = "test-user-id";
  const MOCK_POST_ID = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a post successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      authorId: MOCK_USER_ID,
    });
    (prisma.post.delete as jest.Mock).mockResolvedValue({});

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_POST_ID },
    });
    expect(prisma.post.delete).toHaveBeenCalledWith({
      where: { id: MOCK_POST_ID },
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
    expect(prisma.post.findUnique).not.toHaveBeenCalled();
    expect(prisma.post.delete).not.toHaveBeenCalled();
  });

  it("should return 400 if invalid postId", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });

    const req = {} as NextRequest;
    const params = { postId: "invalid" };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid post ID" });
    expect(prisma.post.findUnique).not.toHaveBeenCalled();
    expect(prisma.post.delete).not.toHaveBeenCalled();
  });

  it("should return 403 if user is not the post author", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "another-user-id" },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      authorId: MOCK_USER_ID,
    });

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
    expect(prisma.post.findUnique).toHaveBeenCalled();
    expect(prisma.post.delete).not.toHaveBeenCalled();
  });

  it("should return 500 if an internal server error occurs", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: MOCK_USER_ID },
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      id: MOCK_POST_ID,
      authorId: MOCK_USER_ID,
    });
    (prisma.post.delete as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const req = {} as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };

    const res = await DELETE(req, { params });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
    expect(prisma.post.delete).toHaveBeenCalled();
  });
});