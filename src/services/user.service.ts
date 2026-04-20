import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import {
  SignupData,
  LoginData,
  AuthResponse,
  UserResponse,
  UpdateMeData,
} from '../types';

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

  async getMe(userId: number): Promise<UserResponse> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async updateMe(userId: number, data: UpdateMeData): Promise<UserResponse> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (data.password !== undefined) {
      if (!data.currentPassword) {
        throw new Error('currentPassword is required when changing password');
      }
      const valid = await bcrypt.compare(data.currentPassword, user.password);
      if (!valid) {
        throw new Error('Current password is incorrect');
      }
      user.password = await bcrypt.hash(data.password, 10);
    }

    if (data.email !== undefined && data.email !== user.email) {
      const taken = await User.findOne({ where: { email: data.email } });
      if (taken) {
        throw new Error('Email already in use');
      }
      user.email = data.email;
    }

    if (data.name !== undefined) {
      user.name = data.name;
    }

    await user.save();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  private generateToken(userId: number, email: string): string {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign({ userId, email }, secret, { expiresIn: '1m' });
  }
}

