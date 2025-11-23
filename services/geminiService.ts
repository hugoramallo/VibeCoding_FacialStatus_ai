import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FaceMetrics } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });

export const analyzeFace = async (base64Image: string, existingMetrics: FaceMetrics): Promise<AnalysisResult> => {
  // Remove data URL prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: `Analiza esta cara con alta precisión. 
            1. Analiza la textura de la piel, líneas de expresión y estructura ósea para estimar la edad con un margen de error máximo de 3 años (ej. "23-25").
            2. Identifica la emoción principal y el "vibe" estético (Cyberpunk, Minimalista, Vintage, etc).
            3. Genera recomendaciones.
            
            Responde estrictamente en JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING, description: "Emoción principal" },
                confidence: { type: Type.NUMBER, description: "Confianza del modelo 0-100" },
                description: { type: Type.STRING, description: "Descripción matizada de la expresión" },
              },
              required: ["primary", "confidence", "description"],
            },
            demographics: {
              type: Type.OBJECT,
              properties: {
                ageRange: { type: Type.STRING, description: "Rango de edad muy preciso (max 3 años diff)" },
                genderPrediction: { type: Type.STRING, description: "Predicción visual" },
              },
              required: ["ageRange", "genderPrediction"],
            },
            aesthetics: {
              type: Type.OBJECT,
              properties: {
                vibe: { type: Type.STRING, description: "Estilo visual/Arquetipo" },
                colors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Paleta de colores" },
                accessories: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Accesorios" },
              },
              required: ["vibe", "colors", "accessories"],
            },
            recommendations: {
              type: Type.OBJECT,
              properties: {
                music: { type: Type.STRING, description: "Track recomendado" },
                activity: { type: Type.STRING, description: "Actividad recomendada" },
              },
              required: ["music", "activity"],
            },
          },
          required: ["sentiment", "demographics", "aesthetics", "recommendations"],
        },
      },
    });

    if (response.text) {
      const geminiData = JSON.parse(response.text);
      
      // Merge Gemini Intelligence with MediaPipe Precision
      return {
        ...geminiData,
        metrics: existingMetrics, // Override generic metrics with precise ones
      } as AnalysisResult;
    } else {
      throw new Error("No text response from Gemini");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
