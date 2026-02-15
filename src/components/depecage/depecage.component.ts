import { Component, ChangeDetectionStrategy, output, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Material, ALL_MATERIALS } from '../../models/material.model';
import { Rarity } from '../../models/equipment.model';

interface ClickEffect { id: number; x: number; y: number; }
interface GatheredResource { id: number; name: string; rarity: Rarity; }

@Component({
  selector: 'app-depecage',
  standalone: true,
  templateUrl: './depecage.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class DepecageComponent implements OnInit, OnDestroy {
  viewChange = output<View>();
  gameService = input.required<GameService>();
  
  // Mini-game state
  readonly MAX_HIDE_HEALTH = 100;
  readonly HIDE_COOLDOWN_SECONDS = 6;

  hideHealth = signal(this.MAX_HIDE_HEALTH);
  cooldownTimer = signal(0);
  
  clickEffects = signal<ClickEffect[]>([]);
  gatheredResources = signal<GatheredResource[]>([]);
  isHideShaking = signal(false);

  private cooldownInterval: any;

  materials = computed(() => {
    const ownedMaterials = this.gameService().gameState().materials;
    return ALL_MATERIALS
      .filter(m => m.type === 'Leather')
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
          if (this.hideHealth() <= 0) {
            this.hideHealth.set(this.MAX_HIDE_HEALTH);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  onHideClick(event: MouseEvent) {
    if (this.hideHealth() <= 0 || this.cooldownTimer() > 0) return;

    this.hideHealth.update(h => Math.max(0, h - 20)); // 5 clicks
    this.createClickEffect(event);
    this.isHideShaking.set(true);
    setTimeout(() => this.isHideShaking.set(false), 300);

    // Chance to find material
    if (Math.random() < 0.3) { // 30% chance per click
      const foundMaterial = this.getRandomLeather();
      this.gameService().addMaterial(foundMaterial.id, 1);
      this.createGatheredResourceNotice(foundMaterial);
    }

    if (this.hideHealth() <= 0) {
      this.cooldownTimer.set(this.HIDE_COOLDOWN_SECONDS);
      // Bonus for finishing a hide
      const bonusMaterial = this.getRandomLeather(true); // a bit better chance for rare/epic
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

  private getRandomLeather(isBonus: boolean = false): Material {
    const leathers = ALL_MATERIALS.filter(m => m.type === 'Leather');
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

    const possible = leathers.filter(m => m.rarity === rarity);
    if (possible.length > 0) {
      return possible[Math.floor(Math.random() * possible.length)];
    }
    // Fallback
    return leathers.find(m => m.rarity === 'Common')!;
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
