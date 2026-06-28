import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  console.log("Testing Gemini API Key...");
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env!");
    return;
  }
  
  const keyLength = process.env.GEMINI_API_KEY.length;
  console.log(`API Key found. Length: ${keyLength}`);
  if (process.env.GEMINI_API_KEY.includes('"')) {
    console.warn("WARNING: Your API key contains quote characters. This might cause issues.");
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    
    console.log("Calling model.generateContent...");
    const result = await model.generateContent("Hello, respond with a single word: OK.");
    console.log("SUCCESS! Response:", result.response.text());
  } catch (err) {
    console.error("\n--- GEMINI ERROR ---");
    console.error(err.message);
    console.error("--------------------");
    console.error("This usually means your API key is invalid or lacks access to the Generative Language API.");
  }
}

testGemini();
