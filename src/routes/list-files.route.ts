import { Router, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN || 'YOUR_DROPBOX_ACCESS_TOKEN';
const uploadService = new UploadService(DROPBOX_ACCESS_TOKEN);

router.get('/list-files', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const folderPath = (req.query.folder as string) || '/uploads';

    if (!DROPBOX_ACCESS_TOKEN || DROPBOX_ACCESS_TOKEN === 'YOUR_DROPBOX_ACCESS_TOKEN') {
      return res.status(500).json({ error: 'Dropbox access token not configured' });
    }

    const files = await uploadService.listFiles(folderPath);

    res.json({
      folder: folderPath,
      files,
    });
  } catch (err: any) {
    console.error(err);
    const errorMessage = err?.error?.error_summary || err?.message || 'Failed to list files';
    const statusCode = err?.status || 500;
    res.status(statusCode).json({ error: errorMessage });
  }
});

export default router;

