
import { PUT, DELETE } from "@/app/api/comments/[commentId]/route";
import { prismaMock, getServerSessionMock } from "../../setup";
import { NextRequest } from "next/server";

const fullMockComment = {
  id: 1,
  text: "Test comment",
  postId: 1,
  authorId: 1,
  isHighlighted: false,
  createdAt: new Date(),
  post: { authorId: 1 },
};



describe("PUT /api/comments/[commentId]", () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({ user: { id: 1 } });
  });

  it("should update a comment for the authenticated author", async () => {
    prismaMock.comment.findUnique.mockResolvedValue(fullMockComment);
    prismaMock.comment.update.mockResolvedValue({ ...fullMockComment, text: "Updated text" });

    const req = { json: () => Promise.resolve({ text: "Updated text" }) } as NextRequest;
    const params = { commentId: "1" };
    const response = await PUT(req, { params: Promise.resolve(params) });

    expect(response.status).toBe(200);
  });
});

describe("DELETE /api/comments/[commentId]", () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({ user: { id: 1 } });
  });

  it("should delete a comment for the comment author", async () => {
    prismaMock.comment.findUnique.mockResolvedValue(fullMockComment);
    prismaMock.comment.delete.mockResolvedValue(fullMockComment);

    const req = {} as NextRequest;
    const params = { commentId: "1" };
    const response = await DELETE(req, { params: Promise.resolve(params) });

    expect(response.status).toBe(200);
  });

  it("should delete a comment for the post author", async () => {
    const mockComment = { ...fullMockComment, authorId: 2, post: { authorId: 1 } };
    prismaMock.comment.findUnique.mockResolvedValue(mockComment);
    prismaMock.comment.delete.mockResolvedValue(mockComment);

    const req = {} as NextRequest;
    const params = { commentId: "1" };
    const response = await DELETE(req, { params: Promise.resolve(params) });

    expect(response.status).toBe(200);
  });
});
