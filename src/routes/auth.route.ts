import { Router, Request, Response } from 'express';
import { UserService } from '../services/user.service';

const router = Router();
const userService = new UserService();

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await userService.signup({ email, password, name });

    res.status(201).json({
      message: 'User created successfully',
      ...result,
    });
  } catch (err: any) {
    console.error(err);
    const statusCode = err.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({ error: err.message || 'Signup failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await userService.login({ email, password });

    res.json({
      message: 'Login successful',
      ...result,
    });
  } catch (err: any) {
    console.error(err);
    const statusCode = err.message.includes('Invalid') ? 401 : 500;
    res.status(statusCode).json({ error: err.message || 'Login failed' });
  }
});

export default router;

