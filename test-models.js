import 'dotenv/config';
import axios from 'axios';

async function testModels() {
  try {
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const models = response.data.models.map(m => m.name);
    console.log("Available models:", models.filter(m => m.includes('gemini')));
  } catch (err) {
    console.error("Error fetching models:", err.response ? err.response.data : err.message);
  }
}

testModels();
