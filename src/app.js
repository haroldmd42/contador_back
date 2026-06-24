import express from "express";
import cors from "cors";
import geminiRoutes from "./routes/gemini.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
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

      return callback(new Error("Origin no permitido"));
    },
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend funcionando",
  });
});

app.use("/api/gemini", geminiRoutes);

export default app;