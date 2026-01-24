import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export default async function embedText(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!values) {
    throw new Error("Failed to generate embedding");
  }

  return values;
}
