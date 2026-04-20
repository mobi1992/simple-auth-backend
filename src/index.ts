import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import uploadRoute from './routes/upload.route';
import authRoute from './routes/auth.route';
import meRoute from './routes/me.route';
import fileRoute from './routes/file.route';
import listFilesRoute from './routes/list-files.route';
import { connectDatabase } from './config/database';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

app.use('/auth', authRoute);
app.use('/me', meRoute);
app.use('/', listFilesRoute);
app.use('/', fileRoute);
app.use('/', uploadRoute);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

