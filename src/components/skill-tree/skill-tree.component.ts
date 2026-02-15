import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { SkillTreeNode } from '../../models/skill-tree.model';
import { SKILL_TREE_DATA } from '../../data/skill-tree-data';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-skill-tree',
  standalone: true,
  templateUrl: './skill-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class SkillTreeComponent {
  gameService = input.required<GameService>();

  skillTreeData = SKILL_TREE_DATA;
  isPrestigeConfirmOpen = signal(false);
  
  unlockedNodeIds = computed(() => new Set(this.gameService().gameState().unlockedSkillTreeNodes));

  connections = computed(() => {
    const lines: { x1: number, y1: number, x2: number, y2: number, unlocked: boolean, branch: string }[] = [];
    const unlocked = this.unlockedNodeIds();

    for (const node of this.skillTreeData) {
      for (const prereqId of node.prerequisites) {
        const prereqNode = this.skillTreeData.find(n => n.id === prereqId);
        if (prereqNode) {
          lines.push({
            x1: prereqNode.position.x,
            y1: prereqNode.position.y,
            x2: node.position.x,
            y2: node.position.y,
            unlocked: unlocked.has(node.id) && unlocked.has(prereqId),
            branch: node.branch,
          });
        }
      }
    }
    return lines;
  });

  canUnlock(node: SkillTreeNode): boolean {
    const unlocked = this.unlockedNodeIds();
    if (unlocked.has(node.id)) return false;
    if (this.gameService().gameState().prestigePoints < node.cost) return false;
    return node.prerequisites.every(prereq => unlocked.has(prereq));
  }
  
  unlockNode(node: SkillTreeNode) {
    if(this.canUnlock(node)) {
      this.gameService().unlockSkillTreeNode(node.id);
    }
  }

  prestige() {
    this.gameService().prestige();
    this.isPrestigeConfirmOpen.set(false);
  }

  cancelPrestige() {
    this.isPrestigeConfirmOpen.set(false);
  }

  getNodeClasses(node: SkillTreeNode): string {
    const unlocked = this.unlockedNodeIds();
    const isUnlocked = unlocked.has(node.id);
    const isUnlockable = this.canUnlock(node);

    let classes = 'absolute w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300 transform ';
    classes += node.isKeystone ? 'w-14 h-14 text-2xl ' : 'w-10 h-10 text-xl ';

    if(isUnlocked) {
        classes += ' shadow-lg ';
        switch(node.branch) {
            case 'Conqueror': classes += 'bg-red-500 border-2 border-red-300 shadow-red-500/50'; break;
            case 'Hoarder': classes += 'bg-yellow-500 border-2 border-yellow-300 shadow-yellow-500/50'; break;
            case 'Zealot': classes += 'bg-blue-500 border-2 border-blue-300 shadow-blue-500/50'; break;
            default: classes += 'bg-gray-400 border-2 border-gray-200'; break;
        }
    } else if (isUnlockable) {
        classes += 'cursor-pointer hover:scale-110 ';
         switch(node.branch) {
            case 'Conqueror': classes += 'bg-gray-700 border-2 border-red-500/50'; break;
            case 'Hoarder': classes += 'bg-gray-700 border-2 border-yellow-500/50'; break;
            case 'Zealot': classes += 'bg-gray-700 border-2 border-blue-500/50'; break;
            default: classes += 'bg-gray-700 border-2 border-gray-500/50'; break;
        }
    } else {
        classes += 'bg-black/50 border-2 border-gray-700 opacity-60';
    }

    return classes;
  }
  
  getTooltipText(node: SkillTreeNode): string {
    const unlocked = this.unlockedNodeIds();
    const isUnlocked = unlocked.has(node.id);

    let tooltip = `<strong>${node.name}</strong><br>${node.description}`;
    if (!isUnlocked) {
        tooltip += `<br><br><em>Cost: ${node.cost} 💎</em>`;
    }
    return tooltip;
  }
  
  formatNumber(num: number): string {
    if (num < 1000) return num.toString();
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(2);
    return shortNum.replace(/\.0$/, '') + suffixes[i];
  }
}
