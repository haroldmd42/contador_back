import dotenv from 'dotenv';
dotenv.config();

import { generateGherkin } from '../src/services/groq.service.js';

async function main() {
  console.log("Calling generateGherkin...");
  const result = await generateGherkin("Como usuario registrado deseo iniciar sesión con email y contraseña para acceder a mi dashboard", "");
  console.log("SUCCESS RESPONSE:\n", result);
}

main();
