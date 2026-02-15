import { Component, ChangeDetectionStrategy, output, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Material, ALL_MATERIALS } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';

interface ClickEffect { id: number; x: number; y: number; }
interface GatheredResource { id: number; name: string; rarity: Rarity; }

@Component({
  selector: 'app-bucheron',
  standalone: true,
  template: `
    <div class="h-full w-full relative overflow-hidden flex flex-col p-4 bg-gray-900 animate-fadeIn">
      <div class="absolute inset-0 bg-gradient-to-b from-gray-900 via-yellow-900/60 to-gray-900 opacity-50"></div>
      
      <header class="relative z-10 text-center mb-4">
        <button (click)="backToProfessions()" class="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-700/50 hover:bg-gray-600/50 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
          Back
        </button>
        <h1 class="text-4xl font-orbitron text-yellow-600 drop-shadow-lg">Bûcheron (Lumberjack)</h1>
      </header>

      <main class="relative z-10 flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2">
        <div class="bg-black/30 p-4 rounded-xl border border-gray-700/50 flex flex-col">
          <h2 class="text-xl font-orbitron text-gray-300 text-center mb-3">Your Wood</h2>
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
              <p class="text-center text-gray-500 italic py-8">You have no wood. Defeat 'Flora' type enemies or use this area to gather it.</p>
            }
          </div>
        </div>
        <div class="bg-black/30 p-6 rounded-xl border border-gray-700/50 flex flex-col items-center justify-center text-center relative">
          <h2 class="text-2xl font-orbitron text-gray-300 mb-4">Fallen Log</h2>
          
          <!-- Gathering Notifications -->
          <div class="absolute top-4 left-0 right-0 h-24 pointer-events-none">
            @for (resource of gatheredResources(); track resource.id) {
              <div class="absolute left-1/2 -translate-x-1/2 font-bold animate-resource-float" [class]="getRarityTextColor(resource.rarity)">
                {{ resource.name }}
              </div>
            }
          </div>

          <!-- Health Bar -->
          <div class="w-full max-w-xs mb-4">
            <div class="w-full bg-gray-700 rounded-full h-4 border-2 border-gray-500 relative">
              <div class="bg-gradient-to-r from-yellow-700 to-amber-600 h-full rounded-full transition-all duration-150" [style.width.%]="treeHealth() / MAX_TREE_HEALTH * 100"></div>
              <span class="absolute inset-0 text-center text-xs font-bold text-white leading-4">{{ treeHealth() }} / {{ MAX_TREE_HEALTH }}</span>
            </div>
          </div>

          <!-- Log & Effects Container -->
          <div class="relative w-64 h-64 flex items-center justify-center">
            <!-- Cooldown Overlay -->
            @if (cooldownTimer() > 0) {
              <div class="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center z-20 animate-fadeIn">
                <p class="text-gray-400">New log available in...</p>
                <p class="text-3xl font-orbitron text-white">{{ cooldownTimer() }}s</p>
              </div>
            }
            
            <!-- Click Effects -->
            @for (effect of clickEffects(); track effect.id) {
              <div class="absolute text-3xl text-white/80 pointer-events-none z-10 animate-axe-swing" [style.left.px]="effect.x - 16" [style.top.px]="effect.y - 16">
                 🪓
              </div>
            }

            <!-- The Log -->
            <div (click)="onTreeClick($event)" class="w-64 h-24 bg-yellow-900/80 rounded-lg border-4 border-yellow-950/80 shadow-inner transition-transform duration-100 active:scale-95 relative"
                 [class.cursor-pointer]="treeHealth() > 0 && cooldownTimer() === 0"
                 [class.cursor-not-allowed]="treeHealth() <= 0 || cooldownTimer() > 0"
                 [class.opacity-40]="treeHealth() <= 0"
                 [class.animate-shake]="isTreeShaking()">
                 <!-- Log texture -->
                 <div class="absolute top-2 left-2 right-2 h-2 bg-yellow-800/50 rounded-full"></div>
                 <div class="absolute bottom-2 left-4 right-4 h-1 bg-yellow-950/50 rounded-full"></div>
            </div>
          </div>
          
          <p class="text-sm text-gray-500 mt-4">Click the log to chop for wood.</p>
        </div>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class BucheronComponent implements OnInit, OnDestroy {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  // Mini-game state
  readonly MAX_TREE_HEALTH = 100;
  readonly TREE_COOLDOWN_SECONDS = 7;

  treeHealth = signal(this.MAX_TREE_HEALTH);
  cooldownTimer = signal(0);
  
  clickEffects = signal<ClickEffect[]>([]);
  gatheredResources = signal<GatheredResource[]>([]);
  isTreeShaking = signal(false);

  private cooldownInterval: any;

  materials = computed(() => {
    const ownedMaterials = this.gameService().gameState().materials;
    return ALL_MATERIALS
      .filter(m => m.type === 'Wood')
      .map(material => ({
        ...material,
        count: ownedMaterials[material.id] || 0
      }))
      .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  });

  hasMaterials = computed(() => this.materials().some(m => m.count > 0));

  ngOnInit() {
    this.startCooldownTimer();
  }

  ngOnDestroy() {
    clearInterval(this.cooldownInterval);
  }

  startCooldownTimer() {
    this.cooldownInterval = setInterval(() => {
      this.cooldownTimer.update(t => {
        if (t <= 1) {
          if (this.treeHealth() <= 0) {
            this.treeHealth.set(this.MAX_TREE_HEALTH);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  onTreeClick(event: MouseEvent) {
    if (this.treeHealth() <= 0 || this.cooldownTimer() > 0) return;

    this.treeHealth.update(h => Math.max(0, h - 15)); // ~7 clicks
    this.createClickEffect(event);
    this.isTreeShaking.set(true);
    setTimeout(() => this.isTreeShaking.set(false), 300);

    // Chance to find wood
    if (Math.random() < 0.35) { // 35% chance per click
      const foundMaterial = this.getRandomWood();
      this.gameService().addMaterial(foundMaterial.id, 1);
      this.createGatheredResourceNotice(foundMaterial);
    }

    if (this.treeHealth() <= 0) {
      this.cooldownTimer.set(this.TREE_COOLDOWN_SECONDS);
      // Bonus for finishing a log
      const bonusMaterial = this.getRandomWood(true);
      this.gameService().addMaterial(bonusMaterial.id, 1);
      this.createGatheredResourceNotice(bonusMaterial);
    }
  }

  private createClickEffect(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const newEffect: ClickEffect = { id: Date.now(), x, y };
    this.clickEffects.update(effects => [...effects, newEffect]);
    setTimeout(() => this.clickEffects.update(effects => effects.filter(e => e.id !== newEffect.id)), 500);
  }

  private createGatheredResourceNotice(material: Material) {
    const newResource: GatheredResource = { id: Date.now() + Math.random(), name: `+1 ${material.name}`, rarity: material.rarity };
    this.gatheredResources.update(resources => [...resources, newResource]);
    setTimeout(() => this.gatheredResources.update(resources => resources.filter(r => r.id !== newResource.id)), 1200);
  }

  private getRandomWood(isBonus: boolean = false): Material {
    const woods = ALL_MATERIALS.filter(m => m.type === 'Wood');
    const rand = Math.random();
    
    // Weighted selection
    const weights = isBonus 
      ? { 'Common': 0.6, 'Rare': 0.35, 'Epic': 0.05 } 
      : { 'Common': 0.8, 'Rare': 0.19, 'Epic': 0.01 };

    let rarity: Rarity;
    if (rand < weights['Epic']) {
      rarity = 'Epic';
    } else if (rand < weights['Epic'] + weights['Rare']) {
      rarity = 'Rare';
    } else {
      rarity = 'Common';
    }

    const possible = woods.filter(m => m.rarity === rarity);
    if (possible.length > 0) {
      return possible[Math.floor(Math.random() * possible.length)];
    }
    // Fallback
    return woods.find(m => m.rarity === 'Common')!;
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
