import { Router, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN || 'YOUR_DROPBOX_ACCESS_TOKEN';
const uploadService = new UploadService(DROPBOX_ACCESS_TOKEN);

router.get('/secure-file', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const folderPath = process.env.FOLDER_PATH || '';

        const filePath = (req.query.path as string).startsWith('/') ? (folderPath + req.query.path as string) : (folderPath + `/${req.query.path as string}`);

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required as query parameter (path)' });
        }

        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return res.status(400).json({
                error: 'Invalid file path. Please use the Dropbox file path (e.g., /uploads/filename.png), not a URL. The file path is returned when you upload a file.'
            });
        }

        const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

        // Use your existing service method
        const { stream, metadata } = await uploadService.getFileStream(normalizedPath);

        // Set headers to force stream
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${metadata.name}"`);

        stream.pipe(res);

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to stream file' });
    }
});

router.get('/file', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const folderPath = process.env.FOLDER_PATH || '';

        const filePath = (req.query.path as string).startsWith('/') ? (folderPath + req.query.path as string) : (folderPath + `/${req.query.path as string}`);

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required as query parameter (path)' });
        }

        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return res.status(400).json({
                error: 'Invalid file path. Please use the Dropbox file path (e.g., /uploads/filename.png), not a URL. The file path is returned when you upload a file.'
            });
        }

        const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

        if (!DROPBOX_ACCESS_TOKEN || DROPBOX_ACCESS_TOKEN === 'YOUR_DROPBOX_ACCESS_TOKEN') {
            return res.status(500).json({ error: 'Dropbox access token not configured' });
        }

        const { link, metadata } = await uploadService.getFileLink(normalizedPath);

        res.json({
            message: 'File link retrieved successfully',
            file: {
                name: metadata.name,
                path: metadata.pathLower,
                size: metadata.size,
                downloadLink: link,
            },
        });
    } catch (err: any) {
        console.error(err);

        let errorMessage = 'Failed to read file';
        if (err?.error?.error_summary) {
            errorMessage = err.error.error_summary;
        } else if (err?.error?.error) {
            const errorObj = err.error.error;
            errorMessage = typeof errorObj === 'string' ? errorObj : errorObj['.tag'] || JSON.stringify(errorObj);
        } else if (err?.message) {
            errorMessage = err.message;
        }

        const statusCode = err?.status || 500;

        if (statusCode === 409 || (typeof errorMessage === 'string' && errorMessage.includes('not_found'))) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (statusCode === 401) {
            return res.status(401).json({ error: 'Dropbox access token expired or invalid' });
        }

        res.status(statusCode).json({ error: errorMessage });
    }
});

export default router;

