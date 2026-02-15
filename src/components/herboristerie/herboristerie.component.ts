import { Component, ChangeDetectionStrategy, output, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Material, ALL_MATERIALS } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';

interface ClickEffect { id: number; x: number; y: number; }
interface GatheredResource { id: number; name: string; rarity: Rarity; }

@Component({
  selector: 'app-herboristerie',
  standalone: true,
  templateUrl: './herboristerie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HerboristerieComponent implements OnInit, OnDestroy {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  // Mini-game state
  readonly MAX_PLANT_HEALTH = 100;
  readonly PLANT_COOLDOWN_SECONDS = 8;

  plantHealth = signal(this.MAX_PLANT_HEALTH);
  cooldownTimer = signal(0);
  
  clickEffects = signal<ClickEffect[]>([]);
  gatheredResources = signal<GatheredResource[]>([]);
  isPlantShaking = signal(false);

  private cooldownInterval: any;

  materials = computed(() => {
    const ownedMaterials = this.gameService().gameState().materials;
    return ALL_MATERIALS
      .filter(m => m.type === 'Herb')
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
          if (this.plantHealth() <= 0) {
            this.plantHealth.set(this.MAX_PLANT_HEALTH);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  onPlantClick(event: MouseEvent) {
    if (this.plantHealth() <= 0 || this.cooldownTimer() > 0) return;

    this.plantHealth.update(h => Math.max(0, h - 20)); // 5 clicks to deplete
    this.createClickEffect(event);
    this.isPlantShaking.set(true);
    setTimeout(() => this.isPlantShaking.set(false), 300);

    // Chance to find herb
    if (Math.random() < 0.3) { // 30% chance per click
      const foundMaterial = this.getRandomHerb();
      this.gameService().addMaterial(foundMaterial.id, 1);
      this.createGatheredResourceNotice(foundMaterial);
    }

    if (this.plantHealth() <= 0) {
      this.cooldownTimer.set(this.PLANT_COOLDOWN_SECONDS);
      // Bonus for finishing a plant
      const bonusMaterial = this.getRandomHerb(true); // a bit better chance for rare
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

  private getRandomHerb(isBonus: boolean = false): Material {
    const herbs = ALL_MATERIALS.filter(m => m.type === 'Herb');
    const rand = Math.random();
    
    // Weighted selection
    const weights = isBonus 
      ? { 'Common': 0.6, 'Rare': 0.35, 'Mythic': 0.05 } 
      : { 'Common': 0.8, 'Rare': 0.19, 'Mythic': 0.01 };

    let rarity: Rarity;
    if (rand < weights['Mythic']) {
      rarity = 'Mythic';
    } else if (rand < weights['Mythic'] + weights['Rare']) {
      rarity = 'Rare';
    } else {
      rarity = 'Common';
    }

    const possible = herbs.filter(m => m.rarity === rarity);
    if (possible.length > 0) {
      return possible[Math.floor(Math.random() * possible.length)];
    }
    // Fallback
    return herbs.find(m => m.rarity === 'Common')!;
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
