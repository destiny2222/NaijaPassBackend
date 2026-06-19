import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import db from '../db/index.js';
import { usersTable } from '../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'opencontracting_super_secret_key_123!';
const OTP_EXPIRY_MINUTES = 10;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

function signAuthToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
}

export async function register(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and password are required' });
    }

    // Check if user exists
    const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();
    const userRole = role === 'admin' ? 'admin' : 'user';
    const otp = generateOtp();

    await db.insert(usersTable).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
      phone,
      role: userRole,
      emailVerifiedAt: null,
      otpCode: otp,
      otpExpiresAt: getOtpExpiryDate()
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify the OTP to complete authentication.',
      requiresVerification: true,
      otp,
      user: { id: userId, name, email, phone, role: userRole }
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

    const otp = generateOtp();
    await db.update(usersTable)
      .set({ otpCode: otp, otpExpiresAt: getOtpExpiryDate() })
      .where(eq(usersTable.id, user.id));

    return res.json({
      success: true,
      message: 'Login credentials accepted. Please verify the OTP to complete authentication.',
      requiresVerification: true,
      otp,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    if (!user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this user' });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    await db.update(usersTable)
      .set({
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
        otpCode: null,
        otpExpiresAt: null
      })
      .where(eq(usersTable.id, user.id));

    const verifiedUser = { ...user, emailVerifiedAt: user.emailVerifiedAt || new Date() };
    const token = signAuthToken(verifiedUser);

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
        phone: verifiedUser.phone,
        role: verifiedUser.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'OTP verification failed', error: err.message });
  }
}

// resend otp
export async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOtp();
    await db.update(usersTable)
      .set({ otpCode: otp, otpExpiresAt: getOtpExpiryDate() })
      .where(eq(usersTable.id, users[0].id));

    return res.json({
      success: true,
      message: 'OTP resent successfully. Please verify the new OTP to complete authentication.',
      requiresVerification: true,
      otp
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to resend OTP', error: err.message });
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
        phone: '+2348000000000',
        password: hashedPassword,
        role: 'user',
        emailVerifiedAt: new Date()
      });
      user = { id: userId, name: mockName, email: mockEmail, phone: '+2348000000000', role: 'user' };
    } else {
      user = users[0];
    }

    const token = signAuthToken(user);

    return res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Google authentication failed', error: err.message });
  }
}
