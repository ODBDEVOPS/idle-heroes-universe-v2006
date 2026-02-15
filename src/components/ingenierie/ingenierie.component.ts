import { Component, ChangeDetectionStrategy, output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { ALL_MATERIALS } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';

@Component({
  selector: 'app-ingenierie',
  standalone: true,
  templateUrl: './ingenierie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class IngenierieComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  materials = computed(() => {
    const ownedMaterials = this.gameService().gameState().materials;
    return ALL_MATERIALS
      .filter(m => m.type === 'Ore' || m.type === 'Stone' || m.type === 'Dust')
      .map(material => ({
        ...material,
        count: ownedMaterials[material.id] || 0
      }))
      .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  });

  hasMaterials = computed(() => this.materials().some(m => m.count > 0));

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
