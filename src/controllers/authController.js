import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import db from '../db/index.js';
import { usersTable } from '../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'opencontracting_super_secret_key_123!';

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const userRole = role === 'admin' ? 'admin' : 'user';

    await db.insert(usersTable).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
      role: userRole,
      emailVerifiedAt: null
    });

    const token = jwt.sign({ id: userId, email, role: userRole }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: userId, name, email, role: userRole }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
}

// Google OAuth Mock Redirect
export async function googleLoginRedirect(req, res) {
  // Simulates redirect to Google
  const mockRedirectUrl = `${req.protocol}://${req.get('host')}/api/auth/google/callback?code=mock_google_auth_code_9921`;
  return res.json({
    success: true,
    message: 'Redirecting user to Google Login Page',
    url: mockRedirectUrl
  });
}

// Google OAuth Mock Callback
export async function googleLoginCallback(req, res) {
  try {
    // In a real implementation we would exchange the code for Google user details
    // Here we will log in or register a mock user
    const mockEmail = 'googleuser@example.com';
    const mockName = 'Google Contractor';

    let users = await db.select().from(usersTable).where(eq(usersTable.email, mockEmail)).limit(1);
    let user;

    if (users.length === 0) {
      const userId = randomUUID();
      const hashedPassword = await bcrypt.hash('mock_google_password_9988', 10);
      await db.insert(usersTable).values({
        id: userId,
        name: mockName,
        email: mockEmail,
        password: hashedPassword,
        role: 'user',
        emailVerifiedAt: new Date()
      });
      user = { id: userId, name: mockName, email: mockEmail, role: 'user' };
    } else {
      user = users[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Google authentication failed', error: err.message });
  }
}
