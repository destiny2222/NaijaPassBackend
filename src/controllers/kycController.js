import { randomUUID } from 'crypto';
import { eq, and, like } from 'drizzle-orm';
import db from '../db/index.js';
import { kycsTable, kycRepresentativesTable, industryCategoriesTable, usersTable } from '../db/schema.js';
import { idVerificationService } from '../utils/idVerificationService.js';

// Get Industry Categories
export async function getIndustryCategories(req, res) {
  try {
    const categories = await db.select().from(industryCategoriesTable);
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories', error: err.message });
  }
}

// Seed/Add Industry Category (for utility)
export async function addIndustryCategory(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    await db.insert(industryCategoriesTable).values({ name });
    return res.status(201).json({ success: true, message: 'Industry category added successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add category', error: err.message });
  }
}

// Submit KYC
export async function submitKyc(req, res) {
  try {
    const {
      type,
      email,
      phoneNumber,
      idType,
      idNumber,
      firstName,
      lastName,
      dob,
      businessName,
      registrationNumber,
      taxIdentificationNumber,
      industryCategoryId,
      representatives
    } = req.body;

    if (!type || !email || !phoneNumber || !idType || !idNumber) {
      return res.status(400).json({ success: false, message: 'Type, email, phoneNumber, idType, and idNumber are required' });
    }

    if (type !== 'individual' && type !== 'business') {
      return res.status(400).json({ success: false, message: "Type must be either 'individual' or 'business'" });
    }

    if (type === 'individual') {
      if (!firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'firstName and lastName are required for individual KYC' });
      }
    } else {
      if (!businessName) {
        return res.status(400).json({ success: false, message: 'businessName is required for business KYC' });
      }
    }

    // Check if user already has a KYC record
    const existingKycResult = await db.select().from(kycsTable).where(eq(kycsTable.userId, req.user.id)).limit(1);
    const existingKyc = existingKycResult[0];

    if (existingKyc) {
      return res.status(400).json({
        success: false,
        message: 'KYC record already exists for this user. Update your submission or contact support.'
      });
    }

    // Call simulated third-party verification service
    const verificationResult = await idVerificationService.verifyId({
      type,
      idType,
      idNumber,
      firstName,
      lastName,
      dob,
      businessName
    });

    const kycId = randomUUID();
    const isVerified = verificationResult.verified;
    const status = isVerified ? 'approved' : 'rejected';
    const verificationStatus = isVerified ? 'verified' : 'failed';
    const rejectionReason = isVerified ? null : (verificationResult.message || 'Third-party verification failed');

    // Run insert in a transaction to safely handle both kyc and representatives
    await db.transaction(async (tx) => {
      await tx.insert(kycsTable).values({
        id: kycId,
        userId: req.user.id,
        type,
        status,
        email,
        phoneNumber,
        businessName: type === 'business' ? businessName : null,
        registrationNumber: type === 'business' ? (registrationNumber || idNumber) : null,
        taxIdentificationNumber: type === 'business' ? (taxIdentificationNumber || null) : null,
        rejectionReason,
        industryCategoryId: type === 'business' ? (industryCategoryId || null) : null,
        idType,
        idNumber,
        firstName: type === 'individual' ? firstName : null,
        lastName: type === 'individual' ? lastName : null,
        dob: type === 'individual' ? dob : null,
        verificationStatus,
        verifiedAt: isVerified ? new Date(verificationResult.verifiedAt) : null,
        thirdPartyReference: verificationResult.reference || null,
        verificationDetails: JSON.stringify(verificationResult)
      });

      if (type === 'business' && representatives && Array.isArray(representatives) && representatives.length > 0) {
        const repsToInsert = representatives.map(rep => ({
          kycId,
          name: rep.name,
          position: rep.position
        }));
        await tx.insert(kycRepresentativesTable).values(repsToInsert);
      }
    });

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: `KYC submission failed identity verification: ${rejectionReason}`,
        data: { id: kycId, userId: req.user.id, type, status, verificationStatus, rejectionReason }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'KYC form submitted and verified successfully',
      data: { id: kycId, userId: req.user.id, type, status, verificationStatus, thirdPartyReference: verificationResult.reference }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'KYC submission failed', error: err.message });
  }
}

