import { Component, ChangeDetectionStrategy, input, computed, signal, effect, OnDestroy, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { EnemyType } from '../../models/enemy.model';

interface Particle {
  id: number;
  left: string;
  top: string;
  size: string;
  backgroundColor: string;
  animationDelay: string;
  tx: string;
  ty: string;
}

interface FloatingGold {
  id: number;
  amount: number;
  x: number;
  y: number;
}

interface EnemyAbilityState {
  harden: boolean;
  weaken: boolean;
  frenzy: boolean;
  announce: 'Harden!' | 'Weaken!' | 'Frenzy!' | null;
}

@Component({
  selector: 'app-combat',
  templateUrl: './combat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class CombatComponent implements OnDestroy {
  gameService = input.required<GameService>();

  particles = signal<Particle[]>([]);
  floatingGold = signal<FloatingGold[]>([]); // NEW: For gold collection animation
  activatingSkillHeroId = signal<number | null>(null);
  healthBarHit = signal(false);
  dpsChanged = signal(false);
  enemyIsCharging = signal(false);
  enemyIsAttacking = signal(false);
  enemyAbilityState = signal<EnemyAbilityState>({ harden: false, weaken: false, frenzy: false, announce: null });
  
  private enemyAttackInterval: any;
  private abilityInterval: any;

  enemyHpPercentage = computed(() => {
    const enemy = this.gameService().currentEnemy();
    if (!enemy || enemy.maxHp === 0) return 0;
    return (enemy.currentHp / enemy.maxHp) * 100;
  });

  delayedEnemyHpPercentage = signal(100);
  private hpUpdateTimeout: any;

  constructor() {
    // Effect to create damage particles
    effect(() => {
        const flashes = this.gameService().damageFlashes();
        if(flashes.length > 0) {
            const lastFlash = flashes[flashes.length-1];
            switch(lastFlash.type) {
                case 'click':
                    this.createParticles(5, 'click');
                    break;
                case 'dps':
                     this.createParticles(2, 'dps');
                    break;
                case 'skill': // More distinct particles for skills
                     const rarity: Rarity = (this.gameService().heroes().find(h => h.id === this.gameService().lastSkillUsed()?.heroId)?.rarity) || 'Common';
                     this.createParticles(40, 'skill', rarity);
                    break;
            }
        }
    }, { allowSignalWrites: true });
    
    // NEW: Effect for gold particles
    effect(() => {
      const goldFlashes = this.gameService().goldFlashes();
      if (goldFlashes.length > 0) {
        // Only take the latest one for the animation
        const lastFlash = goldFlashes[goldFlashes.length - 1];
        this.createFloatingGold(lastFlash.amount, lastFlash.x, lastFlash.y);
      }
    });

    // Effect to handle the delayed health bar
    effect(() => {
        const currentPercentage = this.enemyHpPercentage();
        
        if (untracked(this.delayedEnemyHpPercentage) > currentPercentage) {
             if (this.hpUpdateTimeout) clearTimeout(this.hpUpdateTimeout);
             this.hpUpdateTimeout = setTimeout(() => {
                this.delayedEnemyHpPercentage.set(currentPercentage);
            }, 300);
        } else {
             if (this.hpUpdateTimeout) clearTimeout(this.hpUpdateTimeout);
             this.delayedEnemyHpPercentage.set(currentPercentage);
        }
    }, { allowSignalWrites: true });

     // Effect for health bar hit flash
    effect(() => {
        if (this.gameService().damageFlashes().length > 0) {
            if (!untracked(this.healthBarHit)) {
                this.healthBarHit.set(true);
                setTimeout(() => this.healthBarHit.set(false), 200);
            }
        }
    }, { allowSignalWrites: true });
    
    // Effect for DPS change pulse
    effect((onCleanup) => {
        const previousDps = untracked(() => this.gameService().totalDps());
        const currentDps = this.gameService().totalDps();

        if (currentDps !== previousDps && previousDps !== 0) {
            this.dpsChanged.set(true);
            const timeoutId = setTimeout(() => this.dpsChanged.set(false), 500);
            onCleanup(() => clearTimeout(timeoutId));
        }
    }, { allowSignalWrites: true });

    // Effect to reset abilities when a new enemy appears
    effect(() => {
      // This effect runs when the enemy changes.
      const enemy = this.gameService().currentEnemy();
      // We check for enemy & name to ensure we have a valid enemy and to re-trigger on new enemy.
      if (enemy?.name) {
        untracked(() => this.resetEnemyAbilitiesAndAttack());
      } else {
        // If there's no enemy, clear any existing intervals.
        if (this.abilityInterval) clearInterval(this.abilityInterval);
        if (this.enemyAttackInterval) clearInterval(this.enemyAttackInterval);
      }
    });
  }

  private resetEnemyAbilitiesAndAttack() {
    this.enemyAbilityState.set({ harden: false, weaken: false, frenzy: false, announce: null });
    this.enemyIsCharging.set(false);
    this.enemyIsAttacking.set(false);

    if (this.abilityInterval) clearInterval(this.abilityInterval);
    if (this.enemyAttackInterval) clearInterval(this.enemyAttackInterval);

    // Regular attack simulation
    this.enemyAttackInterval = setInterval(() => {
        if (this.isFighting()) { // Don't attack if a result screen is showing
            this.enemyIsCharging.set(true);
            setTimeout(() => {
                this.enemyIsCharging.set(false);
                this.enemyIsAttacking.set(true);
                setTimeout(() => this.enemyIsAttacking.set(false), 300);
            }, 1000);
        }
    }, 6000 + Math.random() * 2000);

    // Special ability simulation (only for bosses for now to make it feel special)
    if (this.gameService().currentEnemy()?.isBoss) {
      this.abilityInterval = setInterval(() => {
        if (this.isFighting()) {
            this.useRandomAbility();
        }
      }, 8000 + Math.random() * 4000); // Use ability every 8-12 seconds
    }
  }

  private useRandomAbility() {
    const currentState = this.enemyAbilityState();
    if (currentState.harden || currentState.weaken || currentState.frenzy) {
        return; // Don't use an ability if one is already active
    }

    const abilities = ['harden', 'weaken', 'frenzy'];
    const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];

    switch(randomAbility) {
        case 'harden':
            this.enemyAbilityState.set({ harden: true, weaken: false, frenzy: false, announce: 'Harden!' });
            setTimeout(() => this.resetAbilityState(), 4000); // Effect lasts 4 seconds
            break;
        case 'weaken':
            this.enemyAbilityState.set({ harden: false, weaken: true, frenzy: false, announce: 'Weaken!' });
            setTimeout(() => this.resetAbilityState(), 5000); // Effect lasts 5 seconds
            break;
        case 'frenzy':
            this.enemyAbilityState.set({ harden: false, weaken: false, frenzy: true, announce: 'Frenzy!' });
            setTimeout(() => this.enemyAbilityState.update(s => ({ ...s, announce: null })), 1500); // Announcement fades
            break;
    }

    // Announcement fades (might need separate timer if ability lasts longer)
    setTimeout(() => this.enemyAbilityState.update(s => ({ ...s, announce: null })), 1500);
  }

  private resetAbilityState() {
      this.enemyAbilityState.update(s => ({ ...s, harden: false, weaken: false, frenzy: false }));
  }

  private isFighting(): boolean {
    return this.gameService().currentEnemy()?.currentHp > 0;
  }

  private createParticles(count: number, type: 'click' | 'dps' | 'skill', rarity: Rarity = 'Common'): void {
    const newParticles: Particle[] = [];

    const rarityColors: Record<Rarity, string[]> = {
        'Common': ['#cbd5e1', '#e2e8f0'], // slate-300, 200
        'Rare': ['#60a5fa', '#3b82f6'],      // blue-400, 500
        'Epic': ['#a78bfa', '#8b5cf6'],      // violet-400, 500
        'Legendary': ['#facc15', '#eab308'], // yellow-400, 500
        'Mythic': ['#f87171', '#ef4444'],    // red-400, 500
    };

    const skillColors = ['#22d3ee', '#8b5cf6']; // cyan-400, violet-500
    
    for (let i = 0; i < count; i++) {
      const size = type === 'skill' ? Math.random() * 8 + 6 : Math.random() * 3 + 1; // Bigger for skills
      const angle = Math.random() * 2 * Math.PI;
      const distance = type === 'skill' ? Math.random() * 80 + 60 : Math.random() * 40 + 20; // Further for skills

      let color = '#ffffff';
      if (type === 'dps') color = '#f59e0b'; // amber-500
      if (type === 'skill') {
         color = skillColors[Math.floor(Math.random() * skillColors.length)];
      }

      newParticles.push({
        id: Math.random(),
        left: '50%',
        top: '50%',
        size: `${size}px`,
        backgroundColor: color,
        animationDelay: `${Math.random() * 0.2}s`,
        tx: `${Math.cos(angle) * distance}px`,
        ty: `${Math.sin(angle) * distance}px`,
      });
    }

    this.particles.update(p => [...p, ...newParticles]);
    setTimeout(() => {
        const particleIds = new Set(newParticles.map(p => p.id));
        this.particles.update(p => p.filter(particle => !particleIds.has(particle.id)));
    }, 1000);
  }
  
  private createFloatingGold(amount: number, x: number, y: number): void {
    const newGold: FloatingGold = {
      id: Date.now() + Math.random(),
      amount: amount,
      x: x,
      y: y,
    };
    this.floatingGold.update(g => [...g, newGold]);
    setTimeout(() => {
      this.floatingGold.update(g => g.filter(gold => gold.id !== newGold.id));
    }, 2000); // Matches CSS animation duration
  }


  ngOnDestroy() {
    if (this.enemyAttackInterval) clearInterval(this.enemyAttackInterval);
    if (this.abilityInterval) clearInterval(this.abilityInterval);
    if (this.hpUpdateTimeout) clearTimeout(this.hpUpdateTimeout);
  }

  onEnemyClick() {
    this.gameService().playerClick();
  }

  activateSkill(heroId: number) {
    this.gameService().activateHeroSkill(heroId);
    this.activatingSkillHeroId.set(heroId);
    setTimeout(() => this.activatingSkillHeroId.set(null), 300);
  }
  
  toggleAutoDps() {
    this.gameService().toggleAutoDps();
  }

  toggleAutoSkill() {
    this.gameService().toggleAutoSkill();
  }

  formatNumber(num: number): string {
    if (num < 1000) {
      return num.toFixed(0);
    }
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(1);
    return shortNum.replace(/\.0$/, '') + suffixes[i];
  }

  getRarityBorderClass(rarity: Rarity | undefined): string {
    const map: Record<Rarity, string> = { 'Mythic': 'border-red-500', 'Legendary': 'border-yellow-400', 'Epic': 'border-purple-500', 'Rare': 'border-blue-500', 'Common': 'border-gray-500' };
    return rarity ? map[rarity] : map['Common'];
  }
  
  getRarityBgClass(rarity: Rarity): string {
    switch (rarity) {
        case 'Mythic': return 'bg-gradient-to-br from-red-700 to-gray-800';
        case 'Legendary': return 'bg-gradient-to-br from-yellow-600 to-gray-800';
        case 'Epic': return 'bg-gradient-to-br from-purple-700 to-gray-800';
        case 'Rare': return 'bg-gradient-to-br from-blue-700 to-gray-800';
        default: return 'bg-gradient-to-br from-gray-600 to-gray-800';
    }
  }

  getSkillSlashClass(rarity: Rarity): string {
    const slashClasses: Record<Rarity, string> = {
        'Mythic': 'via-red-400/80',
        'Legendary': 'via-yellow-300/80',
        'Epic': 'via-purple-400/80',
        'Rare': 'via-blue-400/80',
        'Common': 'via-gray-300/80',
    };
    return slashClasses[rarity] || slashClasses['Common'];
  }

  getEnemyNameColor(type: EnemyType | undefined): string {
    if (!type) return 'text-gray-200';
    switch (type) {
      case 'Boss': return 'text-red-400';
      case 'Hoarder': return 'text-yellow-400';
      case 'Armored': return 'text-gray-400';
      case 'Swift': return 'text-cyan-400';
      case 'Caster': return 'text-purple-400';
      default: return 'text-gray-200';
    }
  }

  getEnemyTypeBadgeClass(type: EnemyType | undefined): string {
    if (!type) return 'border-gray-500/50 text-gray-400';
    switch (type) {
        case 'Hoarder': return 'border-yellow-400/50 text-yellow-300';
        case 'Armored': return 'border-gray-400/50 text-gray-300';
        case 'Swift': return 'border-cyan-400/50 text-cyan-300';
        case 'Caster': return 'border-purple-400/50 text-purple-300';
        case 'Squad': return 'border-orange-400/50 text-orange-300';
        default: return 'border-gray-500/50 text-gray-400';
    }
  }

  getEnemyTypeTooltip(type: EnemyType | undefined): string {
    if (!type) return 'A standard enemy.';
    switch (type) {
        case 'Hoarder': return 'Drops a large amount of gold but is very tough.';
        case 'Armored': return 'Has high damage reduction, taking less damage from all sources.';
        case 'Swift': return 'Low health and rewards, but is defeated very quickly.';
        case 'Caster': return 'A magical foe that may drop rare reagents.';
        case 'Squad': return 'A group of enemies with higher health and rewards.';
        case 'Minerals': return 'A sturdy foe that often drops ores and stones.';
        case 'Flora': return 'Aggressive plant life that may drop rare herbs.';
        case 'Fauna': return 'Wild beasts that are a source for leathers and hides.';
        case 'Aquatic': return 'Creatures of the water, may drop rare fish.';
        default: return 'A standard enemy.';
    }
  }
  
  getRarityTextColor(rarity: Rarity): string {
    switch(rarity){
      case 'Mythic': return 'text-red-500';
      case 'Legendary': return 'text-yellow-400';
      case 'Epic': return 'text-purple-500';
      case 'Rare': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }
}