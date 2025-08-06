
import { GET } from '../../../src/app/api/follow-requests/route';
import { PUT } from '../../../src/app/api/follow-requests/[requestId]/route';
import { prismaMock, getServerSessionMock } from '../../setup';
import { NextRequest } from 'next/server';
import { FollowRequestStatus } from '@prisma/client';

describe('GET /api/follow-requests', () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 1, name: 'Test User' },
    });
  });

  it('should return a list of pending follow requests for the current user', async () => {
    const mockRequests = [
      {
        id: 1,
        fromId: 2,
        toId: 1,
        status: FollowRequestStatus.PENDING,
        createdAt: new Date(),
        from: { id: 2, name: 'User 2', email: 'user2@example.com', password: null, image: null, guest: false, createdAt: new Date(), updatedAt: new Date() },
      },
      {
        id: 2,
        fromId: 3,
        toId: 1,
        status: FollowRequestStatus.PENDING,
        createdAt: new Date(),
        from: { id: 3, name: 'User 3', email: 'user3@example.com', password: null, image: null, guest: false, createdAt: new Date(), updatedAt: new Date() },
      },
    ];
    prismaMock.followRequest.findMany.mockResolvedValue(mockRequests);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.length).toBe(2);
    expect({ ...data[0], createdAt: new Date(data[0].createdAt), from: { ...data[0].from, createdAt: new Date(data[0].from.createdAt), updatedAt: new Date(data[0].from.updatedAt) } }).toEqual(mockRequests[0]);
    expect({ ...data[1], createdAt: new Date(data[1].createdAt), from: { ...data[1].from, createdAt: new Date(data[1].from.createdAt), updatedAt: new Date(data[1].from.updatedAt) } }).toEqual(mockRequests[1]);
    expect(prismaMock.followRequest.findMany).toHaveBeenCalledWith({
      where: {
        toId: 1,
        status: 'PENDING',
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('should return 401 if unauthorized', async () => {
    getServerSessionMock.mockResolvedValue(null); // No session

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });
});

describe('PUT /api/follow-requests/[requestId]', () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: 1, name: 'Test User' },
    });
  });

  it('should accept a follow request and create a follow relationship', async () => {
    const mockRequest = {
      id: 1,
      fromId: 2,
      toId: 1,
      status: FollowRequestStatus.PENDING,
      createdAt: new Date(),
    };
    const mockAcceptedRequest = {
      ...mockRequest,
      status: FollowRequestStatus.ACCEPTED,
    };

    prismaMock.followRequest.findUnique.mockResolvedValue(mockRequest);
    prismaMock.$transaction.mockResolvedValue([
      {}, // Mock for prisma.follow.create (follower)
      {}, // Mock for prisma.follow.create (following)
      mockAcceptedRequest, // Mock for prisma.followRequest.update
    ]);

    const req = { json: () => Promise.resolve({ status: 'ACCEPTED' }) } as NextRequest;
    const params = { requestId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect({ ...data, createdAt: new Date(data.createdAt) }).toEqual(mockAcceptedRequest);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.follow.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.followRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: FollowRequestStatus.ACCEPTED },
    });
  });

  it('should reject a follow request', async () => {
    const mockRequest = {
      id: 1,
      fromId: 2,
      toId: 1,
      status: FollowRequestStatus.PENDING,
      createdAt: new Date(),
    };
    const mockRejectedRequest = {
      ...mockRequest,
      status: FollowRequestStatus.REJECTED,
    };

    prismaMock.followRequest.findUnique.mockResolvedValue(mockRequest);
    prismaMock.followRequest.update.mockResolvedValue(mockRejectedRequest);

    const req = { json: () => Promise.resolve({ status: 'REJECTED' }) } as NextRequest;
    const params = { requestId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect({ ...data, createdAt: new Date(data.createdAt) }).toEqual(mockRejectedRequest);
    expect(prismaMock.followRequest.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: FollowRequestStatus.REJECTED },
    });
    expect(prismaMock.follow.create).not.toHaveBeenCalled();
  });

  it('should return 404 if request not found or not recipient', async () => {
    prismaMock.followRequest.findUnique.mockResolvedValue(null);

    const req = { json: () => Promise.resolve({ status: 'ACCEPTED' }) } as NextRequest;
    const params = { requestId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Request not found or you are not the recipient' });
  });

  it('should return 409 if request has already been actioned', async () => {
    const mockRequest = {
      id: 1,
      fromId: 2,
      toId: 1,
      status: FollowRequestStatus.ACCEPTED,
      createdAt: new Date(),
    };
    prismaMock.followRequest.findUnique.mockResolvedValue(mockRequest);

    const req = { json: () => Promise.resolve({ status: 'ACCEPTED' }) } as NextRequest;
    const params = { requestId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toEqual({ error: 'Request has already been actioned' });
  });

  it('should return 401 if unauthorized', async () => {
    getServerSessionMock.mockResolvedValue(null); // No session

    const req = { json: () => Promise.resolve({ status: 'ACCEPTED' }) } as NextRequest;
    const params = { requestId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 for invalid request ID', async () => {
    const req = { json: () => Promise.resolve({ status: 'ACCEPTED' }) } as NextRequest;
    const params = { requestId: 'abc' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid request ID' });
  });

  it('should return 400 for invalid status', async () => {
    const req = { json: () => Promise.resolve({ status: 'INVALID' }) } as NextRequest;
    const params = { requestId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid status' });
  });

  it('should return 500 if a transaction error occurs', async () => {
    const mockRequest = {
      id: 1,
      fromId: 2,
      toId: 1,
      status: FollowRequestStatus.PENDING,
      createdAt: new Date(),
    };
    prismaMock.followRequest.findUnique.mockResolvedValue(mockRequest);
    prismaMock.$transaction.mockRejectedValue(new Error("Database error"));

    const req = { json: () => Promise.resolve({ status: 'ACCEPTED' }) } as NextRequest;
    const params = { requestId: '1' };
    const response = await PUT(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Something went wrong' });
  });
});
