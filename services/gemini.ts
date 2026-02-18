
import { GoogleGenAI, Type } from "@google/genai";
import { GameState } from "../types";

// 严格按照文档使用 process.env.API_KEY
export const generateEventNarrative = async (state: GameState, eventType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    你现在是 AKB48 运营委员会。
    当前时间：第 ${state.time.year} 年 第 ${state.time.quarter} 季度。
    玩家信息：姓名：${state.player.name}，队伍：${state.player.team}，人气：${state.player.stats.popularity}，中心位次数：${state.player.centerCount}。
    事件类型：${eventType}

    请根据这些信息，生成一段极具 AKB48 风格（充满了热血、汗水、梦想和残酷竞争的氛围）的剧情描述。
    要求：
    1. 语气专业且带有偶像行业的术语。
    2. 如果是总选举，描述现场粉丝的疯狂和成员的泪水。
    3. 如果是文春爆料，描述那种晴天霹雳的冲击感。
    4. 结果需要符合逻辑。
    5. 返回 JSON 格式，包含 title 和 description。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    });

    return JSON.parse(response.text || '{"title": "系统公告", "description": "发生了意料之外的事情..."}');
  } catch (error) {
    console.error("Gemini narrative failed", error);
    return { title: "系统公告", description: "运营内部正在商讨重要事项，请稍后再试。" };
  }
};
