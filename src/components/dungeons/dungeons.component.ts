import { Component, ChangeDetectionStrategy, output, input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService, ALL_DUNGEONS, ALL_DUNGEON_BOUNTIES, ALL_DUNGEON_SHOP_ITEMS } from '../../services/game.service';
import { ActiveDungeonRun, ActiveDungeonBounty } from '../../models/game-state.model';
import { EquipmentItem, Rarity } from '../../models/equipment.model';
import { Hero } from '../../models/hero.model';
import { Dungeon, DungeonDifficulty, DungeonBounty } from '../../models/dungeon.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-dungeons',
  standalone: true,
  templateUrl: './dungeons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class DungeonsComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  // Component State
  activeTab = signal<'runs' | 'bounties' | 'shop'>('runs');
  currentTime = signal(Date.now());

  // Dungeon Runs State
  selectedDifficulty = signal<DungeonDifficulty>('Normal');
  dungeonClaimResult = signal<{ gold: number; item: EquipmentItem | null; crests: number; petCrystals: number, petEgg: boolean } | null>(null);

  // Bounties State
  bountyToStart = signal<DungeonBounty | null>(null);
  isBountyModalOpen = signal(false);
  selectedHeroIds = signal<number[]>([]);
  bountyClaimResult = signal<{ gold: number; crests: number; petCrystals: number; essence: number; } | null>(null);
  
  // Shop State
  purchaseResult = signal<{ name: string } | null>(null);
  
  allDungeonBounties = ALL_DUNGEON_BOUNTIES;

  constructor() {
    effect((onCleanup) => {
      const interval = setInterval(() => this.currentTime.set(Date.now()), 1000);
      onCleanup(() => clearInterval(interval));
    });
  }

  // --- Computed Data ---
  dungeonSlots = computed(() => ({
    current: this.gameService().gameState().activeDungeonRuns.length,
    max: this.gameService().getDungeonSlotsEffect(),
  }));

  activeDungeonRuns = computed(() => {
    const now = this.currentTime();
    return this.gameService().gameState().activeDungeonRuns.map(run => {
      const details = ALL_DUNGEONS.find(d => d.id === run.dungeonId)!;
      const difficultyDetails = details.difficulties[run.difficulty];
      const remainingSeconds = Math.max(0, Math.floor((run.completionTime - now) / 1000));
      const progress = Math.min(100, (1 - remainingSeconds / difficultyDetails.durationSeconds) * 100);
      return { ...run, details, difficultyDetails, remainingSeconds, progress };
    }).sort((a, b) => a.completionTime - b.completionTime);
  });

  availableDungeons = computed(() => {
    const currentStage = this.gameService().gameState().stage;
    const activeRunIds = new Set(this.gameService().gameState().activeDungeonRuns.map(r => r.dungeonId));
    const difficulty = this.selectedDifficulty();
    
    return ALL_DUNGEONS.map(dungeon => {
      const diffDetails = dungeon.difficulties[difficulty];
      const cost = diffDetails.cost || {};
      const canAfford = (this.gameService().gameState().gold >= (cost.gold || 0)) && (this.gameService().gameState().prestigePoints >= (cost.prestigePoints || 0));

      return {
        ...dungeon,
        difficultyDetails: diffDetails,
        isAvailable: currentStage >= diffDetails.stageRequirement,
        isActive: activeRunIds.has(dungeon.id),
        canAfford,
      };
    });
  });

  // --- Bounties Computed Data ---
  heroesOnBounty = computed(() => new Set(this.gameService().gameState().activeDungeonBounties.flatMap(b => b.heroIds)));
  
  availableHeroesForBounty = computed(() => {
    const busyHeroes = this.heroesOnBounty();
    return this.gameService().heroes().filter(h => h.level > 0 && !busyHeroes.has(h.id)).sort((a,b) => b.level - a.level);
  });

  selectedHeroesForBounty = computed(() => {
    const ids = new Set(this.selectedHeroIds());
    return this.availableHeroesForBounty().filter(h => ids.has(h.id));
  });

  canDispatchBounty = computed(() => {
    const bounty = this.bountyToStart();
    if(!bounty) return false;
    return this.selectedHeroesForBounty().length === bounty.requiredHeroCount;
  });

  activeBounties = computed(() => {
    const now = this.currentTime();
    return this.gameService().gameState().activeDungeonBounties.map(b => {
      const details = ALL_DUNGEON_BOUNTIES.find(db => db.id === b.bountyId)!;
      const heroes = this.gameService().heroes().filter(h => b.heroIds.includes(h.id));
      const remainingSeconds = Math.max(0, Math.floor((b.completionTime - now) / 1000));
      const progress = Math.min(100, (1 - (remainingSeconds / details.durationSeconds)) * 100);
      return {...b, details, heroes, remainingSeconds, progress};
    });
  });

  // --- Shop Computed Data ---
  shopItems = computed(() => ALL_DUNGEON_SHOP_ITEMS.map(item => ({...item, soldOut: item.isSoldOut(this.gameService())})));

  // --- Dungeon Run Methods ---
  startDungeonRun(dungeonId: number, difficulty: DungeonDifficulty) {
    this.gameService().startDungeonRun(dungeonId, difficulty);
  }

  claimDungeonRun(run: ActiveDungeonRun) {
    const result = this.gameService().claimDungeonRun(run);
    if (result.gold > 0 || result.item || result.crests > 0 || result.petEgg) {
      this.dungeonClaimResult.set(result);
      setTimeout(() => this.dungeonClaimResult.set(null), 3000);
    }
  }

  // --- Bounty Methods ---
  openBountyModal(bounty: DungeonBounty) {
    this.bountyToStart.set(bounty);
    this.isBountyModalOpen.set(true);
  }
  closeBountyModal() {
    this.isBountyModalOpen.set(false);
    this.selectedHeroIds.set([]);
  }
  toggleHeroSelection(heroId: number) {
    this.selectedHeroIds.update(ids => {
        const bounty = this.bountyToStart()!;
        const newIds = new Set(ids);
        if (newIds.has(heroId)) {
            newIds.delete(heroId);
        } else if (newIds.size < bounty.requiredHeroCount) {
            newIds.add(heroId);
        }
        return Array.from(newIds);
    });
  }
  dispatchBounty() {
    if(!this.canDispatchBounty()) return;
    this.gameService().startDungeonBounty(this.bountyToStart()!.id, this.selectedHeroIds());
    this.closeBountyModal();
  }
  
  claimBounty(bounty: ActiveDungeonBounty) {
    const result = this.gameService().claimDungeonBounty(bounty);
    if(result) {
        this.bountyClaimResult.set(result);
        setTimeout(() => this.bountyClaimResult.set(null), 3000);
    }
  }

  // --- Shop Methods ---
  purchaseItem(itemId: number) {
    const result = this.gameService().purchaseDungeonShopItem(itemId);
    if (result) {
      this.purchaseResult.set({ name: result.name });
      setTimeout(() => this.purchaseResult.set(null), 2000);
    }
  }
  
  // --- UI Helpers ---
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
  formatDuration(s: number): string { if(s<=0)return "Ready"; const h=Math.floor(s/3600).toString().padStart(2,'0'); const m=Math.floor((s%3600)/60).toString().padStart(2,'0'); const sec=Math.floor(s%60).toString().padStart(2,'0'); if(h!=='00')return `${h}:${m}:${sec}`; return `${m}:${sec}`; }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic':return'text-red-500'; case 'Legendary':return'text-yellow-400'; case 'Epic':return'text-purple-500'; case 'Rare':return'text-blue-400'; default:return'text-gray-400';} }
  getHeroInitials(n: string): string { const p=n.split(' '); return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase(); }
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic':return'border-red-500'; case 'Legendary':return'border-yellow-400'; case 'Epic':return'border-purple-500'; case 'Rare':return'border-blue-400'; default:return'border-gray-600';} }
}
