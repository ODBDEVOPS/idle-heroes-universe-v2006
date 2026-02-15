import { Component, ChangeDetectionStrategy, signal, computed, effect, ElementRef, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CombatComponent } from './components/combat/combat.component';
import { TeamComponent } from './components/team/team.component';
import { GameService } from './services/game.service';
import { QuestsComponent } from './components/quests/quests.component';
import { ForgeComponent } from './components/forge/forge.component';
import { SummonComponent } from './components/summon/summon.component';
import { TowerComponent } from './components/tower/tower.component';
import { ArtifactsComponent } from './components/artifacts/artifacts.component';
import { CodexComponent } from './components/codex/codex.component';
import { SettingsComponent } from './components/settings/settings.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { ExpeditionsComponent } from './components/expeditions/expeditions.component';
import { CelestialShrineComponent } from './components/celestial-shrine/celestial-shrine.component';
import { SynergiesComponent } from './components/synergies/synergies.component';
import { AlchemyLabComponent } from './components/alchemy-lab/alchemy-lab.component';
import { HeroUnlockComponent } from './components/hero-unlock/hero-unlock.component';
import { TooltipDirective } from './directives/tooltip.directive';
import { BaseComponent } from './components/base/base.component';
import { TeamHubComponent } from './components/team-hub/team-hub.component';
import { FusionComponent } from './components/fusion/fusion.component';
import { HeroDetailComponent } from './components/hero-detail/hero-detail.component';
import { ReliquesComponent } from './components/reliques/reliques.component';
import { DungeonsComponent } from './components/dungeons/dungeons.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { PetsComponent } from './components/pets/pets.component';
import { HeroCommandComponent } from './components/hero-command/hero-command.component';
import { EnchantComponent } from './components/enchant/enchant.component';
import { ChronicleComponent } from './components/chronicle/chronicle.component';
import { SkillTrainingComponent } from './components/skill-training/skill-training.component';
import { SkillTreeComponent } from './components/skill-tree/skill-tree.component';
import { HeroFarmComponent } from './components/hero-farm/hero-farm.component';
import { IngenierieComponent } from './components/ingenierie/ingenierie.component';
import { AlchimieComponent } from './components/alchimie/alchimie.component';
import { CoutureComponent } from './components/couture/couture.component';
import { TravailDuCuirComponent } from './components/travail-du-cuir/travail-du-cuir.component';
import { CuisineComponent } from './components/cuisine/cuisine.component';
import { PecheComponent } from './components/peche/peche.component';
import { DepecageComponent } from './components/depecage/depecage.component';
import { HerboristerieComponent } from './components/herboristerie/herboristerie.component';
import { MinageComponent } from './components/minage/minage.component';
import { HeroSpecializationComponent } from './components/hero-specialization/hero-specialization.component';
import { ProfessionsComponent } from './components/professions/professions.component';
import { SoulAlchemyComponent } from './components/soul-alchemy/soul-alchemy.component';
import { NecroArtisanatComponent } from './components/necro-artisanat/necro-artisanat.component';
import { MissionsComponent } from './components/missions/missions.component';
import { BijoutierComponent } from './components/bijoutier/bijoutier.component';
import { BrewmasterComponent } from './components/brewmaster/brewmaster.component';
import { ArtisanArmesComponent } from './components/artisan-armes/artisan-armes.component';
import { ArtisanArmuresComponent } from './components/artisan-armures/artisan-armures.component';
import { CalligrapheComponent } from './components/calligraphe/calligraphe.component';
import { SculpteurComponent } from './components/sculpteur/sculpteur.component';
import { ArchitecteComponent } from './components/architecte/architecte.component';
import { CartographeComponent } from './components/cartographe/cartographe.component';
import { BucheronComponent } from './components/bucheron/bucheron.component';
import { DimensionalRiftComponent } from './components/dimensional-rift/dimensional-rift.component';
import { GuildComponent } from './components/guild/guild.component';
import { AuctionHouseComponent } from './components/auction-house/auction-house.component';
import { UpgradesComponent } from './components/upgrades/upgrades.component';
import { HeadquartersComponent } from './components/headquarters/headquarters.component';
import { InventoryHubComponent } from './components/inventory-hub/inventory-hub.component';
import { ShopComponent } from './components/shop/shop.component';

