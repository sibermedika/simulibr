import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'eduhub_super_secret_jwt_token_key_2026';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_CLUSTER' | 'TEACHER_CLUSTER' | 'STUDENT_CLUSTER';

export interface TokenPayload {
  id: string;
  username: string;
  name?: string;
  role: UserRole;
  clusterId?: string;
  clusterCode?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Middleware: Authenticate JWT Token
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token otentikasi tidak ditemukan.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Token tidak valid atau telah kadaluarsa.' });
  }

  req.user = decoded;
  next();
}

// Middleware: Require Super Admin Role
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Akses terbatas. Membutuhkan hak akses Super Admin Platform.' });
  }
  next();
}

// Middleware: Require Cluster Admin or Super Admin
export function requireClusterAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN_CLUSTER')) {
    return res.status(403).json({ error: 'Akses terbatas. Membutuhkan hak akses Admin Cluster.' });
  }
  next();
}

// Middleware: Require Teacher, Cluster Admin, or Super Admin
export function requireTeacherOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN_CLUSTER' && req.user.role !== 'TEACHER_CLUSTER')) {
    return res.status(403).json({ error: 'Akses terbatas. Membutuhkan hak akses Kontributor Guru atau Admin.' });
  }
  next();
}
