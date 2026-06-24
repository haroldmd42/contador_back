import express from "express";
import cors from "cors";
import geminiRoutes from "./routes/gemini.routes.js";

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin no permitido"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend funcionando",
  });
});

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use("/api/gemini", geminiRoutes);

export default app;