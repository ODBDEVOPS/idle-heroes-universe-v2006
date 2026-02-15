import { Component, ChangeDetectionStrategy, input, signal, computed, WritableSignal, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Enemy } from '../../models/enemy.model';
import { Artifact } from '../../models/artifact.model';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { TowerChallenge, TowerSection } from '../../models/tower.model';
import { ALL_TOWER_SECTIONS } from '../../data/tower-data';

type FightResult = 'victory' | 'defeat' | null;
type TowerView = 'hub' | 'choice' | 'combat' | 'result';

@Component({
  selector: 'app-tower',
  templateUrl: './tower.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class TowerComponent implements OnDestroy {
  gameService = input.required<GameService>();

  towerView = signal<TowerView>('hub');
  
  isFighting = signal(false);
  fightTimer: WritableSignal<number> = signal(30);
  fightResult = signal<FightResult>(null);
  resultMessage = signal<{title: string, description: string} | null>(null);

  private fightInterval: any;

  constructor() {
    // When the game service reports being in tower combat (after a choice is made), switch view
    effect(() => {
        if(this.gameService().isInTowerCombat()) {
            this.towerView.set('combat');
        }
    });
  }

  currentSection = computed<TowerSection | undefined>(() => {
    const floor = this.gameService().gameState().towerFloor;
    return ALL_TOWER_SECTIONS.find(s => floor >= s.floorStart && floor <= s.floorEnd);
  });

  enemyHpPercentage = computed(() => {
    const enemy = this.gameService().towerEnemy();
    if (!enemy || enemy.maxHp === 0) return 0;
    return (enemy.currentHp / enemy.maxHp) * 100;
  });

  enterTower() {
    this.gameService().generateTowerChoices();
    this.towerView.set('choice');
  }

  selectChallenge(challenge: TowerChallenge) {
    const outcome = this.gameService().selectTowerChallenge(challenge);
    if(outcome.type === 'combat_start') {
      this.startFight();
    } else {
      this.resultMessage.set({title: outcome.title, description: outcome.description});
      this.towerView.set('result');
    }
  }
  
  proceedFromResult() {
    this.resultMessage.set(null);
    this.gameService().generateTowerChoices();
    this.towerView.set('choice');
  }

  startFight() {
    if (this.isFighting()) return;

    this.isFighting.set(true);
    this.fightResult.set(null);
    this.fightTimer.set(30);
    
    this.fightInterval = setInterval(() => {
      if (this.gameService().gameState().autoDpsEnabled) {
        this.gameService().applyTowerDamage(this.gameService().totalDps(), 'dps');
      }
      
      const currentEnemy = this.gameService().towerEnemy();
      if (currentEnemy && currentEnemy.currentHp <= 0) {
        this.endFight(true);
        return;
      }

      this.fightTimer.update(t => t - 1);
      if (this.fightTimer() <= 0) {
        this.endFight(false);
      }
    }, 1000);
  }
  
  onEnemyClick() {
    if (!this.isFighting()) return;
    this.gameService().applyTowerDamage(this.gameService().gameState().clickDamage, 'click');
  }

  private endFight(isVictory: boolean) {
    clearInterval(this.fightInterval);
    this.isFighting.set(false);
    this.fightResult.set(isVictory ? 'victory' : 'defeat');
    
    setTimeout(() => {
        this.fightResult.set(null);
        this.gameService().endTowerChallenge(isVictory);
        if(isVictory) {
          this.gameService().generateTowerChoices();
          this.towerView.set('choice');
        } else {
          this.towerView.set('hub');
        }
    }, 2500);
  }
  
  exitTower() {
    this.towerView.set('hub');
  }

  ngOnDestroy() {
    if (this.fightInterval) {
      clearInterval(this.fightInterval);
    }
    if(this.gameService().isInTowerCombat()) {
      this.gameService().endTowerChallenge(false); // Count as a loss
    }
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
}
