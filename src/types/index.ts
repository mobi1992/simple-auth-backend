import { Request } from 'express';

export interface UserAttributes {
  id?: number;
  email: string;
  password: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SignupData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface UserResponse {
  id: number;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface FileMetadata {
  name: string;
  pathLower: string;
  size: number;
}

export interface FileStreamResponse {
  stream: NodeJS.ReadableStream;
  metadata: FileMetadata;
}

export interface FileLinkResponse {
  link: string;
  metadata: FileMetadata;
}

export interface FileListItem {
  name: string;
  path: string;
  isFile: boolean;
  size: number;
}

export interface DropboxUploadResult {
  name: string;
  path: string;
  id: string;
  size: number;
}

