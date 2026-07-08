import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Google GenAI SDK with server-side API Key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse incoming JSON bodies
  app.use(express.json());

  // API Endpoint: Translates text from source to target language
  app.post("/api/translate", async (req: express.Request, res: express.Response) => {
    try {
      const { text, source, target } = req.body;
      
      if (!text || !source || !target) {
        return res.status(400).json({ error: "Missing required fields: text, source, or target." });
      }

      // Prompt crafted to get precise translation with zero preamble or extra commentary
      const prompt = `You are an expert, professional multilingual translator. 
Your task is to translate the provided text accurately and naturally.

Translate from: ${source}
Translate to: ${target}

Rules:
1. Maintain the original text's tone, styling, paragraph breaks, and formatting.
2. Return ONLY the translated text itself.
3. Do NOT add any preamble (like "Here is your translation:"), explanations, commentary, or markdown block code fences.
4. If the text cannot be translated, provide the closest possible conversion or keep it as is.

Text to translate:
${text}`;

      // Call Gemini 3.5 Flash model for translation tasks (completely free)
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const translatedText = response.text || "";
      
      return res.json({ translation: translatedText.trim() });
    } catch (error: any) {
      console.error("Gemini Translation Error:", error);
      return res.status(500).json({ 
        error: error.message || "An unexpected translation error occurred on the server." 
      });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