export type View = 'combat' | 'settings' | 
             'heroes_progression' | 'team' | 'summon' | 'codex' | 'synergies' | 'teamHub' | 'fusion' | 'heroDetail' | 'pets' | 'heroCommand' | 'chronicle' | 'skillTraining' | 'heroFarm' | 'heroSpecialization' | 'skillTree' | 
             'inventory_crafting' | 'inventory' | 'forge' | 'alchemyLab' | 'enchant' | 'professions' | 'ingenierie' | 'alchimie' | 'couture' | 'travailDuCuir' | 'cuisine' | 'peche' | 'depecage' | 'herboristerie' | 'minage' | 'soulAlchemy' | 'necroArtisanat' | 'bijoutier' | 'brewmaster' | 'artisanArmes' | 'artisanArmures' | 'calligraphe' | 'sculpteur' | 'architecte' | 'cartographe' | 'bucheron' | 'inventoryHub' |
             'exploration_quests' | 'quests' | 'tower' | 'expeditions' | 'celestialShrine' | 'reliques' | 'dungeons' | 'missions' | 'dimensionalRift' |
             'economy_social' | 'leaderboard' | 'guild' | 'auctionHouse' | 'shop' | 'upgrades' | 'headquarters' |
             'system_settings' | 'artifacts' | 'heroUnlock' | 'base'; // 'base' and 'heroUnlock' typically navigated to, not from main menu.

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CombatComponent, TeamComponent, QuestsComponent, ForgeComponent, SummonComponent, TowerComponent, ArtifactsComponent, CodexComponent, SettingsComponent, InventoryComponent, ExpeditionsComponent, CelestialShrineComponent, SynergiesComponent, AlchemyLabComponent, HeroUnlockComponent, TooltipDirective, BaseComponent, TeamHubComponent, FusionComponent, HeroDetailComponent, ReliquesComponent, DungeonsComponent, LeaderboardComponent, PetsComponent, HeroCommandComponent, EnchantComponent, ChronicleComponent, SkillTrainingComponent, SkillTreeComponent, HeroFarmComponent, IngenierieComponent, AlchimieComponent, CoutureComponent, TravailDuCuirComponent, CuisineComponent, PecheComponent, DepecageComponent, HerboristerieComponent, MinageComponent, HeroSpecializationComponent, ProfessionsComponent, SoulAlchemyComponent, NecroArtisanatComponent, MissionsComponent, BijoutierComponent, BrewmasterComponent, ArtisanArmesComponent, ArtisanArmuresComponent, CalligrapheComponent, SculpteurComponent, ArchitecteComponent, CartographeComponent, BucheronComponent, DimensionalRiftComponent, GuildComponent, AuctionHouseComponent, UpgradesComponent, HeadquartersComponent, InventoryHubComponent, ShopComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(window:beforeunload)': 'saveGameOnExit($event)',
  }
})
export class AppComponent {
  activeView = signal<View>('combat');
  heroToUnlockId = signal<number | null>(null);
  gameService = inject(GameService);
  
  showOfflineReport = signal(false);
  showDailyLogin = signal(false);
  
  openDropdown = signal<string | null>(null);
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  dailyReward = computed(() => {
    const day = this.gameService.gameState().consecutiveLoginDays;
    return this.gameService.getDailyRewardForDay(day);
  });
  
  constructor() {
    this.gameService.startGameLoop();

    effect(() => {
      const theme = this.gameService.gameState().theme;
      if (theme === 'dark') {
        this.renderer.addClass(document.body, 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark');
      }
    });
    
    setTimeout(() => {
        if (this.gameService.offlineReport()) {
            this.showOfflineReport.set(true);
        } else if (this.gameService.isDailyRewardAvailable()) {
            this.showDailyLogin.set(true);
        }
    }, 500);
  }

  toggleDropdown(dropdown: string) {
    this.openDropdown.update(current => (current === dropdown ? null : dropdown));
  }
  
  onDocumentClick(event: MouseEvent) {
    const navContainer = this.elementRef.nativeElement.querySelector('.nav-container');
    if (navContainer && !navContainer.contains(event.target as Node)) {
      this.openDropdown.set(null);
    }
  }

  changeView(view: View) {
    this.activeView.set(view);
    this.openDropdown.set(null);
  }

  handleNewHeroUnlock(heroId: number) {
    this.heroToUnlockId.set(heroId);
    this.changeView('heroUnlock');
  }

  saveGameOnExit(event: any) {
    this.gameService.saveGame();
  }
  
  claimOfflineReport() {
    this.gameService.clearOfflineReport();
    this.showOfflineReport.set(false);
    if (this.gameService.isDailyRewardAvailable()) {
        this.showDailyLogin.set(true);
    }
  }

  claimDailyReward() {
      this.gameService.claimDailyReward();
      this.showDailyLogin.set(false);
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