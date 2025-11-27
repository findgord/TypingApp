import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty } from "../types";

// Helper to sanitize output
const cleanText = (text: string): string => {
  return text.replace(/```/g, '').replace(/\n/g, ' ').trim();
};

export const generatePracticeText = async (topic: string, difficulty: Difficulty): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = "";
  
  switch (difficulty) {
    case Difficulty.EASY:
      prompt = `Generate a simple, easy-to-type paragraph about ${topic}. Use common words, short sentences, and minimal punctuation. Length: approx 30 words. Return ONLY the raw text.`;
      break;
    case Difficulty.NORMAL:
      prompt = `Generate an interesting paragraph about ${topic}. Standard English difficulty. Length: approx 50 words. Return ONLY the raw text.`;
      break;
    case Difficulty.HARD:
      prompt = `Generate a complex paragraph about ${topic}. Use advanced vocabulary, varied punctuation (semicolons, hyphens), and longer sentences. Length: approx 60 words. Return ONLY the raw text.`;
      break;
    case Difficulty.CODE:
      prompt = `Generate a snippet of valid JavaScript/TypeScript code (no comments) related to ${topic}. Include brackets, parentheses, and camelCase variables. Length: approx 15 lines flattened to a single line or short block. Return ONLY the code text.`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return cleanText(response.text || "");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateRemedialDrill = async (missedKeys: string[]): Promise<string> => {
  if (!process.env.API_KEY) {
     throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const keysList = missedKeys.join(', ');
  
  const prompt = `Create a creative, slightly repetitive typing drill (tongue twister style) that focuses heavily on using these specific keys: [${keysList}]. 
  The sentence should be coherent but challenging. Length: approx 25 words. Return ONLY the raw text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return cleanText(response.text || "");
  } catch (error) {
    console.error("Gemini API Error (Drill):", error);
    throw error;
  }
};

export const analyzeProficiency = async (originalText: string, userTranscript: string, secondsTaken: number): Promise<{
  wpm: number;
  accuracy: number;
  errors: Record<string, number>;
}> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
  Target Text: "${originalText}"
  User Transcript: "${userTranscript}"
  Time Taken: ${secondsTaken} seconds.

  Analyze the reading performance.
  1. Calculate WPM (Words Per Minute) based on the User Transcript length and Time Taken.
  2. Compare the Transcript to the Target. Calculate Accuracy % (0-100) based on correct words.
  3. Identify missed or incorrect words.

  Return a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wpm: { type: Type.NUMBER },
            accuracy: { type: Type.NUMBER },
            missedWords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    const errorsMap: Record<string, number> = {};
    if (result.missedWords && Array.isArray(result.missedWords)) {
      result.missedWords.forEach((word: string) => {
        errorsMap[word] = 1;
      });
    }

    return {
      wpm: result.wpm || 0,
      accuracy: result.accuracy || 0,
      errors: errorsMap
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// Deprecated in favor of Live API + analyzeProficiency, but kept for compatibility if needed
export const analyzeReading = async (audioBase64: string, targetText: string): Promise<any> => {
   // Placeholder to prevent breaking old imports if any
   return { wpm: 0, accuracy: 0, errors: {}, transcription: "" };
};