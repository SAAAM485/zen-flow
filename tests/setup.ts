
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();
const getServerSessionMock = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: getServerSessionMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
  mockReset(getServerSessionMock);
});

export { prismaMock, getServerSessionMock };
