import { Component, ChangeDetectionStrategy, output, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Material, ALL_MATERIALS } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-soul-alchemy',
  standalone: true,
  templateUrl: './soul-alchemy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class SoulAlchemyComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  fusionSlots = signal<(Material | null)[]>([null, null]);
  isFusing = signal(false);
  fusionSuccess = signal<Material | null>(null);

  elementalSouls = computed(() => {
    const soulIds = ['soul_fire', 'soul_water', 'soul_earth', 'soul_air'];
    const materials = this.gameService().gameState().materials;
    return ALL_MATERIALS.filter(m => soulIds.includes(m.id)).map(soul => ({
      ...soul,
      count: materials[soul.id] || 0
    }));
  });

  discoveredSouls = computed(() => {
    const unlockedIds = this.gameService().gameState().unlockedHybridSouls || [];
    return ALL_MATERIALS.filter(m => unlockedIds.includes(m.id));
  });

  fusionResult = computed(() => {
    const slot1 = this.fusionSlots()[0];
    const slot2 = this.fusionSlots()[1];
    if (!slot1 || !slot2) return null;
    
    const resultId = this.gameService().getFusionRecipe(slot1.id, slot2.id);
    if (!resultId) return null;

    return ALL_MATERIALS.find(m => m.id === resultId) ?? null;
  });

  canFuse = computed(() => {
    if (!this.fusionResult()) return false;
    const materials = this.gameService().gameState().materials;
    const slot1 = this.fusionSlots()[0]!;
    const slot2 = this.fusionSlots()[1]!;
    if (slot1.id === slot2.id) {
        return (materials[slot1.id] || 0) >= 2;
    }
    return (materials[slot1.id] || 0) >= 1 && (materials[slot2.id] || 0) >= 1;
  });

  addToFusion(soul: Material) {
    if (this.isFusing()) return;
    this.fusionSlots.update(slots => {
      const newSlots = [...slots];
      const emptyIndex = newSlots.indexOf(null);
      if (emptyIndex !== -1) {
        newSlots[emptyIndex] = soul;
      }
      return newSlots;
    });
  }

  removeFromFusion(index: number) {
    if (this.isFusing()) return;
    this.fusionSlots.update(slots => {
      const newSlots = [...slots];
      newSlots[index] = null;
      return newSlots;
    });
  }
  
  executeFusion() {
    if (!this.canFuse() || this.isFusing()) return;

    const slot1 = this.fusionSlots()[0]!;
    const slot2 = this.fusionSlots()[1]!;
    
    this.isFusing.set(true);

    setTimeout(() => {
        const result = this.gameService().fuseSouls(slot1.id, slot2.id);
        if(result.success) {
            this.fusionSuccess.set(result.result!);
            this.fusionSlots.set([null, null]);
        }
        this.isFusing.set(false);
        setTimeout(() => this.fusionSuccess.set(null), 2000);
    }, 1200);
  }

  getResonanceBonus(soulId: string): string {
    switch (soulId) {
        case 'magma_soul': return '+5% All DPS';
        case 'storm_soul': return '+5% Skill Charge Rate';
        case 'lightning_soul': return '+10% Click Damage';
        case 'geode_soul': return '+5% Gold Find';
        default: return '';
    }
  }

  // UI Helpers
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
}
