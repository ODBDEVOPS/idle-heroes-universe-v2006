import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Quest, QuestCategory } from '../../models/quest.model';
import { ChronicleQuest } from '../../models/chronicle.model';

type DisplayQuest = Omit<Quest, 'target'> & {
  target: string | number;
  progress: number;
  targetValue: number;
};

type DisplayChronicleQuest = ChronicleQuest & {
  heroName: string;
  memoryId: string;
  heroId: number;
};

@Component({
  selector: 'app-quests',
  templateUrl: './quests.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class QuestsComponent {
  gameService = input.required<GameService>();

  questCategories: (QuestCategory | 'Chronicle')[] = ['Main Story', 'Daily', 'Weekly', 'Chronicle', 'Achievements'];
  activeCategory = signal<QuestCategory | 'Chronicle'>('Main Story');

  groupedQuests = computed(() => {
    const groups: Record<QuestCategory, Quest[]> = { 'Main Story': [], 'Daily': [], 'Weekly': [], 'Achievements': [] };
    for (const quest of this.gameService().quests()) {
      groups[quest.category]?.push(quest);
    }
    return groups;
  });

  processedQuests = computed<DisplayQuest[]>(() => {
    if (this.activeCategory() === 'Chronicle') return [];

    const quests = this.groupedQuests()[this.activeCategory() as QuestCategory] || [];
    const state = this.gameService().gameState();
    const heroes = this.gameService().heroes();

    return quests.map(q => {
      let progress = 0;
      let targetValue = 0;
      let targetDisplay: string | number = 0;

      switch(q.type) {
        case 'reachStage': progress = state.stage; targetValue = q.target as number; break;
        case 'levelUpHero': progress = Math.max(...heroes.map(h => h.level), 0); targetValue = q.target as number; break;
        case 'defeatEnemies': progress = state.totalEnemiesDefeated; targetValue = q.target as number; break;
        case 'summonHero': progress = state.totalHeroesSummoned; targetValue = q.target as number; break;
        case 'earnGold': progress = state.totalGoldEarned; targetValue = q.target as number; break;
        case 'useSkills': progress = state.totalSkillsUsed; targetValue = q.target as number; break;
        case 'clickCount': progress = state.totalClicks; targetValue = q.target as number; break;
        case 'prestigeCount': progress = state.totalPrestiges; targetValue = q.target as number; break;
        case 'unlockHeroCount': progress = state.unlockedHeroIds.length; targetValue = q.target as number; break;
        case 'completeDungeons': progress = state.totalDungeonsCompleted; targetValue = q.target as number; break;
        case 'completeExpeditions': progress = state.totalExpeditionsCompleted; targetValue = q.target as number; break;
        case 'clearTowerFloor': progress = state.towerFloor - 1; targetValue = q.target as number; break;
        case 'fieldHeroes': progress = state.activeHeroIds.filter(id => id !== null).length; targetValue = q.target as number; break;
        case 'forgeAnyItem': progress = state.totalItemsForged; targetValue = q.target as number; break;
        case 'claimSponsorGold': progress = state.totalSponsorClaims; targetValue = q.target as number; break;
      }
      targetDisplay = typeof q.target === 'object' ? `${(q.target as any).count} heroes to Lvl ${(q.target as any).level}` : (targetValue > 0 ? this.formatNumber(targetValue) : q.target.toString());

      return { ...q, progress, targetValue, target: targetDisplay };
    });
  });

  chronicleQuests = computed<DisplayChronicleQuest[]>(() => {
    if (this.activeCategory() !== 'Chronicle') return [];

    const memories = this.gameService().gameState().heroMemories;
    const allHeroes = this.gameService().heroes();
    const quests: DisplayChronicleQuest[] = [];

    for (const heroIdStr in memories) {
      const heroId = +heroIdStr;
      for (const memory of memories[heroId]) {
        if (memory.quest && !memory.quest.isClaimed) {
          const hero = allHeroes.find(h => h.id === heroId);
          quests.push({ 
            ...memory.quest, 
            heroName: hero?.name || 'Unknown Hero',
            memoryId: memory.id,
            heroId: heroId
          });
        }
      }
    }
    return quests;
  });

  changeCategory(category: QuestCategory | 'Chronicle') {
    this.activeCategory.set(category);
  }

  claimReward(questId: number) {
    this.gameService().claimQuestReward(questId);
  }
  
  claimChronicleReward(heroId: number, memoryId: string, questId: string) {
    this.gameService().claimChronicleQuestReward(heroId, memoryId, questId);
  }

  formatNumber(num: number): string {
    if (num < 1000) return num.toFixed(0);
    const s=["","k","M","B","T"],i=Math.floor(Math.log10(num)/3); const sn=(num/Math.pow(1000, i)).toFixed(1); return sn.replace(/\.0$/,'')+s[i];
  }
}
