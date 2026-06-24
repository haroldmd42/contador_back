import dotenv from "dotenv";

const result = dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
🚀 Servidor iniciado
🌎 Puerto: ${PORT}
`);
});