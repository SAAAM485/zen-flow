import { POST } from "@/app/api/posts/[postId]/comments/route";
import { prismaMock, getServerSessionMock } from "../../setup";
import { NextRequest } from "next/server";



describe("POST /api/posts/[postId]/comments", () => {
  const MOCK_USER_ID = 1;
  const MOCK_POST_ID = 1;
  const MOCK_COMMENT_TEXT = "This is a test comment.";

  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
  });

  it("should create a new comment successfully", async () => {
    prismaMock.comment.create.mockResolvedValue({ id: 1, text: MOCK_COMMENT_TEXT, authorId: MOCK_USER_ID, postId: MOCK_POST_ID, isHighlighted: false, createdAt: new Date() });

    const req = { json: async () => ({ text: MOCK_COMMENT_TEXT }) } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };
    const response = await POST(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.text).toBe(MOCK_COMMENT_TEXT);
    expect(prismaMock.comment.create).toHaveBeenCalledWith({
      data: { text: MOCK_COMMENT_TEXT, authorId: MOCK_USER_ID, postId: MOCK_POST_ID },
      include: { author: true },
    });
  });

  it("should return 401 if unauthorized", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const req = { json: async () => ({ text: MOCK_COMMENT_TEXT }) } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };
    const response = await POST(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 500 if an internal server error occurs", async () => {
    prismaMock.comment.create.mockRejectedValue(new Error("Database error"));

    const req = { json: async () => ({ text: MOCK_COMMENT_TEXT }) } as NextRequest;
    const params = { postId: MOCK_POST_ID.toString() };
    const response = await POST(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
  });
});