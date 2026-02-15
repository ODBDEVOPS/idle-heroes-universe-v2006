// These types are a subset of QuestType from quest.model.ts that are easy for an AI to generate valid targets for.
export type ChronicleQuestType = 'defeatEnemies' | 'clearTowerFloor' | 'completeDungeons' | 'useSkills' | 'earnGold';

export interface ChronicleQuest {
  id: string; // unique id for the quest
  title: string;
  narrative: string;
  questType: ChronicleQuestType;
  target: number;
  reward: { type: 'heroShards'; heroId: number; amount: number };
  isCompleted: boolean;
  isClaimed: boolean;
  progress: number;
}

export interface HeroMemory {
  id: string; // unique id for the memory
  prompt: string;
  text: string;
  timestamp: number;
  quest?: ChronicleQuest; // A memory can have one quest forged from it
}
