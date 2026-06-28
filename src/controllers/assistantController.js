import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "../db/index.js";
import { kycsTable, bidsTable, usersTable } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'opencontracting_super_secret_key_123!';

export async function analyzeCompliance(req, res) {
  try {
    let companyContext = "The user is an unregistered guest browsing the public tenders.";

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] !== 'undefined' && authHeader.split(' ')[1] !== 'null') {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const users = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id)).limit(1);
        
        if (users.length > 0) {
          const userId = users[0].id;
          const userKyc = await db.select().from(kycsTable).where(eq(kycsTable.userId, userId));
          const businessKyc = userKyc.find(k => k.type === "business" && k.status === "approved");
          
          companyContext = "The user is logged in but has not completed business KYC. They are currently an unverified contractor.";
          if (businessKyc && businessKyc.data) {
            const details = typeof businessKyc.data === "string" ? JSON.parse(businessKyc.data) : businessKyc.data;
            companyContext = `The user represents an approved business named ${details.companyName || "Unknown"}. 
            Registration Number: ${details.registrationNumber || "N/A"}.
            Tax ID: ${details.taxId || "N/A"}.`;
          }
        }
      } catch (e) {
        // Ignore token errors, fallback to guest context
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: "Gemini API Key is not configured on the server." });
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const { question } = req.body;

    let prompt = "";
    if (question) {
      prompt = `
      You are an expert Procurement and Bidding AI Assistant for 'NaijaPass', a platform connecting contractors with tenders in Nigeria.
      
      User Profile Context:
      ${companyContext}
      
      The user asked the following question:
      "${question}"
      
      Please provide a concise, professional answer. Do not use heavy markdown headers, just return a plain-text or light markdown string that fits well in a small UI widget.
      `;
    } else {
      prompt = `
      You are an expert Procurement and Bidding AI Assistant for 'NaijaPass', a platform connecting contractors with tenders in Nigeria.
      
      User Profile Context:
      ${companyContext}
      
      The user has clicked the "Start Compliance Check" button on the global Open Tenders page to analyze their company profile against standard active tenders.
      
      Please provide a concise, professional 2-3 sentence analysis. 
      If they are an approved business, mention that they meet standard prerequisites (like Tax Clearance and CAC registration) and give a brief encouraging note on their win-rate probability. 
      If they are unverified, tell them they need to complete Business KYC (including uploading their Tax Clearance Certificate and CAC documents) before they can submit a bid.
      
      Do not use markdown headers, just return a short plain-text or light markdown string that fits well in a small UI widget.
      `;
    }

    // 4. Call Gemini
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ success: true, analysis: text });
  } catch (err) {
    console.error("Assistant Error:", err);
    return res.status(500).json({ success: false, message: "AI Error: " + err.message });
  }
}
