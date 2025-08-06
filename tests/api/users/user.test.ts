
import { GET, PUT } from '../../../src/app/api/users/[userId]/route';
import { prismaMock, getServerSessionMock } from '../../setup';
import { NextRequest } from 'next/server';

describe('GET /api/users/[userId]', () => {
  it('should return user data for a valid ID', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      password: null,
      image: 'test.jpg',
      guest: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { followers: 0, following: 0 },
    };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const req = {} as NextRequest;
    const params = { userId: '1' };
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect({ ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) }).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        _count: {
          select: { followers: true, following: true },
        },
      },
    });
  });

  it("should return 500 if an internal server error occurs", async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("Database error"));

    const req = {} as NextRequest;
    const params = { userId: "1" };
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Something went wrong" });
  });

  it('should return 404 if user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const req = {} as NextRequest;
    const params = { userId: '999' };
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'User not found' });
  });

  it('should return 400 for invalid user ID', async () => {
    const req = {} as NextRequest;
    const params = { userId: 'abc' };
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid user ID' });
  });
});

describe('PUT /api/users/[userId]', () => {
  beforeEach(() => {
    // Mock a valid session for authenticated requests
    getServerSessionMock.mockResolvedValue({
      user: { id: 1, name: 'Test User' },
    });
  });

  it('should update user data for the authenticated user', async () => {
    const mockUpdatedUser = {
      id: 1,
      name: 'Updated Name',
      email: 'test@example.com',
      password: null,
      image: 'updated.jpg',
      guest: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.user.update.mockResolvedValue(mockUpdatedUser);

    const req = { json: () => Promise.resolve({ name: 'Updated Name', image: 'updated.jpg' }) } as NextRequest;
    const params = { userId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect({ ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) }).toEqual(mockUpdatedUser);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Updated Name', image: 'updated.jpg' },
      select: expect.any(Object),
    });
  });

  it(`should return 403 if trying to update another user's profile`, async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 2, name: 'Another User' }, // Different user
    });

    const req = { json: () => Promise.resolve({ name: 'Updated Name' }) } as NextRequest;
    const params = { userId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: 'Forbidden' });
  });

  it('should return 401 if unauthorized', async () => {
    getServerSessionMock.mockResolvedValue(null); // No session

    const req = { json: () => Promise.resolve({ name: 'Updated Name' }) } as NextRequest;
    const params = { userId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 for invalid name', async () => {
    const req = { json: () => Promise.resolve({ name: '' }) } as NextRequest;
    const params = { userId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid name' });
  });

  it('should return 400 for invalid user ID', async () => {
    const req = { json: () => Promise.resolve({ name: 'Valid Name' }) } as NextRequest;
    const params = { userId: 'abc' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid user ID' });
  });
});
