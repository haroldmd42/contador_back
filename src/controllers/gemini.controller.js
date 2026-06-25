import { generateGherkin } from "../services/groq.service.js";

export async function askGemini(req, res) {
  try {

    const {
      userStory,
      additionalData
    } = req.body;

    if (!userStory?.trim()) {
      return res.status(400).json({
        success: false,
        message: "La historia de usuario es obligatoria",
      });
    }

    const result = await generateGherkin(
      userStory,
      additionalData || ""
    );

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
}