import { GET } from "@/app/api/posts/route";
import { getServerSessionMock } from "../../setup";
import { NextRequest } from "next/server";
import { getPosts } from "@/lib/post-utils";

// Mock the module where getPosts is defined
jest.mock('@/lib/post-utils');

// Typecast the mock for TypeScript
const mockedGetPosts = getPosts as jest.Mock;

describe("GET /api/posts with mode parameter", () => {
  const MOCK_USER_ID = 1;

  beforeEach(() => {
    // Reset mocks before each test
    mockedGetPosts.mockClear();
    getServerSessionMock.mockResolvedValue({
      user: { id: MOCK_USER_ID, name: "Test User" },
    });
  });

  it("should call getPosts with 'following' mode and page number", async () => {
    const req = {
      url: "http://localhost/api/posts?mode=following&page=1",
    } as NextRequest;
    await GET(req);

    expect(mockedGetPosts).toHaveBeenCalledWith('following', MOCK_USER_ID, 1);
  });

  it("should call getPosts with 'explore' mode and page number", async () => {
    const req = {
      url: "http://localhost/api/posts?mode=explore&page=2",
    } as NextRequest;
    await GET(req);

    expect(mockedGetPosts).toHaveBeenCalledWith('explore', MOCK_USER_ID, 2);
  });

  it("should default to 'following' mode when logged in and no mode is provided", async () => {
    const req = { url: "http://localhost/api/posts?page=1" } as NextRequest;
    await GET(req);

    // The logic inside the GET handler defaults to 'following' if logged in
    expect(mockedGetPosts).toHaveBeenCalledWith('following', MOCK_USER_ID, 1);
  });

  it("should default to 'explore' mode when logged out and no mode is provided", async () => {
    getServerSessionMock.mockResolvedValue(null); // Simulate logged out
    const req = { url: "http://localhost/api/posts?page=1" } as NextRequest;
    await GET(req);

    // The logic inside the GET handler defaults to 'explore' if logged out
    expect(mockedGetPosts).toHaveBeenCalledWith('explore', undefined, 1);
  });

  it("should return 400 if page parameter is missing", async () => {
    const req = { url: "http://localhost/api/posts?mode=following" } as NextRequest;
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing page or mode parameter' });
    expect(mockedGetPosts).not.toHaveBeenCalled();
  });
});
