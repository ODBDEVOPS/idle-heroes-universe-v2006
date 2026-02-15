import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Hero } from '../models/hero.model';
import { ChronicleQuest, ChronicleQuestType } from '../models/chronicle.model';

// This is a simplified interface for the quest data returned by the API
interface ChronicleQuestData {
  title: string;
  narrative: string;
  questType: ChronicleQuestType;
  target: number;
}

export interface StrategicAnalysisPayload {
    stage: number;
    gold: number;
    prestigePoints: number;
    totalDps: number;
    activeTeam: { name: string; level: number; role: string; dps: number }[];
    prestigeUpgrades: { name: string; level: number }[];
}


@Injectable({
  providedIn: 'root',
})
export class ChronicleService {
  private ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: In a real application, the API key should be handled securely
    // and not exposed on the client-side. This is for demonstration purposes.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  async getStrategicAnalysis(payload: StrategicAnalysisPayload): Promise<string> {
    const teamString = payload.activeTeam.map(h => `- ${h.name} (Lvl ${h.level}, ${h.role}, ${h.dps.toFixed(0)} DPS)`).join('\n');
    const prestigeString = payload.prestigeUpgrades.map(u => `- ${u.name} (Lvl ${u.level})`).join('\n');

    const fullPrompt = `As an expert AI for the game 'Idle Heroes Universe', provide a concise strategic analysis for a player based on their current game state. The advice should be short (3-4 bullet points), actionable, and easy to understand.

Player's Current State:
- Stage: ${payload.stage}
- Gold: ${payload.gold.toFixed(0)}
- Prestige Points: ${payload.prestigePoints}
- Total DPS: ${payload.totalDps.toFixed(0)}
- Active Team:
${teamString}
- Prestige Upgrades:
${prestigeString}

Based on this data, provide a strategic report covering these topics:
1.  **Hero Focus:** Suggest which hero(es) on the active team would be the best to invest gold into for the biggest DPS increase.
2.  **Prestige Strategy:** Advise whether prestiging soon is a good idea (good if stage > 50) or if they should push further. Mention what prestige upgrade might be a good next choice.
3.  **Team Composition:** Give one brief tip about their team synergy or suggest a type of hero to look for.

Keep the tone encouraging and strategic. Format the output as a single block of text with bullet points using '*'.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          temperature: 0.5,
        }
      });
      return response.text;
    } catch (error) {
      console.error('Gemini API error (getStrategicAnalysis):', error);
      return "Unable to connect to strategic command. The cosmic winds are too strong.";
    }
  }

  async generateMemory(hero: Hero, prompt: string): Promise<string> {
    const fullPrompt = `Create a short, epic, and unique backstory memory (2-3 sentences) for a hero in the game 'Idle Heroes Universe'. The memory should be inspired by this prompt: "${prompt}".

Hero Details:
- Name: ${hero.name}
- Role: ${hero.role}
- Rarity: ${hero.rarity}
- Lore: "${hero.lore}"

The tone should be slightly dramatic and fit a high-fantasy, multi-universe setting.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          temperature: 0.9,
        }
      });
      return response.text;
    } catch (error) {
      console.error('Gemini API error (generateMemory):', error);
      return "The mists of time are cloudy... Unable to recall a memory at this moment.";
    }
  }

  async generateQuest(hero: Hero, memoryText: string): Promise<ChronicleQuestData | null> {
    const questGenPrompt = `Based on the hero's details and this specific memory, create a personal quest for them. The quest should be a direct consequence or reflection of the memory.

Hero Details:
- Name: ${hero.name}
- Role: ${hero.role}

Hero's Memory:
"${memoryText}"

Generate a JSON object for the quest with the following structure:
- title: A short, epic-sounding title for the quest.
- narrative: A one or two-sentence narrative explaining why the hero is undertaking this quest, based on the memory.
- questType: Choose ONE of the following types that best fits the narrative: 'defeatEnemies', 'clearTowerFloor', 'completeDungeons', 'useSkills', 'earnGold'.
- target: A reasonable number for the quest target based on the type. For 'clearTowerFloor', this should be a low number like 1-5. For 'defeatEnemies', a number between 100-500. For 'completeDungeons', 1-3. For 'useSkills', 20-50. For 'earnGold', a large number relative to an idle game.

Example Output:
{
  "title": "Echoes of the Void",
  "narrative": "Haunted by the memory of the abyss, ${hero.name} seeks to sharpen their skills against countless foes to prevent such a catastrophe again.",
  "questType": "defeatEnemies",
  "target": 250
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: questGenPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              narrative: { type: Type.STRING },
              questType: { type: Type.STRING, enum: ['defeatEnemies', 'clearTowerFloor', 'completeDungeons', 'useSkills', 'earnGold'] },
              target: { type: Type.INTEGER },
            },
            required: ["title", "narrative", "questType", "target"],
          },
        },
      });

      // The response text is a JSON string, so we parse it.
      let jsonStr = response.text.trim();
      return JSON.parse(jsonStr) as ChronicleQuestData;

    } catch (error) {
      console.error('Gemini API error (generateQuest):', error);
      return null;
    }
  }
}
