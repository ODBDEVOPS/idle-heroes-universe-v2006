import { Component, ChangeDetectionStrategy, output, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { ALL_MATERIALS, Material } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';
import { ALL_NECRO_RECIPES, ALL_NECRO_CONSTRUCTS, NecroConstructBonusType } from '../../models/necro-construct.model';

@Component({
  selector: 'app-necro-artisanat',
  standalone: true,
  templateUrl: './necro-artisanat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class NecroArtisanatComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  isCrafting = signal(false);
  craftSuccess = signal<Material | null>(null);

  allRecipes = computed(() => {
    const currentMaterials = this.gameService().gameState().materials;
    return ALL_NECRO_RECIPES.map(recipe => {
      const construct = ALL_NECRO_CONSTRUCTS.find(c => c.id === recipe.constructId)!;
      const materials = Object.entries(recipe.materials).map(([matId, required]) => {
        const matDetails = ALL_MATERIALS.find(m => m.id === matId)!;
        const owned = currentMaterials[matId] || 0;
        return { ...matDetails, required, owned };
      });
      const canCraft = materials.every(m => m.owned >= m.required);
      return { construct, materials, canCraft };
    });
  });

  ownedConstructs = computed(() => {
    const owned = this.gameService().gameState().necroConstructs;
    return Object.entries(owned).map(([id, count]) => {
        const details = ALL_NECRO_CONSTRUCTS.find(c => c.id === id)!;
        return { ...details, count };
    }).filter(c => (c.count as number) > 0);
  });

  totalBonuses = computed(() => {
    const totals: Partial<Record<NecroConstructBonusType, number>> = {};
    for (const construct of this.ownedConstructs()) {
        const currentTotal = totals[construct.bonusType] || 0;
        totals[construct.bonusType] = currentTotal + (construct.bonusValue * (construct.count as number));
    }
    return Object.entries(totals).map(([type, value]) => ({
        type: type as NecroConstructBonusType,
        value: value as number,
        text: this.getBonusText(type as NecroConstructBonusType, value as number)
    }));
  });

  getBonusText(type: NecroConstructBonusType, value: number): string {
    const percentage = (value * 100).toFixed(0);
    switch (type) {
        case 'dpsPercentTank': return `+${percentage}% DPS for Tanks`;
        case 'goldDropPercent': return `+${percentage}% Gold Find`;
        case 'skillChargeRate': return `+${percentage}% Skill Charge Rate`;
        default: return '';
    }
  }

  craft(constructId: string) {
    if (this.isCrafting()) return;

    this.isCrafting.set(true);

    setTimeout(() => {
        const success = this.gameService().craftNecroConstruct(constructId);
        if (success) {
            const construct = ALL_NECRO_CONSTRUCTS.find(c => c.id === constructId);
            this.craftSuccess.set(construct as any); // The type is compatible enough
            setTimeout(() => this.craftSuccess.set(null), 2000);
        }
        this.isCrafting.set(false);
    }, 1000);
  }

  backToProfessions() {
    this.viewChange.emit('professions');
  }

  getRarityTextColor(rarity: Rarity): string {
    switch (rarity) {
      case 'Mythic': return 'text-red-500';
      case 'Legendary': return 'text-yellow-400';
      case 'Epic': return 'text-purple-500';
      case 'Rare': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }
}
