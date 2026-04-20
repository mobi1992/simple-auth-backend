import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';

const router = Router();
const userService = new UserService();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await userService.getMe(req.user.userId);
    res.json({ user });
  } catch (err: any) {
    console.error(err);
    const status = err.message === 'User not found' ? 404 : 500;
    res.status(status).json({ error: err.message || 'Failed to load profile' });
  }
});

router.patch('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { name, email, password, currentPassword } = req.body;
    const user = await userService.updateMe(req.user.userId, {
      name,
      email,
      password,
      currentPassword,
    });
    res.json({ user });
  } catch (err: any) {
    console.error(err);
    let status = 500;
    if (err.message === 'User not found') status = 404;
    else if (
      err.message === 'Current password is incorrect' ||
      err.message === 'currentPassword is required when changing password'
    ) {
      status = 400;
    } else if (err.message === 'Email already in use') {
      status = 409;
    }
    res.status(status).json({ error: err.message || 'Update failed' });
  }
});

export default router;
