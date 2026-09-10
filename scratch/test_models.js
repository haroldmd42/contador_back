import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function listModels() {
  try {
    const models = await groq.models.list();
    console.log("ACTIVE GROQ MODELS:\n", models.data.map(m => m.id));
  } catch (err) {
    console.error("FAILED TO LIST MODELS:", err.message);
  }
}

listModels();
