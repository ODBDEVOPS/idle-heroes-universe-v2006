import { Component, ChangeDetectionStrategy, output, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService, ALL_PETS } from '../../services/game.service';
import { Rarity } from '../../models/equipment.model';
import { PlayerPet, Pet } from '../../models/pet.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

interface DisplayPet extends PlayerPet {
  details: Pet;
  currentBonus: number;
  levelUpCost: number;
  ascensionCost: number;
  canAscend: boolean;
  ascensionThreshold: number;
}

@Component({
  selector: 'app-pets',
  standalone: true,
  templateUrl: './pets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class PetsComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  ascensionNotice = signal<{ petName: string } | null>(null);

  playerPets = computed<DisplayPet[]>(() => {
    const essence = this.gameService().gameState().essenceOfLoyalty;
    return this.gameService().gameState().pets.map(p => {
      const details = ALL_PETS.find(ap => ap.id === p.petId)!;
      
      const ascensionMultiplier = 1 + (p.ascensionLevel * 1); // 100% bonus per ascension
      const currentBonus = (details.baseBonus + ((p.level - 1) * details.bonusPerLevel)) * ascensionMultiplier;
      
      const levelUpCost = 10 * p.level * (p.ascensionLevel + 1);
      
      const ascensionThreshold = 25;
      const ascensionCost = (details.evolutionCostEssence || 0) * (p.ascensionLevel + 1);
      const canAscend = p.level >= ascensionThreshold && details.evolutionCostEssence !== undefined && essence >= ascensionCost;

      return { ...p, details, currentBonus, levelUpCost, ascensionCost, canAscend, ascensionThreshold };
    }).sort((a,b) => a.details.id - b.details.id);
  });

  equippedPet = computed(() => this.playerPets().find(p => p.isEquipped));

  equipPet(petId: number) {
    this.gameService().equipPet(petId);
  }

  levelUpPet(petId: number) {
    this.gameService().levelUpPet(petId);
  }

  ascendPet(petId: number) {
    const success = this.gameService().ascendPet(petId);
    if(success) {
      const pet = this.playerPets().find(p => p.petId === petId);
      this.ascensionNotice.set({ petName: pet!.details.name });
      setTimeout(() => this.ascensionNotice.set(null), 2500);
    }
  }

  // UI Helpers
  getBonusText(pet: DisplayPet): string {
    const bonusValue = pet.currentBonus * 100;
    switch(pet.details.bonusType) {
      case 'goldDropPercent': return `+${bonusValue.toFixed(1)}% Gold Find`;
      case 'dpsPercent': return `+${bonusValue.toFixed(1)}% All DPS`;
      case 'clickDamagePercent': return `+${bonusValue.toFixed(1)}% Click Damage`;
      case 'skillChargeRate': return `+${bonusValue.toFixed(1)}% Skill Charge Rate`;
      case 'prestigePointPercent': return `+${bonusValue.toFixed(1)}% Prestige Points`;
      case 'chestChancePercent': return `+${bonusValue.toFixed(1)}% Item Drop Chance`;
      case 'dungeonSpeedPercent': return `-${bonusValue.toFixed(1)}% Dungeon Time`;
      case 'expeditionSpeedPercent': return `-${bonusValue.toFixed(1)}% Expedition Time`;
    }
  }

  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
}
