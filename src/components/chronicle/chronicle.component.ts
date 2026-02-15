import { Component, ChangeDetectionStrategy, output, input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Hero } from '../../models/hero.model';
import { Rarity } from '../../models/equipment.model';
import { HeroMemory } from '../../models/chronicle.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-chronicle',
  standalone: true,
  templateUrl: './chronicle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TooltipDirective],
})
export class ChronicleComponent implements OnInit {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  selectedHeroId = signal<number | null>(null);
  
  // Memory Weaving State
  isWeavingMemory = signal(false);
  memoryPrompt = signal('');
  lastMemoryError = signal<string | null>(null);
  
  // Quest Forging State
  isForgingQuest = signal(false);
  lastQuestError = signal<string | null>(null);

  // Constants now accessed directly from GameService
  // readonly WEAVE_MEMORY_COST = 5; // Prestige Points
  // readonly FORGE_DESTINY_COST = 50000; // Gold

  defaultPrompts = [
    "A memory of their greatest failure.",
    "The origin of their unique power.",
    "A promise made to a lost loved one.",
    "The rival who pushes them to be better.",
    "A glimpse of a dark future they must prevent."
  ];

  eligibleHeroes = computed(() => {
    return this.gameService().heroes()
      .filter(h => h.level > 0)
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.level - a.level;
      });
  });

  selectedHero = computed(() => {
    const id = this.selectedHeroId();
    if (!id) return null;
    return this.eligibleHeroes().find(h => h.id === id) ?? null;
  });
  
  heroMemories = computed((): HeroMemory[] => {
      const hero = this.selectedHero();
      if (!hero) return [];
      return this.gameService().gameState().heroMemories[hero.id] || [];
  });
  
  canWeaveMemory = computed(() => this.gameService().gameState().prestigePoints >= GameService.WEAVE_MEMORY_COST);
  
  constructor() {
    // Logic moved to ngOnInit to ensure inputs are available.
  }

  ngOnInit() {
    // Select the first hero by default if available
    const heroes = this.eligibleHeroes();
    if (heroes.length > 0) {
      this.selectedHeroId.set(heroes[0].id);
    }
  }

  selectHero(id: number) {
    this.selectedHeroId.set(id);
    this.lastMemoryError.set(null);
    this.lastQuestError.set(null);
    this.memoryPrompt.set('');
  }

  useDefaultPrompt(prompt: string) {
    this.memoryPrompt.set(prompt);
  }

  async weaveMemory() {
    const hero = this.selectedHero();
    if (!hero || !this.canWeaveMemory() || this.isWeavingMemory() || !this.memoryPrompt().trim()) return;

    this.isWeavingMemory.set(true);
    this.lastMemoryError.set(null);

    const success = await this.gameService().weaveMemory(hero.id, this.memoryPrompt());
    if (!success) {
      this.lastMemoryError.set("Failed to weave a memory. The cosmic energies are unstable.");
    } else {
      this.memoryPrompt.set(''); // Clear prompt on success
    }

    this.isWeavingMemory.set(false);
  }

  async forgeDestiny(memoryId: string) {
    const hero = this.selectedHero();
    if (!hero || this.isForgingQuest() || this.gameService().gameState().gold < GameService.FORGE_DESTINY_COST) return;

    this.isForgingQuest.set(true);
    this.lastQuestError.set(null);

    const success = await this.gameService().forgeDestiny(hero.id, memoryId);
    if (!success) {
      this.lastQuestError.set("Failed to forge a destiny. The threads of fate are tangled.");
    }
    
    this.isForgingQuest.set(false);
  }

  // --- UI Helpers ---
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
  getHeroInitials(n: string): string { const p=n.split(' '); return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase(); }
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
}