
import { POST, DELETE } from '../../../src/app/api/users/[userId]/follow-requests/route';
import { prismaMock, getServerSessionMock } from '../../setup';
import { NextRequest } from 'next/server';
import { FollowRequestStatus } from '@prisma/client';

describe('POST /api/users/[userId]/follow-requests', () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 1, name: 'Test User' },
    });
  });

  it('should send a follow request to another user', async () => {
    prismaMock.followRequest.findUnique.mockResolvedValue(null); // No existing request
    const mockFollowRequest = {
      id: 1,
      fromId: 1,
      toId: 2,
      status: FollowRequestStatus.PENDING,
      createdAt: new Date(),
    };
    prismaMock.followRequest.create.mockResolvedValue(mockFollowRequest);

    const req = {} as NextRequest;
    const params = { userId: '2' };
    const response = await POST(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect({ ...data, createdAt: new Date(data.createdAt) }).toEqual(mockFollowRequest);
    expect(prismaMock.followRequest.create).toHaveBeenCalledWith({
      data: {
        fromId: 1,
        toId: 2,
        status: 'PENDING',
      },
    });
  });

  it('should return 409 if a follow request already exists', async () => {
    prismaMock.followRequest.findUnique.mockResolvedValue({
      id: 1,
      fromId: 1,
      toId: 2,
      status: FollowRequestStatus.PENDING,
      createdAt: new Date(),
    });

    const req = {} as NextRequest;
    const params = { userId: '2' };
    const response = await POST(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toEqual({ error: 'Follow request already sent' });
  });

  it('should return 400 if trying to follow self', async () => {
    const req = {} as NextRequest;
    const params = { userId: '1' }; // Same as current user ID
    const response = await POST(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'You cannot follow yourself' });
  });

  it('should return 401 if unauthorized', async () => {
    getServerSessionMock.mockResolvedValue(null); // No session

    const req = {} as NextRequest;
    const params = { userId: '2' };
    const response = await POST(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 for invalid user ID', async () => {
    const req = {} as NextRequest;
    const params = { userId: 'abc' };
    const response = await POST(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid user ID' });
  });
});

describe('DELETE /api/users/[userId]/follow-requests', () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 1, name: 'Test User' },
    });
  });

  it('should cancel a pending follow request', async () => {
    const mockFollowRequest = {
      id: 1,
      fromId: 1,
      toId: 2,
      status: FollowRequestStatus.PENDING,
      createdAt: new Date(),
    };
    prismaMock.followRequest.delete.mockResolvedValue(mockFollowRequest);

    const req = {} as NextRequest;
    const params = { userId: '2' };
    const response = await DELETE(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(prismaMock.followRequest.delete).toHaveBeenCalledWith({
      where: {
        fromId_toId: {
          fromId: 1,
          toId: 2,
        },
        status: 'PENDING',
      },
    });
  });

  it('should return 404 if the request is not found or not pending', async () => {
    prismaMock.followRequest.delete.mockRejectedValue(new Error('Record to delete does not exist.'));

    const req = {} as NextRequest;
    const params = { userId: '2' };
    const response = await DELETE(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Request not found or could not be deleted' });
  });

  it('should return 401 if unauthorized', async () => {
    getServerSessionMock.mockResolvedValue(null); // No session

    const req = {} as NextRequest;
    const params = { userId: '2' };
    const response = await DELETE(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 for invalid user ID', async () => {
    const req = {} as NextRequest;
    const params = { userId: 'abc' };
    const response = await DELETE(req, { params: Promise.resolve(params) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid user ID' });
  });
});
