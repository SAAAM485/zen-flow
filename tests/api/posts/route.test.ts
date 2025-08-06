import { GET, POST } from "@/app/api/posts/route";
import { prismaMock, getServerSessionMock } from "../../setup";
import { NextRequest } from "next/server";

describe("GET /api/posts", () => {
  it("should return a list of posts in chronological order", async () => {
    const mockPosts = [
      {
        id: 2,
        text: "Second post",
        authorId: 1,
        createdAt: new Date("2025-07-31T10:00:00.000Z"),
        updatedAt: new Date("2025-07-31T10:00:00.000Z"),
      },
      {
        id: 1,
        text: "First post",
        authorId: 1,
        createdAt: new Date("2025-07-31T09:00:00.000Z"),
        updatedAt: new Date("2025-07-31T09:00:00.000Z"),
      },
    ];
    prismaMock.post.findMany.mockResolvedValue(mockPosts);

    const req = {} as NextRequest;
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(2);
    expect(data[0].id).toBe(2); // Verify the order is descending
    expect(data[1].id).toBe(1);
    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: true,
        comments: {
          include: {
            author: true,
            commentLikes: {
              include: {
                user: true,
              },
            },
          },
        },
        postLikes: {
          include: {
            user: true,
          },
        },
      },
    });
  });

  it("should return 500 if an internal server error occurs", async () => {
    prismaMock.post.findMany.mockRejectedValue(new Error("Database error"));

    const req = {} as NextRequest;
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
  });
});

describe("POST /api/posts", () => {
  const MOCK_USER_ID = 1;
  const MOCK_POST_TEXT = "This is a new test post.";

  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: MOCK_USER_ID, name: "Test User" },
    });
  });

  it("should create a new post successfully", async () => {
    const mockPost = {
      id: 1,
      text: MOCK_POST_TEXT,
      authorId: MOCK_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.post.create.mockResolvedValue(mockPost);

    const req = {
      json: async () => ({ text: MOCK_POST_TEXT }),
    } as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(expect.objectContaining({ text: MOCK_POST_TEXT }));
    expect(prismaMock.post.create).toHaveBeenCalledWith({
      data: {
        text: MOCK_POST_TEXT,
        authorId: MOCK_USER_ID,
      },
      include: {
        author: true,
      },
    });
  });

  it("should return 401 if unauthorized", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const req = {
      json: async () => ({ text: MOCK_POST_TEXT }),
    } as NextRequest;
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it.each([
    [null, "missing"],
    ["", "empty"],
    [123, "not a string"],
  ])("should return 400 if text content is %s", async (text, scenario) => {
    const req = {
      json: async () => ({ text }),
    } as NextRequest;
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Text content is required" });
  });

  it("should return 500 if an internal server error occurs", async () => {
    prismaMock.post.create.mockRejectedValue(new Error("Database error"));

    const req = {
      json: async () => ({ text: MOCK_POST_TEXT }),
    } as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
  });
});