// Get Logged-In User's KYC status
export async function getMyKyc(req, res) {
  try {
    const kycResult = await db.select()
      .from(kycsTable)
      .leftJoin(kycRepresentativesTable, eq(kycsTable.id, kycRepresentativesTable.kycId))
      .leftJoin(industryCategoriesTable, eq(kycsTable.industryCategoryId, industryCategoriesTable.id))
      .where(eq(kycsTable.userId, req.user.id));

    if (kycResult.length === 0) {
      return res.status(404).json({ success: false, message: 'No KYC submission found for this user' });
    }

    // Map out the results grouping representatives
    const representatives = [];
    const kyc = kycResult[0].kycs;
    const industryCategory = kycResult[0].industry_categories;

    kycResult.forEach(row => {
      if (row.kyc_representatives) {
        representatives.push({
          id: row.kyc_representatives.id,
          name: row.kyc_representatives.name,
          position: row.kyc_representatives.position
        });
      }
    });

    let verificationDetailsObj = null;
    try {
      if (kyc.verificationDetails) {
        verificationDetailsObj = JSON.parse(kyc.verificationDetails);
      }
    } catch (e) {
      // ignore
    }

    return res.json({
      success: true,
      data: {
        id: kyc.id,
        userId: kyc.userId,
        type: kyc.type,
        status: kyc.status,
        email: kyc.email,
        phoneNumber: kyc.phoneNumber,
        businessName: kyc.businessName,
        registrationNumber: kyc.registrationNumber,
        taxIdentificationNumber: kyc.taxIdentificationNumber,
        rejectionReason: kyc.rejectionReason,
        industryCategoryId: kyc.industryCategoryId,
        industryCategory: industryCategory ? { id: industryCategory.id, name: industryCategory.name } : null,
        idType: kyc.idType,
        idNumber: kyc.idNumber,
        firstName: kyc.firstName,
        lastName: kyc.lastName,
        dob: kyc.dob,
        verificationStatus: kyc.verificationStatus,
        verifiedAt: kyc.verifiedAt,
        thirdPartyReference: kyc.thirdPartyReference,
        verificationDetails: verificationDetailsObj,
        representatives
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve KYC status', error: err.message });
  }
}

// Add representatives (Board members/officers for business accounts)
export async function addRepresentatives(req, res) {
  try {
    const { kycId, representatives } = req.body; // representatives: Array of { name, position }
    if (!kycId || !representatives || !Array.isArray(representatives) || representatives.length === 0) {
      return res.status(400).json({ success: false, message: 'kycId and representatives array are required' });
    }

    // Verify KYC existence and ownership
    const kycResult = await db.select().from(kycsTable).where(eq(kycsTable.id, kycId)).limit(1);
    const kyc = kycResult[0];

    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    if (kyc.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (kyc.type !== 'business') {
      return res.status(400).json({ success: false, message: 'Representatives can only be added to business accounts' });
    }

    // Insert representatives
    const valuesToInsert = representatives.map(rep => ({
      kycId,
      name: rep.name,
      position: rep.position
    }));

    await db.insert(kycRepresentativesTable).values(valuesToInsert);

    return res.status(201).json({
      success: true,
      message: `${representatives.length} representative(s) added successfully`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add representatives', error: err.message });
  }
}

// Admin: List all KYC submissions
export async function listAllKycs(req, res) {
  try {
    const { status } = req.query;
    
    let query = db.select()
      .from(kycsTable)
      .leftJoin(usersTable, eq(kycsTable.userId, usersTable.id))
      .leftJoin(kycRepresentativesTable, eq(kycsTable.id, kycRepresentativesTable.kycId))
      .leftJoin(industryCategoriesTable, eq(kycsTable.industryCategoryId, industryCategoriesTable.id));

    if (status) {
      query = query.where(eq(kycsTable.status, status));
    }

    const results = await query;

    // Grouping rows by KYC ID
    const kycMap = {};
    for (const row of results) {
      const kycId = row.kycs.id;
      if (!kycMap[kycId]) {
        const user = row.users ? { id: row.users.id, name: row.users.name, email: row.users.email, role: row.users.role } : null;
        const industryCategory = row.industry_categories ? { id: row.industry_categories.id, name: row.industry_categories.name } : null;

        let verificationDetailsObj = null;
        try {
          if (row.kycs.verificationDetails) {
            verificationDetailsObj = JSON.parse(row.kycs.verificationDetails);
          }
        } catch (e) {
          // ignore
        }

        kycMap[kycId] = {
          id: row.kycs.id,
          userId: row.kycs.userId,
          type: row.kycs.type,
          status: row.kycs.status,
          email: row.kycs.email,
          phoneNumber: row.kycs.phoneNumber,
          businessName: row.kycs.businessName,
          registrationNumber: row.kycs.registrationNumber,
          taxIdentificationNumber: row.kycs.taxIdentificationNumber,
          rejectionReason: row.kycs.rejectionReason,
          industryCategoryId: row.kycs.industryCategoryId,
          idType: row.kycs.idType,
          idNumber: row.kycs.idNumber,
          firstName: row.kycs.firstName,
          lastName: row.kycs.lastName,
          dob: row.kycs.dob,
          verificationStatus: row.kycs.verificationStatus,
          verifiedAt: row.kycs.verifiedAt,
          thirdPartyReference: row.kycs.thirdPartyReference,
          verificationDetails: verificationDetailsObj,
          user,
          industryCategory,
          representatives: []
        };
      }
      if (row.kyc_representatives) {
        kycMap[kycId].representatives.push({
          id: row.kyc_representatives.id,
          name: row.kyc_representatives.name,
          position: row.kyc_representatives.position
        });
      }
    }

    return res.json({ success: true, data: Object.values(kycMap) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list KYC records', error: err.message });
  }
}

// Admin: Review/Update KYC Status (Approve / Reject)
export async function reviewKyc(req, res) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['inprogress', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status is required and must be 'inprogress', 'approved', or 'rejected'"
      });
    }

    const kycResult = await db.select().from(kycsTable).where(eq(kycsTable.id, id)).limit(1);
    const kyc = kycResult[0];

    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    const updateData = { status };
    if (status === 'rejected') {
      if (!rejectionReason) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting KYC' });
      }
      updateData.rejectionReason = rejectionReason;
    } else {
      updateData.rejectionReason = null;
    }

    await db.update(kycsTable).set(updateData).where(eq(kycsTable.id, id));

    return res.json({
      success: true,
      message: `KYC submission updated successfully to status: ${status}`,
      data: { id, status, rejectionReason: updateData.rejectionReason }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update KYC status', error: err.message });
  }
}

// Get Directory of Verified Businesses
export async function getVerifiedBusinessesDirectory(req, res) {
  try {
    const { categoryId, search } = req.query;

    const conditions = [
      eq(kycsTable.type, 'business'),
      eq(kycsTable.status, 'approved')
    ];

    if (categoryId) {
      conditions.push(eq(kycsTable.industryCategoryId, parseInt(categoryId)));
    }

    if (search) {
      conditions.push(like(kycsTable.businessName, `%${search}%`));
    }

    const query = db.select()
      .from(kycsTable)
      .leftJoin(kycRepresentativesTable, eq(kycsTable.id, kycRepresentativesTable.kycId))
      .leftJoin(industryCategoriesTable, eq(kycsTable.industryCategoryId, industryCategoriesTable.id))
      .where(and(...conditions));

    const results = await query;

    // Grouping by business KYC ID
    const businessMap = {};
    for (const row of results) {
      const kycId = row.kycs.id;
      if (!businessMap[kycId]) {
        const industryCategory = row.industry_categories ? { id: row.industry_categories.id, name: row.industry_categories.name } : null;
        businessMap[kycId] = {
          id: row.kycs.id,
          businessName: row.kycs.businessName,
          email: row.kycs.email,
          phoneNumber: row.kycs.phoneNumber,
          registrationNumber: row.kycs.registrationNumber,
          taxIdentificationNumber: row.kycs.taxIdentificationNumber,
          industryCategoryId: row.kycs.industryCategoryId,
          industryCategory,
          verifiedAt: row.kycs.verifiedAt,
          representatives: []
        };
      }

      if (row.kyc_representatives) {
        businessMap[kycId].representatives.push({
          id: row.kyc_representatives.id,
          name: row.kyc_representatives.name,
          position: row.kyc_representatives.position
        });
      }
    }

    return res.json({
      success: true,
      data: Object.values(businessMap)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve verified businesses directory', error: err.message });
  }
}
