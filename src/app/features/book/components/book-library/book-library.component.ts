import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PokemonService } from '../../services/pokemon.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NamedApiResource } from '../../models/pokemon.model';
import { toPrettyLabel } from '../../domain/book-format.util';
import { GenerationListResponse, TypeListResponse } from '../../domain/book.types';

@Component({
  selector: 'book-library-component',
  imports: [MatTabsModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './book-library.component.html',
  styleUrl: './book-library.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookLibraryComponent implements OnInit {
  protected readonly selectedTabIndex = signal(0);
  protected readonly generationOptions = signal<NamedApiResource[]>([]);
  protected readonly typeOptions = signal<NamedApiResource[]>([]);
  protected readonly i18n = inject(I18nService);

  private readonly pokemonService = inject(PokemonService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') ?? 'national';
    this.selectedTabIndex.set(this.resolveTabIndex(tab));

    this.pokemonService.getGenerationList().subscribe((response: GenerationListResponse) => {
      this.generationOptions.set(response.results ?? []);
    });

    this.pokemonService.getTypeList().subscribe((response: TypeListResponse) => {
      const supportedTypes = (response.results ?? []).filter(
        (typeItem) => typeItem.name !== 'shadow' && typeItem.name !== 'unknown',
      );
      this.typeOptions.set(supportedTypes);
    });
  }

  protected openNationalBook(): void {
    this.router.navigate(['/libro'], { queryParams: { source: 'national' } });
  }

  protected onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  protected openGenerationBook(generationName: string): void {
    this.router.navigate(['/libro'], {
      queryParams: { source: 'generation', generation: generationName },
    });
  }

  protected openTypeBook(typeName: string): void {
    this.router.navigate(['/libro'], {
      queryParams: { source: 'type', type: typeName },
    });
  }

  protected prettyLabel(value: string): string {
    return toPrettyLabel(value);
  }

  protected typeIcon(typeName: string): string {
    const iconsByType: Record<string, string> = {
      normal: 'adjust',
      fire: 'local_fire_department',
      water: 'water_drop',
      electric: 'bolt',
      grass: 'eco',
      ice: 'ac_unit',
      fighting: 'sports_mma',
      poison: 'science',
      ground: 'terrain',
      flying: 'air',
      psychic: 'psychology',
      bug: 'pest_control',
      rock: 'landscape',
      ghost: 'nights_stay',
      dragon: 'pets',
      dark: 'dark_mode',
      steel: 'shield',
      fairy: 'auto_awesome',
      stellar: 'star',
    };

    return iconsByType[typeName] ?? 'category';
  }

  private resolveTabIndex(tab: string): number {
    if (tab === 'generation') {
      return 1;
    }

    if (tab === 'type') {
      return 2;
    }

    return 0;
  }
}
