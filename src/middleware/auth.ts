import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken) {
    res.status(500).json({ error: 'Administrative access is not configured on this server.' });
    return;
  }

  const token = req.headers['x-admin-token'];

  if (!token) {
    res.status(401).json({ error: 'Administrative authentication token is missing.' });
    return;
  }

  if (token !== adminToken) {
    res.status(403).json({ error: 'Invalid administrative token provided.' });
    return;
  }

  next();
};
