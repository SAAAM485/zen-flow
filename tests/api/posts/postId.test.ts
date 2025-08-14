import { GET, PUT, DELETE } from "@/app/api/posts/[postId]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// Mock next-auth & prisma
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/lib/prisma");

const MOCK_POST_ID = 1;
const MOCK_USER_ID = "test-user-id";

describe("GET /api/posts/[postId]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return a single post successfully", async () => {
    const mockPost = {
      id: MOCK_POST_ID,
      text: "Test Post",
      authorId: MOCK_USER_ID,
      imageUrls: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: MOCK_USER_ID, name: "Test User" },
      comments: [],
      postLikes: [],
    };
    (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

    const req = {} as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };

    const res = await GET(req, { params: Promise.resolve(context.params) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(MOCK_POST_ID);
    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_POST_ID },
      include: expect.any(Object),
    });
  });

  it("should return 400 if invalid postId", async () => {
    const req = {} as NextRequest;
    const context = { params: { postId: "invalid" } };
    const res = await GET(req, { params: Promise.resolve(context.params) });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Invalid post ID" });
  });

  it("should return 404 if post not found", async () => {
    (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);
    const req = {} as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };
    const res = await GET(req, { params: Promise.resolve(context.params) });
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data).toEqual({ error: "Post not found" });
  });

  it("should return 500 on database error", async () => {
    (prisma.post.findUnique as jest.Mock).mockRejectedValue(new Error("DB Error"));
    const req = {} as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };
    const res = await GET(req, { params: Promise.resolve(context.params) });
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
  });
});

describe("PUT /api/posts/[postId]", () => {
  const MOCK_UPDATED_TEXT = "Updated post text.";
  const MOCK_IMAGE_URLS = ["http://example.com/new.jpg"];

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: MOCK_USER_ID } });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: MOCK_POST_ID, authorId: MOCK_USER_ID });
  });

  it("should update a post successfully", async () => {
    (prisma.post.update as jest.Mock).mockResolvedValue({ id: MOCK_POST_ID, text: MOCK_UPDATED_TEXT, imageUrls: MOCK_IMAGE_URLS });
    const req = { json: async () => ({ text: MOCK_UPDATED_TEXT, imageUrls: MOCK_IMAGE_URLS }) } as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };

    const res = await PUT(req, { params: Promise.resolve(context.params) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.text).toBe(MOCK_UPDATED_TEXT);
    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: MOCK_POST_ID },
      data: { text: MOCK_UPDATED_TEXT, imageUrls: MOCK_IMAGE_URLS },
    });
  });

  it("should return 401 if unauthorized", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = { json: async () => ({ text: MOCK_UPDATED_TEXT }) } as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };
    const res = await PUT(req, { params: Promise.resolve(context.params) });
    expect(res.status).toBe(401);
  });

  it("should return 403 if user is not the post author", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "another-user" } });
    const req = { json: async () => ({ text: MOCK_UPDATED_TEXT }) } as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };
    const res = await PUT(req, { params: Promise.resolve(context.params) });
    expect(res.status).toBe(403);
  });

  it.each([
    { text: "", imageUrls: [] },
    { text: " ", imageUrls: [] },
    { text: null, imageUrls: [] },
    { text: undefined, imageUrls: [] },
  ])("should return 400 if content is invalid", async (payload) => {
    const req = { json: async () => payload } as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };
    const res = await PUT(req, { params: Promise.resolve(context.params) });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Post content or an image is required" });
  });
});

describe("DELETE /api/posts/[postId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: MOCK_USER_ID } });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: MOCK_POST_ID, authorId: MOCK_USER_ID });
  });

  it("should delete a post successfully", async () => {
    (prisma.post.delete as jest.Mock).mockResolvedValue({});
    const req = {} as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };
    const res = await DELETE(req, { params: Promise.resolve(context.params) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: MOCK_POST_ID } });
  });

  it("should return 403 if user is not post author", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "another-user" } });
    const req = {} as NextRequest;
    const context = { params: { postId: MOCK_POST_ID.toString() } };
    const res = await DELETE(req, { params: Promise.resolve(context.params) });
    expect(res.status).toBe(403);
  });
});