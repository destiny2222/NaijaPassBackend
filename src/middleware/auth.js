import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { usersTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'opencontracting_super_secret_key_123!';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization token required. Headers seen: ' + Object.keys(req.headers).join(', ') + ' Token value: ' + authHeader
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from database to ensure they still exist and attach role
    const users = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id)).limit(1);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: err.message });
  }
}

export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Administrators only' });
  }
  next();
}
