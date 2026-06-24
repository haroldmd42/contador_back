import { generateGherkin } from "../services/gemini.service.js";

export async function askGemini(req, res) {
  try {
    const { prompt } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        message: "El prompt es obligatorio",
      });
    }

    const result = await generateGherkin(prompt);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("🔥 ERROR GEMINI COMPLETO:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
