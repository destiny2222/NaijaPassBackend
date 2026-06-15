import { randomUUID } from 'crypto';
import 'dotenv/config';
import mysql from 'mysql2/promise';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('=== Starting KYC & Identity Verification Tests ===\n');

  try {
    // Check if server is running
    const healthCheck = await fetch('http://localhost:3000/').then(r => r.json()).catch(() => null);
    if (!healthCheck) {
      console.error('Error: Express server is not running on http://localhost:3000.');
      console.log('Please start the server first using: npm run dev');
      process.exit(1);
    }
    console.log('Server health check passed:', healthCheck.message);

    // Seed industry categories if not present to prevent foreign key errors
    console.log('Seeding industry categories...');
    const dbConnection = await mysql.createConnection(process.env.DATABASE_URL);
    await dbConnection.query(`
      INSERT INTO industry_categories (id, name)
      VALUES (1, 'Construction & Infrastructure')
      ON DUPLICATE KEY UPDATE name = 'Construction & Infrastructure';
    `);
    await dbConnection.query(`
      INSERT INTO industry_categories (id, name)
      VALUES (2, 'Information Technology')
      ON DUPLICATE KEY UPDATE name = 'Information Technology';
    `);
    await dbConnection.end();
    console.log('Seeding completed successfully.');

    // Generate unique emails for test runs
    const email1 = `indiv_valid_${randomUUID().slice(0, 5)}@test.com`;
    const email2 = `indiv_invalid_${randomUUID().slice(0, 5)}@test.com`;
    const email3 = `biz_valid_${randomUUID().slice(0, 5)}@test.com`;

    // ----------------------------------------------------
    // TEST 1: Register and login User 1 (Individual, Valid)
    // ----------------------------------------------------
    console.log('\n--- Test 1: Registering User 1 (Individual, Valid NIN) ---');
    const user1Token = await registerAndLogin('Test User One', email1);
    
    console.log('Submitting Valid Individual KYC (NIN)...');
    const kycSubmit1 = await submitKyc(user1Token, {
      type: 'individual',
      email: email1,
      phoneNumber: '+2348011111111',
      idType: 'NIN',
      idNumber: '12345678901', // Valid 11-digit NIN
      firstName: 'John',
      lastName: 'Doe',
      dob: '1995-05-15'
    });
    console.log('Submission Result:', kycSubmit1);

    // ----------------------------------------------------
    // TEST 2: Get KYC Status for User 1
    // ----------------------------------------------------
    console.log('\n--- Test 2: Retrieving KYC status for User 1 ---');
    const myKyc1 = await getMyKyc(user1Token);
    console.log('My KYC Data:', JSON.stringify(myKyc1.data, null, 2));

    // ----------------------------------------------------
    // TEST 3: Register and login User 2 (Individual, Invalid)
    // ----------------------------------------------------
    console.log('\n--- Test 3: Registering User 2 (Individual, Invalid ID) ---');
    const user2Token = await registerAndLogin('Test User Two', email2);
    
    console.log('Submitting Invalid Individual KYC (NIN contains 999)...');
    const kycSubmit2 = await submitKyc(user2Token, {
      type: 'individual',
      email: email2,
      phoneNumber: '+2348022222222',
      idType: 'NIN',
      idNumber: '12345699901', // Simulates third party verification fail
      firstName: 'Jane',
      lastName: 'Smith',
      dob: '1997-09-20'
    });
    console.log('Submission Result (Expected Error):', kycSubmit2);

    // Verify KYC status was recorded as rejected
    const myKyc2 = await getMyKyc(user2Token);
    console.log('User 2 KYC status in DB (Expected status: rejected):');
    console.log(`Status: ${myKyc2.data.status}, Verification Status: ${myKyc2.data.verificationStatus}`);
    console.log(`Rejection Reason: ${myKyc2.data.rejectionReason}`);

    // ----------------------------------------------------
    // TEST 4: Register and login User 3 (Business, Valid)
    // ----------------------------------------------------
    console.log('\n--- Test 4: Registering User 3 (Business, Valid CAC & representatives) ---');
    const user3Token = await registerAndLogin('Destiny Corporation', email3);
    
    console.log('Submitting Valid Business KYC...');
    const kycSubmit3 = await submitKyc(user3Token, {
      type: 'business',
      email: 'info@destinycorp.com',
      phoneNumber: '+2348033333333',
      idType: 'CAC',
      idNumber: 'RC123456', // Valid CAC format
      businessName: 'Destiny Corporation Ltd',
      registrationNumber: 'RC123456',
      taxIdentificationNumber: '12345678-0001',
      industryCategoryId: 1, // Assumes category 1 exists
      representatives: [
        { name: 'Destiny CEO', position: 'Managing Director' },
        { name: 'Alice Smith', position: 'Secretary' }
      ]
    });
    console.log('Submission Result:', kycSubmit3);

    const myKyc3 = await getMyKyc(user3Token);
    console.log('Business KYC & Representatives saved:');
    console.log(`Status: ${myKyc3.data.status}, Verification Status: ${myKyc3.data.verificationStatus}`);
    console.log(`Representatives:`, myKyc3.data.representatives);

    // ----------------------------------------------------
    // TEST 5: Fetch Directory of Verified Businesses
    // ----------------------------------------------------
    console.log('\n--- Test 5: Fetching Verified Business Directory ---');
    // Any authenticated user can view the directory. We use User 1 token.
    const directory = await getDirectory(user1Token);
    console.log('Verified Businesses in Directory:', directory.data.length);
    console.log('Directory Data:', JSON.stringify(directory.data, null, 2));

    console.log('\n=== All tests finished successfully ===');
  } catch (error) {
    console.error('Test run failed with error:', error);
  }
}

async function registerAndLogin(name, email) {
  const password = 'testpassword123';
  
  // Register
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role: 'user' })
  }).then(r => r.json());

  if (!regRes.success) {
    throw new Error(`Registration failed: ${regRes.message}`);
  }

  // Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(r => r.json());

  if (!loginRes.success) {
    throw new Error(`Login failed: ${loginRes.message}`);
  }

  return loginRes.token;
}

async function submitKyc(token, payload) {
  return fetch(`${BASE_URL}/kyc/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  }).then(async r => {
    const data = await r.json();
    return { status: r.status, data };
  });
}

async function getMyKyc(token) {
  return fetch(`${BASE_URL}/kyc/my`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
}

async function getDirectory(token) {
  return fetch(`${BASE_URL}/kyc/directory`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
}

runTests();
