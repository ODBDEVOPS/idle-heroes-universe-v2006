import { Component, ChangeDetectionStrategy, output, input, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Material, ALL_MATERIALS } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';

type FishingZoneId = 'River' | 'Swamp' | 'Ocean';
type FishingState = 'Idle' | 'Casting' | 'Waiting' | 'Bite' | 'Reeling' | 'Result';

interface FishingZone {
  id: FishingZoneId;
  name: string;
  theme: {
    bg: string;
    water: string;
    accent: string;
  };
  fish: string[]; // material IDs
}

const FISHING_ZONES: FishingZone[] = [
  { id: 'River', name: 'Serene River', theme: { bg: 'bg-blue-900/50', water: 'border-blue-500', accent: 'text-blue-300' }, fish: ['silverfin', 'river_grouper'] },
  { id: 'Swamp', name: 'Murky Swamp', theme: { bg: 'bg-green-900/50', water: 'border-green-500', accent: 'text-green-300' }, fish: ['glimmering_trout', 'abyssal_eel'] },
  { id: 'Ocean', name: 'Deep Ocean', theme: { bg: 'bg-indigo-900/50', water: 'border-indigo-500', accent: 'text-indigo-300' }, fish: ['voidfish', 'leviathan_scale'] },
];

@Component({
  selector: 'app-peche',
  standalone: true,
  templateUrl: './peche.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class PecheComponent implements OnDestroy {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  // State
  activeZoneId = signal<FishingZoneId>('River');
  fishingState = signal<FishingState>('Idle');
  lastCatch = signal<{ fish: Material, success: boolean } | null>(null);
  
  // Reel Minigame State
  reelGame = signal<{ progress: number; speed: number; successStart: number; successWidth: number; interval: any } | null>(null);
  showSplash = signal(false);

  // Data
  allFishingZones = FISHING_ZONES;
  
  private biteTimeout: any;

  activeZone = computed(() => this.allFishingZones.find(z => z.id === this.activeZoneId())!);

  potentialCatches = computed(() => {
    const zone = this.activeZone();
    if (!zone) return [];
    return zone.fish.map(fishId => ALL_MATERIALS.find(m => m.id === fishId)!);
  });
  
  fishInventory = computed(() => {
    const materials = this.gameService().gameState().materials;
    return this.potentialCatches().map(fish => ({
      ...fish,
      count: materials[fish.id] || 0
    }));
  });

  ngOnDestroy() {
    clearTimeout(this.biteTimeout);
    if (this.reelGame()?.interval) {
      clearInterval(this.reelGame()!.interval);
    }
  }

  selectZone(zoneId: FishingZoneId) {
    if (this.fishingState() === 'Idle') {
      this.activeZoneId.set(zoneId);
    }
  }

  castLine() {
    if (this.fishingState() !== 'Idle') return;

    this.fishingState.set('Casting');
    this.lastCatch.set(null);
    setTimeout(() => {
      this.fishingState.set('Waiting');
      const waitTime = Math.random() * 4000 + 2000; // 2-6 seconds
      this.biteTimeout = setTimeout(() => this.onBite(), waitTime);
    }, 1000);
  }

  onBite() {
    this.fishingState.set('Bite');
    this.showSplash.set(true);
    setTimeout(() => this.showSplash.set(false), 500);

    setTimeout(() => {
      this.startReelGame();
    }, 500);
  }

  startReelGame() {
    this.fishingState.set('Reeling');
    
    const difficultyMod = { 'River': 1, 'Swamp': 1.5, 'Ocean': 2 };
    const speed = (Math.random() * 0.5 + 0.5) * difficultyMod[this.activeZoneId()];
    const successWidth = Math.max(15, 40 - (speed * 10));
    const successStart = Math.random() * (100 - successWidth);

    const interval = setInterval(() => {
      this.reelGame.update(game => {
        if (!game) return null;
        const newProgress = (game.progress + game.speed) % 200;
        return { ...game, progress: newProgress };
      });
    }, 16);

    this.reelGame.set({
      progress: 0,
      speed,
      successStart,
      successWidth,
      interval,
    });
  }

  reelIn() {
    if (this.fishingState() !== 'Reeling' || !this.reelGame()) return;

    const game = this.reelGame()!;
    clearInterval(game.interval);
    this.reelGame.set(null);

    const currentPos = game.progress > 100 ? 200 - game.progress : game.progress;
    const success = currentPos >= game.successStart && currentPos <= (game.successStart + game.successWidth);

    let caughtFish: Material | null = null;
    if (success) {
      const possibleFish = this.potentialCatches();
      const rand = Math.random();
      if(possibleFish.length > 1 && rand < 0.3) {
        caughtFish = possibleFish[1]; // The rarer one
      } else {
        caughtFish = possibleFish[0]; // The more common one
      }
      this.gameService().addMaterial(caughtFish.id, 1);
    }
    
    this.lastCatch.set({ fish: caughtFish!, success });
    this.fishingState.set('Result');
    setTimeout(() => this.fishingState.set('Idle'), 2000);
  }

  backToProfessions() {
    this.viewChange.emit('professions');
  }
  
  getRarityTextColor(rarity: Rarity): string { switch(rarity){ case 'Mythic':return'text-red-500'; case 'Legendary':return'text-yellow-400'; case 'Epic':return'text-purple-500'; case 'Rare':return'text-blue-400'; default:return'text-gray-400';} }
  getRarityBorderClass(rarity: Rarity): string { switch(rarity){ case 'Mythic':return'border-red-500'; case 'Legendary':return'border-yellow-400'; case 'Epic':return'border-purple-500'; case 'Rare':return'border-blue-400'; default:return'border-gray-600';} }
}
