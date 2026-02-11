import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTIONS } from "../constants";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("BASE64_CONVERSION_FAILURE"));
      }
    };
    reader.onerror = () => reject(new Error("FILE_READ_ERROR"));
    reader.readAsDataURL(file);
  });
};

export const transcribeAudio = async (file: File): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const base64Data = await fileToBase64(file);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: SYSTEM_INSTRUCTIONS.TRANSCRIPTION }
        ]
      },
      config: {
        temperature: 0,
        topP: 0.1,
        topK: 1,
      }
    });
    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");
    return text;
  } catch (error: any) {
    console.error("Gemini Transcription Core Failure:", error);
    throw error;
  }
};

export const polishTranscription = async (originalText: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [{ text: `${SYSTEM_INSTRUCTIONS.AI_POLISH}\n\nমূল টেক্সট:\n${originalText}` }]
      },
      config: {
        temperature: 0.1,
        topP: 0.1,
      }
    });
    const text = response.text;
    if (!text) throw new Error("EMPTY_POLISH_RESPONSE");
    return text;
  } catch (error: any) {
    console.error("Gemini Polishing Failure:", error);
    throw error;
  }
};