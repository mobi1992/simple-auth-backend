import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN || 'YOUR_DROPBOX_ACCESS_TOKEN';
const uploadService = new UploadService(DROPBOX_ACCESS_TOKEN);

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!DROPBOX_ACCESS_TOKEN || DROPBOX_ACCESS_TOKEN === 'YOUR_DROPBOX_ACCESS_TOKEN') {
      return res.status(500).json({ error: 'Dropbox access token not configured' });
    }

    const result: any = await uploadService.uploadFile(file);

    res.json({
      message: 'File uploaded successfully',
      file: {
        name: result.result.name,
        path: result.result.path_display || result.result.path_lower,
        id: result.result.id,
        size: result.result.size,
      },
      dropboxPath: result.result.path_display || result.result.path_lower,
    });
  } catch (err: any) {
    console.error(err);
    const errorMessage = err?.error?.error || err?.message || 'Upload failed';
    const statusCode = err?.status || 500;
    res.status(statusCode).json({ error: errorMessage });
  }
});

export default router;

