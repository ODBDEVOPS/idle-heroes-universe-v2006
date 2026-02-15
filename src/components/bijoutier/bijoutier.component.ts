import { Component, ChangeDetectionStrategy, output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { ALL_MATERIALS } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';

@Component({
  selector: 'app-bijoutier',
  standalone: true,
  template: `
    <div class="h-full w-full relative overflow-hidden flex flex-col p-4 bg-gray-900 animate-fadeIn">
      <div class="absolute inset-0 bg-gradient-to-b from-gray-900 via-cyan-900/40 to-gray-900 opacity-50"></div>
      
      <header class="relative z-10 text-center mb-4">
        <button (click)="backToProfessions()" class="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-700/50 hover:bg-gray-600/50 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
          Back
        </button>
        <h1 class="text-4xl font-orbitron text-cyan-300 drop-shadow-lg">Bijoutier (Jewelcrafting)</h1>
      </header>
       <main class="relative z-10 flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2">
        <div class="bg-black/30 p-4 rounded-xl border border-gray-700/50 flex flex-col">
          <h2 class="text-xl font-orbitron text-gray-300 text-center mb-3">Your Gems &amp; Metals</h2>
          <div class="flex-grow overflow-y-auto space-y-2">
            @for(mat of materials(); track mat.id) {
              @if(mat.count > 0) {
                <div class="p-2 rounded-lg bg-gray-900/50 flex justify-between items-center">
                  <p class="font-semibold" [class]="getRarityTextColor(mat.rarity)">{{ mat.name }}</p>
                  <p class="font-bold text-white">{{ mat.count }}</p>
                </div>
              }
            }
            @if(!hasMaterials()) {
              <p class="text-center text-gray-500 italic py-8">You have no gems or metals.</p>
            }
          </div>
        </div>
        <div class="bg-black/30 p-6 rounded-xl border border-gray-700/50 flex flex-col items-center justify-center text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
          <h2 class="text-2xl font-orbitron text-gray-500">Jeweler's Table</h2>
          <p class="text-gray-400 mt-2">Designs for crafting rings, necklaces, and cutting gems will be available here soon.</p>
        </div>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class BijoutierComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  materials = computed(() => {
    const ownedMaterials = this.gameService().gameState().materials;
    return ALL_MATERIALS
      .filter(m => m.type === 'Ore' || m.type === 'Stone' || m.type === 'Reagent')
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
