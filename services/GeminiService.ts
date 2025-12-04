import { GoogleGenAI } from "@google/genai";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// Assume this variable is pre-configured, valid, and accessible in the execution context where the API client is initialized.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });