import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Message {
  role: 'user' | 'model';
  content: string;
  id: string;
  timestamp: number;
}

export async function* streamChat(messages: Message[]) {
  const stream = await ai.models.generateContentStream({
    model: "gemini-3.1-pro-preview",
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: "You are Lumina, a sophisticated and helpful AI assistant. Your responses should be clear, concise, and elegantly formatted using Markdown. You have a refined, professional yet warm personality.",
      tools: [{ googleSearch: {} }]
    }
  });

  for await (const chunk of stream) {
    yield (chunk as GenerateContentResponse).text;
  }
}

export async function generateImage(prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
