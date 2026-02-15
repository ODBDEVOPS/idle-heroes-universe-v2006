import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, SYNERGY_BONUSES } from '../../services/game.service';
import { Role } from '../../models/hero.model';

@Component({
  selector: 'app-synergies',
  standalone: true,
  templateUrl: './synergies.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class SynergiesComponent {
  gameService = input.required<GameService>();

  allSynergies = computed(() => {
    return Object.entries(SYNERGY_BONUSES).map(([role, bonuses]) => ({
      role: role as Role,
      bonuses: bonuses!,
    }));
  });

  activeHeroesByRole = computed(() => {
    const counts: Partial<Record<Role, number>> = {};
    for (const hero of this.gameService().activeHeroes()) {
      counts[hero.role] = (counts[hero.role] || 0) + 1;
    }
    return counts;
  });

  roleIcons: Record<Role, string> = {
    'Tank': 'M12,2 L12,11 L4,11 L4,15 L12,15 L12,22 L14,22 L14,15 L20,15 L20,11 L14,11 L14,2 L12,2 Z M4,6 L20,6 L20,9 L4,9 L4,6 Z',
    'DPS': 'M18.2,1.3l-5.6,5.6l1.4,1.4l5.6-5.6L18.2,1.3z M3,14.1l2.8-2.8l4.2,4.2l-2.8,2.8L3,14.1z M8.6,8.6 L3.4,13.8l1.4,1.4l5.2-5.2L8.6,8.6z M12.8,4.4l-7,7l1.4,1.4l7-7L12.8,4.4z M17,8.6l-7,7l1.4,1.4l7-7 L17,8.6z',
    'Support': 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    'Assassin': 'M14.5,3 l-1.5-1 h-2 L9.5,3 L8,4.5 V6 h8 V4.5 L14.5,3 z M16,7 H8 L9,16 l3,6 l3-6 l1-9 z',
    'Controller': 'M6,2v6h12V2H6z M8,4h8v2H8V4z M6,22v-6h12v6H6z M8,20h8v-2H8V20z M12,10 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,10,12,10z',
    'Bruiser': 'M20.5,10L23,12.5L20.5,15H17v3h-3v-3h-4v3H7v-3H3.5L1,12.5L3.5,10H7V7h3v3h4V7h3V10H20.5z',
    'Marksman': 'M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8 s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z M12,6c-3.31,0-6,2.69-6,6s2.69,6,6,6s6-2.69,6-6S15.31,6,12,6z M12,16 c-2.21,0-4-1.79-4-4s1.79-4,4-4s4,1.79,4,4S14.21,16,12,16z',
    'Mage': 'M12,3L9.11,8.33L3,9.5l4.5,4.36L6.22,20L12,17.27L17.78,20L16.5,13.86L21,9.5l-6.11-1.17L12,3z',
    'Healer': 'M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7v-2h4V7h2v4h4v2h-4v4h-2z',
    'Démoniste': 'M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10s10-4.47,10-10S17.53,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z M15.5,11h-7v2h7V11z M9.5,8 C8.67,8,8,7.33,8,6.5S8.67,5,9.5,5s1.5,0.67,1.5,1.5S10.33,8,9.5,8z M14.5,8c-0.83,0-1.5-0.67-1.5-1.5S13.67,5,14.5,5 s1.5,0.67,1.5,1.5S15.33,8,14.5,8z',
    'Shaman': 'M12,2c-1.95,0-3.8,0.73-5.25,2.04L12,9.3V2z M12,14.7l-5.25,5.25C8.2,21.27,10.05,22,12,22c1.95,0,3.8-0.73,5.25-2.04 L12,14.7z M20,12c0,1.95-0.73,3.8-2.04,5.25L12,12l5.96-5.25C19.27,8.2,20,10.05,20,12z M4,12c0-1.95,0.73-3.8,2.04-5.25L12,12 L6.04,17.25C4.73,15.8,4,13.95,4,12z',
    'Mangas Hero': 'M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,13.5c-0.83,0-1.5-0.67-1.5-1.5 s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S12.83,13.5,12,13.5z M16,9H8V7h8V9z M16,17H8v-2h8V17z',
    'Video game Hero': 'M9,4H7V2h2V4z M13,4h-2V2h2V4z M17,4h-2V2h2V4z M21,8V6h-2V4h-2V6h-2v2h2v2h2V8h2V6h2v2H21z M19,10h-2V8h2V10z M15,10h-2V8h2V10z M11,10H9V8h2V10z M7,10H5V8h2V10z M3,8V6H1v2H3z M19,22v-2h-2v-2h-2v2h-2v2h2v2h2v-2h2v2h2v-2H19z M15,18h-2v2h2V18z M11,18H9v2h2V18z M7,18H5v2h2V18z M3,20v-2H1v2H3z'
  };
}