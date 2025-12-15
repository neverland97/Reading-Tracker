import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-2.5-flash';

interface AISuggestion {
  keywords: string[];
  summary: string;
  quotes: string[];
  typeRecommendation: string;
}

export const generateBookMetadata = async (title: string, author: string): Promise<AISuggestion> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const prompt = `
    我正在整理我的閱讀清單 (Reading Tracker)。請根據書名 "${title}" 和作者 "${author}"，提供以下資訊：
    1. 3-5 個精簡的風格關鍵字 (keywords)。
    2. 一個簡短的書籍摘要或介紹 (summary)，約 30 字，非常簡潔。
    3. 1 句這本書的經典名言 (quotes)。
    4. 推測這本書的類型 (typeRecommendation)，請從以下選項中選擇一個最接近的：小說、漫畫、非虛構、其它。

    請使用繁體中文回答，風格偏向復古、文學。
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "相關關鍵字列表"
      },
      summary: {
        type: Type.STRING,
        description: "書籍簡短摘要"
      },
      quotes: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "名言佳句列表"
      },
      typeRecommendation: {
        type: Type.STRING,
        description: "推測的書籍類型"
      }
    },
    required: ["keywords", "summary", "quotes", "typeRecommendation"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "你是一個復古圖書館的管理員，喜歡用打字機記錄書籍資訊。",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AISuggestion;
    }
    
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      keywords: [],
      summary: "",
      quotes: [],
      typeRecommendation: "其它"
    };
  }
};