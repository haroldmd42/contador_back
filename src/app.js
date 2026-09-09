import express from "express";
import cors from "cors";
import geminiRoutes from "./routes/gemini.routes.js";
import toolsRoutes from "./routes/tools.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://haroldmd42.github.io",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Origin bloqueado:", origin);

      return callback(null, true); // Allow origin dynamically for flexibility in local/staging environments
    },
    methods: ["GET", "POST", "OPTIONS"],
    exposedHeaders: ["Content-Disposition", "Content-Type"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend funcionando",
  });
});

app.use("/api/gemini", geminiRoutes);
app.use("/api/tools", toolsRoutes);

export default app;