import axios from 'axios';
import { randomUUID } from 'crypto';

const QOREID_BASE_URL = 'https://api.qoreid.com';

/**
 * Simulates a third-party ID verification API (e.g., Smile ID, Prembly / Identitypass).
 * ID Verification Service using QoreID API & Axios.
 */
export const idVerificationService = {
  /**
   * Helper to retrieve access token from QoreID using Client credentials.
   * @returns {Promise<string|null>} Access Token or null if credentials are not configured.
   */
  async getAccessToken() {
    const clientId = process.env.QOREID_CLIENT_ID;
    const clientSecret = process.env.QOREID_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    try {
      const response = await axios.post(`${QOREID_BASE_URL}/token`, {
        clientId,
        clientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.accessToken || response.data.token || null;
    } catch (err) {
      console.error('[QoreID Auth Error] Failed to get access token:', err.response?.data || err.message);
      throw new Error(`QoreID authentication failed: ${err.message}`);
    }
  },

  /**
   * Verifies an ID based on its type and number using QoreID (or fallback simulation).
   * @param {Object} params
   * @param {string} params.type - 'individual' or 'business'
   * @param {string} params.idType - 'NIN', 'BVN', 'DRIVERS_LICENSE', 'PASSPORT', 'CAC', 'TIN'
   * @param {string} params.idNumber - The identity document number
   * @param {string} [params.firstName] - Given name for individual
   * @param {string} [params.lastName] - Surname for individual
   * @param {string} [params.dob] - Date of birth for individual (YYYY-MM-DD)
   * @param {string} [params.businessName] - Business name for corporate accounts
   * @returns {Promise<Object>} Verification result
   */
  async verifyId({ type, idType, idNumber, firstName, lastName, dob, businessName }) {
    if (!idType || !idNumber) {
      return {
        verified: false,
        message: 'Missing required parameters idType or idNumber.',
        errorCode: 'MISSING_PARAMS'
      };
    }

    const normalizedIdType = idType.toUpperCase();
    const cleanIdNumber = idNumber.trim();

    // Try to retrieve access token to make real API call
    let token = null;
    try {
      token = await this.getAccessToken();
    } catch (err) {
      return {
        verified: false,
        message: `QoreID Authorization failed: ${err.message}`,
        errorCode: 'AUTH_FAILED'
      };
    }

    // --- REAL QOREID API CALL VIA AXIOS ---
    if (token) {
      console.log(`[QoreID Axios] Connecting to QoreID production/sandbox API for ${normalizedIdType} (${cleanIdNumber})...`);
      try {
        let response;
        if (type === 'individual') {
          let endpoint = '';
          const bodyPayload = {
            firstname: firstName,
            lastname: lastName,
            dob: dob || undefined
          };

          if (normalizedIdType === 'NIN') {
            endpoint = `/v1/ng/identities/nin/${cleanIdNumber}`;
          } else if (normalizedIdType === 'BVN') {
            endpoint = `/v1/ng/identities/bvn-basic/${cleanIdNumber}`;
          } else if (normalizedIdType === 'DRIVERS_LICENSE') {
            endpoint = `/v1/ng/identities/drivers-license/${cleanIdNumber}`;
          } else if (normalizedIdType === 'PASSPORT') {
            endpoint = `/v1/ng/identities/passport/${cleanIdNumber}`;
          } else {
            return {
              verified: false,
              message: `Unsupported QoreID Individual ID Type: ${idType}.`,
              errorCode: 'UNSUPPORTED_ID_TYPE'
            };
          }

          response = await axios.post(`${QOREID_BASE_URL}${endpoint}`, bodyPayload, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Business
          let endpoint = '';
          let bodyPayload = {};

          if (normalizedIdType === 'CAC') {
            endpoint = `/v2/ng/identities/cac-premium`;
            bodyPayload = { regNumber: cleanIdNumber.replace(/^(RC|IT|rc|it)/i, '') }; // QoreID usually expects clean numbers for CAC
          } else if (normalizedIdType === 'TIN') {
            endpoint = `/v1/ng/identities/tin`;
            bodyPayload = { taxId: cleanIdNumber };
          } else {
            return {
              verified: false,
              message: `Unsupported QoreID Business ID Type: ${idType}.`,
              errorCode: 'UNSUPPORTED_ID_TYPE'
            };
          }

          response = await axios.post(`${QOREID_BASE_URL}${endpoint}`, bodyPayload, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }

        const data = response.data;
        // Check QoreID verify/match conditions
        const status = data.status || data.summary?.status;
        const isVerified = status === 'VERIFIED' || status === 'MATCHED' || data.verified === true;

        return {
          verified: isVerified,
          message: isVerified ? 'Identity verified successfully via QoreID' : 'Identity verification failed via QoreID',
          reference: data.reference || data.transactionId || `ref_qor_${randomUUID().slice(0, 8)}`,
          verifiedAt: new Date().toISOString(),
          details: data
        };
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        console.error('[QoreID Axios Request Error]:', err.response?.data || err.message);
        return {
          verified: false,
          message: `QoreID API verification failed: ${errorMsg}`,
          errorCode: 'API_ERROR',
          details: err.response?.data || null
        };
      }
    }

    // --- MOCK FALLBACK SIMULATION (WHEN KEYS ARE ABSENT) ---
    console.log(`[QoreID Simulation] QOREID_CLIENT_ID / QOREID_CLIENT_SECRET missing. Simulating QoreID for ${normalizedIdType}...`);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Basic format validation
    if (type === 'individual') {
      const allowedIndividualTypes = ['NIN', 'BVN', 'DRIVERS_LICENSE', 'PASSPORT'];
      if (!allowedIndividualTypes.includes(normalizedIdType)) {
        return {
          verified: false,
          message: `Unsupported ID Type: ${idType}`,
          errorCode: 'UNSUPPORTED_ID_TYPE'
        };
      }

      if ((normalizedIdType === 'NIN' || normalizedIdType === 'BVN') && !/^\d{11}$/.test(cleanIdNumber)) {
        return {
          verified: false,
          message: `${normalizedIdType} must be exactly 11 digits.`,
          errorCode: 'INVALID_FORMAT'
        };
      }

      if (normalizedIdType === 'DRIVERS_LICENSE' && cleanIdNumber.length < 8) {
        return {
          verified: false,
          message: "Driver's license number is too short (minimum 8 characters).",
          errorCode: 'INVALID_FORMAT'
        };
      }
    } else {
      const allowedBusinessTypes = ['CAC', 'TIN'];
      if (!allowedBusinessTypes.includes(normalizedIdType)) {
        return {
          verified: false,
          message: `Unsupported ID Type: ${idType}`,
          errorCode: 'UNSUPPORTED_ID_TYPE'
        };
      }

      if (normalizedIdType === 'TIN' && !/^\d{10,12}$/.test(cleanIdNumber.replace(/-/g, ''))) {
        return {
          verified: false,
          message: 'TIN must be between 10 and 12 digits.',
          errorCode: 'INVALID_FORMAT'
        };
      }

      if (normalizedIdType === 'CAC' && !/^(RC|IT|rc|it)?\d{5,8}$/.test(cleanIdNumber.replace(/[\s-]/g, ''))) {
        return {
          verified: false,
          message: 'CAC number must start optionally with RC or IT, followed by 5 to 8 digits.',
          errorCode: 'INVALID_FORMAT'
        };
      }
    }

    // Simulate rejection
    if (cleanIdNumber.includes('999')) {
      return {
        verified: false,
        message: `QoreID Verification failed: Record not found for ${normalizedIdType} ${cleanIdNumber} or name mismatch.`,
        errorCode: 'RECORD_NOT_FOUND',
        reference: `ref_qor_err_${randomUUID().slice(0, 8)}`
      };
    }

    const reference = `ref_qor_sim_${randomUUID().slice(0, 8)}`;
    return {
      verified: true,
      message: 'Identity verified successfully (Simulated QoreID)',
      reference,
      verifiedAt: new Date().toISOString(),
      details: {
        status: 'VERIFIED',
        summary: { status: 'VERIFIED' },
        message: 'Matches found successfully',
        idType: normalizedIdType,
        idNumber: cleanIdNumber,
        matchedFields: {
          firstName: firstName || 'John',
          lastName: lastName || 'Doe',
          dob: dob || '1990-01-01',
          businessName: businessName || 'Gritinai Solutions Ltd'
        },
        source: `QoreID ${normalizedIdType} Registry Match`
      }
    };
  }
};
