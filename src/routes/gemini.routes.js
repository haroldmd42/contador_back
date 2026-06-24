import { Router } from "express";
import { askGemini } from "../controllers/gemini.controller.js";

const router = Router();

router.post("/", askGemini);

export default router;