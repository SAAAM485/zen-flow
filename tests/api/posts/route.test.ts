import { GET, POST } from "@/app/api/posts/route";
import { prismaMock, getServerSessionMock } from "../../setup";
import { NextRequest } from "next/server";
import { getPosts } from "@/lib/post-utils";

jest.mock('@/lib/post-utils');
const mockedGetPosts = getPosts as jest.Mock;

describe("GET /api/posts", () => {
  beforeEach(() => {
    mockedGetPosts.mockClear();
    getServerSessionMock.mockResolvedValue(null); // Default to logged out
  });

  it("should call getPosts and return its result", async () => {
    const mockPosts = [{ id: 1, text: "Test Post" }];
    mockedGetPosts.mockResolvedValue(mockPosts);

    const req = { url: 'http://localhost/api/posts?mode=explore&page=1' } as NextRequest;
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPosts);
    expect(mockedGetPosts).toHaveBeenCalledWith('explore', undefined, 1);
  });

  it("should return 400 if parameters are missing", async () => {
    const req = { url: 'http://localhost/api/posts' } as NextRequest;
    const response = await GET(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Missing page or mode parameter' });
  });
});

describe("POST /api/posts", () => {
  const MOCK_USER_ID = 1;
  const MOCK_POST_TEXT = "This is a new test post.";
  const MOCK_IMAGE_URLS = ["http://example.com/image1.jpg"];

  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: MOCK_USER_ID, name: "Test User" },
    });
  });

  it("should create a new post with text and images", async () => {
    const mockPost = {
      id: 1,
      text: MOCK_POST_TEXT,
      authorId: MOCK_USER_ID,
      imageUrls: MOCK_IMAGE_URLS,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      postLikes: [],
    };
    prismaMock.post.create.mockResolvedValue(mockPost as any);

    const req = {
      json: async () => ({ text: MOCK_POST_TEXT, imageUrls: MOCK_IMAGE_URLS }),
    } as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(expect.objectContaining({ text: MOCK_POST_TEXT, imageUrls: MOCK_IMAGE_URLS }));
    expect(prismaMock.post.create).toHaveBeenCalledWith({
      data: {
        text: MOCK_POST_TEXT,
        imageUrls: MOCK_IMAGE_URLS,
        authorId: MOCK_USER_ID,
      },
      include: {
        author: true,
        comments: { include: { author: true, commentLikes: { include: { user: true } } } },
        postLikes: { include: { user: true } },
      },
    });
  });

  it("should create a new post with only text", async () => {
    const req = {
      json: async () => ({ text: MOCK_POST_TEXT, imageUrls: [] }),
    } as NextRequest;
    await POST(req);
    expect(prismaMock.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { text: MOCK_POST_TEXT, imageUrls: [], authorId: MOCK_USER_ID },
    }));
  });

  it("should create a new post with only images", async () => {
    const req = {
      json: async () => ({ text: null, imageUrls: MOCK_IMAGE_URLS }),
    } as NextRequest;
    await POST(req);
    expect(prismaMock.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { text: null, imageUrls: MOCK_IMAGE_URLS, authorId: MOCK_USER_ID },
    }));
  });

  it("should return 401 if unauthorized", async () => {
    getServerSessionMock.mockResolvedValue(null);
    const req = { json: async () => ({ text: MOCK_POST_TEXT }) } as NextRequest;
    const response = await POST(req);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 400 if both text and imageUrls are missing", async () => {
    const req = { json: async () => ({ text: ' ', imageUrls: [] }) } as NextRequest;
    const response = await POST(req);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Post content or an image is required" });
  });

  it("should return 500 if an internal server error occurs", async () => {
    prismaMock.post.create.mockRejectedValue(new Error("Database error"));
    const req = { json: async () => ({ text: MOCK_POST_TEXT }) } as NextRequest;
    const response = await POST(req);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
  });
});