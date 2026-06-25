import axios from 'axios';

async function testApi() {
  try {
    // We need to login as admin to get a token first
    const loginRes = await axios.post('http://localhost:3005/api/auth/login', {
      email: 'admin@demo.com',
      password: 'password'
    });
    
    // We might need to handle OTP since login returns an OTP now, wait, 
    // we can just use the DB to generate a token manually using signAuthToken from authController.js
    console.log("Login Res:", loginRes.data);
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}

testApi();
