import { GET } from "@/app/api/posts/route";
import { prismaMock, getServerSessionMock } from "../../setup";
import { NextRequest } from "next/server";

describe("GET /api/posts with mode parameter", () => {
  const MOCK_USER_ID = 1;

  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: MOCK_USER_ID, name: "Test User" },
    });
  });

  it("should fetch posts from followed users when mode is 'following'", async () => {
    const mockFollowing = [{ followingId: 2 }, { followingId: 3 }];
    prismaMock.follow.findMany.mockResolvedValue(mockFollowing as any);

    const req = {
      url: "http://localhost/api/posts?mode=following",
    } as NextRequest;
    await GET(req);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        authorId: {
          in: [2, 3],
        },
      },
    }));
  });

  it("should fetch posts from other users when mode is 'explore'", async () => {
    const req = {
      url: "http://localhost/api/posts?mode=explore",
    } as NextRequest;
    await GET(req);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        authorId: {
          not: MOCK_USER_ID,
        },
      },
    }));
  });

  it("should fetch all posts when no mode is provided", async () => {
    const req = { url: "http://localhost/api/posts" } as NextRequest;
    await GET(req);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {},
    }));
  });
});
