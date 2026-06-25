import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { kycsTable, usersTable } from '../db/schema.js';

export async function getUser(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        role: usersTable.role,
        emailVerifiedAt: usersTable.emailVerifiedAt
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const kycs = await db
      .select({
        id: kycsTable.id,
        type: kycsTable.type,
        status: kycsTable.status,
        verificationStatus: kycsTable.verificationStatus,
        verifiedAt: kycsTable.verifiedAt,
        rejectionReason: kycsTable.rejectionReason
      })
      .from(kycsTable)
      .where(eq(kycsTable.userId, req.user.id))
      .limit(1);

    const kyc = kycs[0] || null;

    return res.json({
      success: true,
      user: {
        ...users[0],
        kyc: {
          hasSubmittedKyc: Boolean(kyc),
          hasCompletedKyc: kyc?.status === 'approved',
          status: kyc?.status || 'not_submitted',
          verificationStatus: kyc?.verificationStatus || 'unverified',
          details: kyc
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve user profile', error: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    await db.update(usersTable)
      .set({ name, phone })
      .where(eq(usersTable.id, req.user.id));

    return res.json({ success: true, message: 'Profile updated successfully', user: { name, phone } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable)
      .set({ password: hashedPassword })
      .where(eq(usersTable.id, req.user.id));

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to change password', error: err.message });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        role: usersTable.role,
        emailVerifiedAt: usersTable.emailVerifiedAt
      })
      .from(usersTable);

    return res.json({
      success: true,
      users
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users', error: err.message });
  }
}
