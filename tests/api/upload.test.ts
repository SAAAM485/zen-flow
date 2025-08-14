import { POST } from '@/app/api/upload/route';
import { getServerSession } from 'next-auth';
import { put } from '@vercel/blob';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@vercel/blob');

const getServerSessionMock = getServerSession as jest.Mock;
const putMock = put as jest.Mock;

// Helper to create a mock file
const createMockFile = (name: string, content: string, type: string): File => {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
};

describe('/api/upload', () => {
    beforeEach(() => {
        getServerSessionMock.mockClear();
        putMock.mockClear();
    });

    it('should return 401 Unauthorized if user is not authenticated', async () => {
        getServerSessionMock.mockResolvedValue(null);
        const request = new NextRequest('http://localhost/api/upload', { method: 'POST', body: new FormData() });
        const response = await POST(request);
        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.message).toBe('Unauthorized');
    });

    it('should return 400 if no files are provided', async () => {
        getServerSessionMock.mockResolvedValue({ user: { id: 1 } });
        const formData = new FormData();
        const request = new NextRequest('http://localhost/api/upload', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toBe('No files found');
    });

    it('should upload files and return blob URLs for an authenticated user', async () => {
        getServerSessionMock.mockResolvedValue({ user: { id: 1 } });
        const file1 = createMockFile('test1.png', 'test-content1', 'image/png');
        const file2 = createMockFile('test2.jpg', 'test-content2', 'image/jpeg');
        
        const formData = new FormData();
        formData.append('files', file1);
        formData.append('files', file2);

        const mockBlob1 = { url: 'https://blob.vercel.com/test1.png' };
        const mockBlob2 = { url: 'https://blob.vercel.com/test2.jpg' };
        putMock.mockResolvedValueOnce(mockBlob1).mockResolvedValueOnce(mockBlob2);

        const request = new NextRequest('http://localhost/api/upload', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body.blobs).toEqual([mockBlob1, mockBlob2]);

        expect(putMock).toHaveBeenCalledTimes(2);
        expect(putMock).toHaveBeenCalledWith(file1.name, expect.any(ReadableStream), {
            access: 'public',
            contentType: file1.type,
        });
        expect(putMock).toHaveBeenCalledWith(file2.name, expect.any(ReadableStream), {
            access: 'public',
            contentType: file2.type,
        });
    });

    it('should handle errors during blob upload', async () => {
        getServerSessionMock.mockResolvedValue({ user: { id: 1 } });
        const file = createMockFile('test.png', 'test-content', 'image/png');
        const formData = new FormData();
        formData.append('files', file);

        const uploadError = new Error('Upload failed');
        putMock.mockRejectedValue(uploadError);

        const request = new NextRequest('http://localhost/api/upload', {
            method: 'POST',
            body: formData,
        });

        // We expect the overall POST function to throw, as it's not catching errors from put()
        await expect(POST(request)).rejects.toThrow(uploadError);
    });
});
