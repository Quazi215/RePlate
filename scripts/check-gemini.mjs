import { GoogleGenAI } from "@google/genai";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set. Add it to .env.local and rerun npm run gemini:check.");
  process.exitCode = 1;
} else {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: "Reply with only the word OK.",
      config: { candidateCount: 1, maxOutputTokens: 8, temperature: 0 },
    });
    if (typeof response.text !== "string" || response.text.trim() === "") {
      console.error("Gemini responded without text. Check model access and API settings.");
      process.exitCode = 1;
    } else {
      console.log("Gemini API request succeeded (gemini-3.5-flash-lite; response received). The response text was not printed.");
    }
  } catch (error) {
    const status = typeof error === "object" && error !== null && "status" in error &&
      typeof error.status === "number" ? `HTTP ${error.status}` : "network or SDK error";
    console.error(`Gemini API request failed (${status}). Check key validity, API access, quota, and connectivity.`);
    process.exitCode = 1;
  }
}
