import express from "express";
import cors from "cors";
import geminiRoutes from "./routes/gemini.routes.js";

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://haroldmd42.github.io",
];

app.use(
  cors({
    origin(origin, callback) {
      // Permite Postman, curl y peticiones servidor-servidor
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
    credentials: true,
  })
);

app.use(express.json());
app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  next();
});
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend funcionando",
  });
});
app.get("/test-origin", (req, res) => {
  res.json({
    origin: req.headers.origin,
  });
});

app.use("/api/gemini", geminiRoutes);

export default app;