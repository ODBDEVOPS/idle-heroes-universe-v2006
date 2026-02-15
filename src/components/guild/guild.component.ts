import { Component, ChangeDetectionStrategy, output, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { GuildMember } from '../../models/game-state.model';

// Mock data since there's no backend
const BROWSE_GUILDS_MOCK = [
  { id: 'guild_1', name: 'The Silver Blades', level: 15, members: 28, maxMembers: 30 },
  { id: 'guild_2', name: 'Dragon Slayers', level: 25, members: 30, maxMembers: 30 },
  { id: 'guild_3', name: 'The Void Walkers', level: 12, members: 15, maxMembers: 25 },
];

@Component({
  selector: 'app-guild',
  standalone: true,
  templateUrl: './guild.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TooltipDirective],
})
export class GuildComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  activeTab = signal<'home' | 'members' | 'upgrades' | 'events'>('home');
  
  // Create Guild Form
  createGuildName = signal('');
  
  // Donate Form
  donationAmount = signal<number | null>(null);

  // Mock data for display
  browseableGuilds = BROWSE_GUILDS_MOCK;
  readonly GUILD_CREATE_COST = 1_000_000;

  mockGuildLog = signal([
    { type: 'join', message: 'Welcome to the guild!', player: 'system' },
    { type: 'donation', message: 'donated 10,000 Gold.', player: 'ShadowSlayer' },
    { type: 'achievement', message: 'reached Stage 300!', player: 'RiftWalker' },
    { type: 'donation', message: 'donated 25,000 Gold.', player: 'You' },
    { type: 'system', message: 'Guild Level Up! Your guild is now Level 12.' },
  ]);

  isInGuild = computed(() => !!this.gameService().gameState().guild);
  guild = computed(() => this.gameService().gameState().guild);

  expToNextLevel = computed(() => {
    const level = this.guild()?.level ?? 1;
    return this.gameService().getGuildExpToNextLevel(level);
  });
  
  guildBonuses = computed(() => {
    const level = this.guild()?.level ?? 0;
    if (level === 0) return null;
    return this.gameService().getGuildBonuses(level);
  });
  
  allGuildBonuses = computed(() => {
    const levels = Array.from({ length: 30 }, (_, i) => i + 1); // Show bonuses up to level 30
    return levels.map(level => ({
      level,
      bonuses: this.gameService().getGuildBonuses(level)
    }));
  });

  handleCreateGuild() {
    const name = this.createGuildName().trim();
    if (name && this.gameService().gameState().gold >= this.GUILD_CREATE_COST) {
      this.gameService().createGuild(name);
    }
  }

  handleJoinGuild(id: string, name: string) {
    this.gameService().joinGuild(id, name); // Mocked join
  }

  handleLeaveGuild() {
    this.gameService().leaveGuild();
  }
  
  handleDonate() {
    const amount = this.donationAmount();
    if (amount !== null && amount > 0) {
      this.gameService().donateToGuild(amount);
      this.donationAmount.set(null);
    }
  }

  setDonationAmount(percentage: number) {
    const gold = this.gameService().gameState().gold;
    this.donationAmount.set(Math.floor(gold * percentage));
  }

  getBonusText(bonus: { dpsPercent: number; goldDropPercent: number }): string[] {
    const texts: string[] = [];
    if (bonus.dpsPercent > 0) {
      texts.push(`+${(bonus.dpsPercent * 100).toFixed(1)}% All DPS`);
    }
    if (bonus.goldDropPercent > 0) {
      texts.push(`+${(bonus.goldDropPercent * 100).toFixed(1)}% Gold Find`);
    }
    return texts;
  }
  
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
}
