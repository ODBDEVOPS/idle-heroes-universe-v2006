import { Component, ChangeDetectionStrategy, output, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Material, ALL_MATERIALS } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';

interface ClickEffect { id: number; x: number; y: number; }
interface MinedResource { id: number; name: string; rarity: Rarity; }

@Component({
  selector: 'app-minage',
  standalone: true,
  templateUrl: './minage.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class MinageComponent implements OnInit, OnDestroy {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  // Mini-game state
  readonly MAX_ROCK_HEALTH = 100;
  readonly ROCK_COOLDOWN_SECONDS = 5;

  rockHealth = signal(this.MAX_ROCK_HEALTH);
  cooldownTimer = signal(0);
  
  clickEffects = signal<ClickEffect[]>([]);
  minedResources = signal<MinedResource[]>([]);
  isRockShaking = signal(false);

  private cooldownInterval: any;

  materials = computed(() => {
    const ownedMaterials = this.gameService().gameState().materials;
    return ALL_MATERIALS
      .filter(m => m.type === 'Ore' || m.type === 'Stone')
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
          if (this.rockHealth() <= 0) {
            this.rockHealth.set(this.MAX_ROCK_HEALTH);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  onRockClick(event: MouseEvent) {
    if (this.rockHealth() <= 0 || this.cooldownTimer() > 0) return;

    this.rockHealth.update(h => Math.max(0, h - 10));
    this.createClickEffect(event);
    this.isRockShaking.set(true);
    setTimeout(() => this.isRockShaking.set(false), 300);

    // Chance to find ore
    if (Math.random() < 0.25) { // 25% chance per click
      const foundMaterial = this.getRandomOre();
      this.gameService().addMaterial(foundMaterial.id, 1);
      this.createMinedResourceNotice(foundMaterial);
    }

    if (this.rockHealth() <= 0) {
      this.cooldownTimer.set(this.ROCK_COOLDOWN_SECONDS);
      // Bonus for finishing a rock
      const bonusMaterial = this.getRandomOre(true); // a bit better chance for rare
      this.gameService().addMaterial(bonusMaterial.id, 1);
      this.createMinedResourceNotice(bonusMaterial);
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

  private createMinedResourceNotice(material: Material) {
    const newResource: MinedResource = { id: Date.now() + Math.random(), name: `+1 ${material.name}`, rarity: material.rarity };
    this.minedResources.update(resources => [...resources, newResource]);
    setTimeout(() => this.minedResources.update(resources => resources.filter(r => r.id !== newResource.id)), 1200);
  }

  private getRandomOre(isBonus: boolean = false): Material {
    const oresAndStones = ALL_MATERIALS.filter(m => m.type === 'Ore' || m.type === 'Stone');
    const rand = Math.random();
    
    // Weighted selection
    const weights = isBonus 
      ? { 'Common': 0.5, 'Rare': 0.4, 'Epic': 0.1 } 
      : { 'Common': 0.7, 'Rare': 0.25, 'Epic': 0.05 };

    let rarity: Rarity;
    if (rand < weights['Epic']) {
      rarity = 'Epic';
    } else if (rand < weights['Epic'] + weights['Rare']) {
      rarity = 'Rare';
    } else {
      rarity = 'Common';
    }

    const possible = oresAndStones.filter(m => m.rarity === rarity);
    if (possible.length > 0) {
      return possible[Math.floor(Math.random() * possible.length)];
    }
    // Fallback to any common material if no specific rarity is found
    return oresAndStones.find(m => m.rarity === 'Common')!;
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
