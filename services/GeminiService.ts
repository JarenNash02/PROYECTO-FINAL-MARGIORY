import { GoogleGenAI } from "@google/genai";

// Se inicializa el cliente de Gemini siguiendo estrictamente las guías:
// 1. Usando el nombre de parámetro { apiKey: ... }
// 2. Obteniendo la clave exclusivamente de process.env.API_KEY
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });