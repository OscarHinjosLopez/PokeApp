import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, map, of, switchMap } from 'rxjs';
import { take } from 'rxjs';
import { PokemonService } from '../../services/pokemon.service';
import { Pokemon } from '../../models/pokemon.model';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AbilityDetailsResponse } from '../../domain/book.types';

@Component({
  selector: 'pokemon-detail-component',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: `./pokemon-detail.component.html`,
  styleUrl: './pokemon-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailComponent {
  readonly pokemonId = input<number | null>(null);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pokemon = signal<Pokemon | null>(null);
  protected readonly abilityDescription = signal<string | null>(null);
  protected readonly i18n = inject(I18nService);

  protected readonly imageUrl = computed(() => {
    const currentPokemon = this.pokemon();

    if (!currentPokemon) {
      return null;
    }

    return (
      currentPokemon.sprites.other?.['official-artwork']?.front_default ??
      currentPokemon.sprites.front_default
    );
  });

  protected readonly displayName = computed(() => {
    const currentPokemon = this.pokemon();
    if (!currentPokemon) {
      return '';
    }

    return currentPokemon.name.charAt(0).toUpperCase() + currentPokemon.name.slice(1);
  });

  protected readonly translatedTypes = computed(() => {
    const currentPokemon = this.pokemon();
    if (!currentPokemon) {
      return [];
    }

    return currentPokemon.types
      .slice()
      .sort((left, right) => left.slot - right.slot)
      .map((pokemonType) => ({
        key: pokemonType.type.name,
        label: this.i18n.tPokemonType(pokemonType.type.name),
      }));
  });

  protected translateStat(statName: string): string {
    return this.i18n.tPokemonStat(statName);
  }

  private readonly pokemonService = inject(PokemonService);
  private readonly route = inject(ActivatedRoute);
  private readonly routePokemonId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')) || null)),
    { initialValue: null },
  );
  private readonly routeBookPokemonId = toSignal(
    this.route.queryParamMap.pipe(map((params) => Number(params.get('book')) || null)),
    { initialValue: null },
  );
  private readonly routeSearchQuery = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('q') ?? '')),
    { initialValue: '' },
  );
  private readonly routeBookSource = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('source') ?? 'national')),
    { initialValue: 'national' },
  );
  private readonly routeGeneration = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('generation') ?? '')),
    { initialValue: '' },
  );
  private readonly routeType = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('type') ?? '')),
    { initialValue: '' },
  );
  private readonly activePokemonId = computed(() => this.pokemonId() ?? this.routePokemonId() ?? 1);
  protected readonly backQueryParams = computed(() => {
    const bookPage = this.routeBookPokemonId() ?? this.activePokemonId();
    const query = this.routeSearchQuery().trim();
    const source = this.routeBookSource().trim() || 'national';
    const generation = this.routeGeneration().trim();
    const type = this.routeType().trim();

    const queryParams: Record<string, string | number> = {
      book: bookPage,
      source,
    };

    if (query) {
      queryParams['q'] = query;
    }

    if (source === 'generation' && generation) {
      queryParams['generation'] = generation;
    }

    if (source === 'type' && type) {
      queryParams['type'] = type;
    }

    return queryParams;
  });
  protected readonly libraryTabQuery = computed(() => {
    const source = this.routeBookSource().trim() || 'national';

    if (source === 'generation') {
      return { tab: 'generation' };
    }

    if (source === 'type') {
      return { tab: 'type' };
    }

    return { tab: 'national' };
  });
  protected readonly sectionBackLabel = computed(() => {
    const source = this.routeBookSource().trim() || 'national';

    if (source === 'generation') {
      return this.i18n.t('detail.sectionTitle.generation');
    }

    if (source === 'type') {
      return this.i18n.t('detail.sectionTitle.type');
    }

    return this.i18n.t('detail.sectionTitle.library');
  });

  constructor() {
    effect(() => {
      const id = this.activePokemonId();
      const language = this.i18n.language();

      this.loading.set(true);
      this.error.set(null);
      this.abilityDescription.set(null);

      this.pokemonService
        .getPokemon(id)
        .pipe(take(1))
        .pipe(
          switchMap((pokemon) => {
            this.pokemon.set(pokemon);

            const abilityUrl = pokemon.abilities[0]?.ability?.url;
            if (!abilityUrl) {
              return of(null);
            }

            return this.pokemonService.getDescriptionAbilities(abilityUrl).pipe(
              map((abilityDetails) => abilityDetails),
              catchError(() => of(null)),
            );
          }),
        )
        .subscribe({
          next: (abilityDetails: AbilityDetailsResponse | null) => {
            this.loading.set(false);

            if (!abilityDetails) {
              return;
            }

            const entries = abilityDetails.flavor_text_entries ?? [];
            const preferredLanguage = language === 'es' ? 'es' : language === 'fr' ? 'fr' : 'en';
            const preferredEntry =
              entries.find((entry) => entry.language?.name === preferredLanguage) ??
              entries.find((entry) => entry.language?.name === 'en') ??
              entries.find((entry) => entry.language?.name === 'es') ??
              entries[0];

            this.abilityDescription.set(
              preferredEntry?.flavor_text?.replace(/\s+/g, ' ').trim() ?? null,
            );
          },
          error: () => {
            this.error.set(this.i18n.t('detail.loadError'));
            this.loading.set(false);
          },
        });
    });
  }
}
