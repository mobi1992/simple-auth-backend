import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { SignupData, LoginData, AuthResponse, UserResponse } from '../types';

export class UserService {
  async signup(data: SignupData): Promise<AuthResponse> {
    const existingUser = await User.findOne({ where: { email: data.email } });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const user = await User.findOne({ where: { email: data.email } });
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  private generateToken(userId: number, email: string): string {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign({ userId, email }, secret, { expiresIn: '1m' });
  }
}

