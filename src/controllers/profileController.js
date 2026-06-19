import { eq } from 'drizzle-orm';
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
