import { randomUUID } from 'crypto';
import { eq, and, like } from 'drizzle-orm';
import db from '../db/index.js';
import { kycsTable, kycRepresentativesTable, industryCategoriesTable, usersTable } from '../db/schema.js';

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
      dateOfBirth,
      date_of_birth,
      nationality,
      residentialAddress,
      residential_address,
      mailingAddress,
      mailing_address,
      idDocument,
      id_document,
      idDocumentPublicId,
      id_document_public_id,
      proofOfAddress,
      proof_of_address,
      proofOfAddressPublicId,
      proof_of_address_public_id,
      businessName,
      business_name,
      registrationNumber,
      registration_number,
      businessType,
      business_type,
      industry,
      registeredAddress,
      registered_address,
      businessAddress,
      business_address,
      contactPersonName,
      contact_person_name,
      contactPersonEmail,
      contact_person_email,
      taxIdentificationNumber,
      tax_identification_number,
      industryCategoryId,
      categoryId,
      category_id,
      certificateOfIncorporation,
      certificate_of_incorporation,
      certificateOfIncorporationPublicId,
      certificate_of_incorporation_public_id,
      memorandumArticles,
      memorandum_articles,
      memorandumArticlesPublicId,
      memorandum_articles_public_id,
      representatives
    } = req.body;

    const normalizedDateOfBirth = dateOfBirth || date_of_birth || dob || null;
    const normalizedBusinessName = businessName || business_name || null;
    const normalizedRegistrationNumber = registrationNumber || registration_number || null;
    const normalizedTaxIdentificationNumber = taxIdentificationNumber || tax_identification_number || null;
    const normalizedIndustryCategoryId = industryCategoryId || categoryId || category_id || null;
    const normalizedBusinessType = businessType || business_type || null;
    const normalizedRegisteredAddress = registeredAddress || registered_address || null;
    const normalizedBusinessAddress = businessAddress || business_address || null;
    const normalizedContactPersonName = contactPersonName || contact_person_name || null;
    const normalizedContactPersonEmail = contactPersonEmail || contact_person_email || null;
    const normalizedResidentialAddress = residentialAddress || residential_address || null;
    const normalizedMailingAddress = mailingAddress || mailing_address || null;
    const normalizedIdDocument = idDocument || id_document || null;
    const normalizedIdDocumentPublicId = idDocumentPublicId || id_document_public_id || null;
    const normalizedProofOfAddress = proofOfAddress || proof_of_address || null;
    const normalizedProofOfAddressPublicId = proofOfAddressPublicId || proof_of_address_public_id || null;
    const normalizedCertificateOfIncorporation = certificateOfIncorporation || certificate_of_incorporation || null;
    const normalizedCertificateOfIncorporationPublicId = certificateOfIncorporationPublicId || certificate_of_incorporation_public_id || null;
    const normalizedMemorandumArticles = memorandumArticles || memorandum_articles || null;
    const normalizedMemorandumArticlesPublicId = memorandumArticlesPublicId || memorandum_articles_public_id || null;

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
      if (!normalizedBusinessName) {
        return res.status(400).json({ success: false, message: 'businessName is required for business KYC' });
      }
    }

    // Check if user already has a KYC record
    const existingKycResult = await db.select().from(kycsTable).where(eq(kycsTable.userId, req.user.id)).limit(1);
    const existingKyc = existingKycResult[0];

    const kycId = existingKyc ? existingKyc.id : randomUUID();
    const status = 'inprogress';
    const verificationStatus = 'unverified';
    const rejectionReason = null;

    // Run insert/update in a transaction to safely handle both kyc and representatives
    await db.transaction(async (tx) => {
      const kycData = {
        id: kycId,
        userId: req.user.id,
        type,
        status,
        email,
        phoneNumber,
        businessName: type === 'business' ? normalizedBusinessName : null,
        registrationNumber: type === 'business' ? (normalizedRegistrationNumber || idNumber) : null,
        taxIdentificationNumber: type === 'business' ? normalizedTaxIdentificationNumber : null,
        rejectionReason,
        industryCategoryId: type === 'business' ? normalizedIndustryCategoryId : null,
        idType,
        idNumber,
        firstName: type === 'individual' ? firstName : null,
        lastName: type === 'individual' ? lastName : null,
        dob: type === 'individual' ? normalizedDateOfBirth : null,
        dateOfBirth: type === 'individual' ? normalizedDateOfBirth : null,
        nationality: type === 'individual' ? (nationality || null) : null,
        residentialAddress: type === 'individual' ? normalizedResidentialAddress : null,
        mailingAddress: type === 'individual' ? normalizedMailingAddress : null,
        idDocument: type === 'individual' ? (normalizedIdDocument !== null ? normalizedIdDocument : existingKyc?.idDocument) : null,
        idDocumentPublicId: type === 'individual' ? (normalizedIdDocumentPublicId !== null ? normalizedIdDocumentPublicId : existingKyc?.idDocumentPublicId) : null,
        proofOfAddress: type === 'individual' ? (normalizedProofOfAddress !== null ? normalizedProofOfAddress : existingKyc?.proofOfAddress) : null,
        proofOfAddressPublicId: type === 'individual' ? (normalizedProofOfAddressPublicId !== null ? normalizedProofOfAddressPublicId : existingKyc?.proofOfAddressPublicId) : null,
        businessType: type === 'business' ? normalizedBusinessType : null,
        industry: type === 'business' ? (industry || null) : null,
        registeredAddress: type === 'business' ? normalizedRegisteredAddress : null,
        businessAddress: type === 'business' ? normalizedBusinessAddress : null,
        contactPersonName: type === 'business' ? normalizedContactPersonName : null,
        contactPersonEmail: type === 'business' ? normalizedContactPersonEmail : null,
        certificateOfIncorporation: type === 'business' ? (normalizedCertificateOfIncorporation !== null ? normalizedCertificateOfIncorporation : existingKyc?.certificateOfIncorporation) : null,
        certificateOfIncorporationPublicId: type === 'business' ? (normalizedCertificateOfIncorporationPublicId !== null ? normalizedCertificateOfIncorporationPublicId : existingKyc?.certificateOfIncorporationPublicId) : null,
        memorandumArticles: type === 'business' ? (normalizedMemorandumArticles !== null ? normalizedMemorandumArticles : existingKyc?.memorandumArticles) : null,
        memorandumArticlesPublicId: type === 'business' ? (normalizedMemorandumArticlesPublicId !== null ? normalizedMemorandumArticlesPublicId : existingKyc?.memorandumArticlesPublicId) : null,
        verificationStatus,
        verifiedAt: null,
        thirdPartyReference: null,
        verificationDetails: null
      };

      if (existingKyc) {
        await tx.update(kycsTable).set(kycData).where(eq(kycsTable.id, kycId));
      } else {
        await tx.insert(kycsTable).values(kycData);
      }

      if (type === 'business' && representatives && Array.isArray(representatives) && representatives.length > 0) {
        if (existingKyc) {
          await tx.delete(kycRepresentativesTable).where(eq(kycRepresentativesTable.kycId, kycId));
        }
        const repsToInsert = representatives.map(rep => ({
          kycId,
          name: rep.name,
          position: rep.position
        }));
        await tx.insert(kycRepresentativesTable).values(repsToInsert);
      }
    });

    return res.status(201).json({
      success: true,
      message: 'KYC form submitted successfully and is pending review',
      data: { id: kycId, userId: req.user.id, type, status, verificationStatus, thirdPartyReference: null }
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
        dateOfBirth: kyc.dateOfBirth,
        nationality: kyc.nationality,
        residentialAddress: kyc.residentialAddress,
        mailingAddress: kyc.mailingAddress,
        idDocument: kyc.idDocument,
        idDocumentPublicId: kyc.idDocumentPublicId,
        proofOfAddress: kyc.proofOfAddress,
        proofOfAddressPublicId: kyc.proofOfAddressPublicId,
        businessType: kyc.businessType,
        industry: kyc.industry,
        registeredAddress: kyc.registeredAddress,
        businessAddress: kyc.businessAddress,
        contactPersonName: kyc.contactPersonName,
        contactPersonEmail: kyc.contactPersonEmail,
        certificateOfIncorporation: kyc.certificateOfIncorporation,
        certificateOfIncorporationPublicId: kyc.certificateOfIncorporationPublicId,
        memorandumArticles: kyc.memorandumArticles,
        memorandumArticlesPublicId: kyc.memorandumArticlesPublicId,
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
          dateOfBirth: row.kycs.dateOfBirth,
          nationality: row.kycs.nationality,
          residentialAddress: row.kycs.residentialAddress,
          mailingAddress: row.kycs.mailingAddress,
          idDocument: row.kycs.idDocument,
          idDocumentPublicId: row.kycs.idDocumentPublicId,
          proofOfAddress: row.kycs.proofOfAddress,
          proofOfAddressPublicId: row.kycs.proofOfAddressPublicId,
          businessType: row.kycs.businessType,
          industry: row.kycs.industry,
          registeredAddress: row.kycs.registeredAddress,
          businessAddress: row.kycs.businessAddress,
          contactPersonName: row.kycs.contactPersonName,
          contactPersonEmail: row.kycs.contactPersonEmail,
          certificateOfIncorporation: row.kycs.certificateOfIncorporation,
          certificateOfIncorporationPublicId: row.kycs.certificateOfIncorporationPublicId,
          memorandumArticles: row.kycs.memorandumArticles,
          memorandumArticlesPublicId: row.kycs.memorandumArticlesPublicId,
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

// Admin: Review/Update KYC Status (Approve / Reject) and edit details
export async function reviewKyc(req, res) {
  try {
    const { id } = req.params;
    const { status, rejectionReason, ...editableFields } = req.body;

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

    // Remove fields that shouldn't be edited directly here
    delete editableFields.id;
    delete editableFields.userId;
    delete editableFields.type;
    delete editableFields.verificationStatus;
    delete editableFields.verifiedAt;
    
    // Normalize date of birth field
    if (editableFields.dateOfBirth) {
      editableFields.dob = editableFields.dateOfBirth;
    }
    
    // Normalize category id
    if (editableFields.industryCategory && editableFields.industryCategory.id) {
        editableFields.industryCategoryId = editableFields.industryCategory.id;
        delete editableFields.industryCategory;
    }

    const updateData = { status, ...editableFields };
    if (status === 'rejected') {
      if (!rejectionReason && !kyc.rejectionReason) {
        // If it was already rejected and has a reason, we allow preserving it if not passed
        if (!req.body.rejectionReason && kyc.rejectionReason) {
            updateData.rejectionReason = kyc.rejectionReason;
        } else {
            return res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting KYC' });
        }
      } else if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
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
          businessType: row.kycs.businessType,
          industry: row.kycs.industry,
          registeredAddress: row.kycs.registeredAddress,
          businessAddress: row.kycs.businessAddress,
          contactPersonName: row.kycs.contactPersonName,
          contactPersonEmail: row.kycs.contactPersonEmail,
          certificateOfIncorporation: row.kycs.certificateOfIncorporation,
          certificateOfIncorporationPublicId: row.kycs.certificateOfIncorporationPublicId,
          memorandumArticles: row.kycs.memorandumArticles,
          memorandumArticlesPublicId: row.kycs.memorandumArticlesPublicId,
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
