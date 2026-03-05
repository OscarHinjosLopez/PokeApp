import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { catchError, map, of, switchMap, take } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { NamedApiResource } from '../models/pokemon.model';
import { PokemonService } from '../services/pokemon.service';
import {
  BookKind,
  GenerationDetailResponse,
  PokemonBookPage,
  PokemonListResponse,
  TypeDetailResponse,
} from '../domain/book.types';
import { toPrettyLabel } from '../domain/book-format.util';

@Injectable({ providedIn: 'root' })
export class BookFacade {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pages = signal<PokemonBookPage[]>([]);

  readonly selectedBookKind = signal<BookKind>('national');
  readonly selectedGeneration = signal('generation-i');
  readonly selectedType = signal('normal');

  readonly bookTitle = computed(() => {
    const currentKind = this.selectedBookKind();

    if (currentKind === 'generation') {
      return this.i18n.t('reader.generationTitle', {
        name: toPrettyLabel(this.selectedGeneration()),
      });
    }

    if (currentKind === 'type') {
      return this.i18n.t('reader.typeTitle', {
        name: toPrettyLabel(this.selectedType()),
      });
    }

    return this.i18n.t('reader.nationalTitle');
  });

  readonly bookDescription = computed(() => {
    const currentKind = this.selectedBookKind();

    if (currentKind === 'generation') {
      return this.i18n.t('reader.generationDescription');
    }

    if (currentKind === 'type') {
      return this.i18n.t('reader.typeDescription');
    }

    return this.i18n.t('reader.nationalDescription');
  });

  private readonly pagesCache = new Map<string, PokemonBookPage[]>();
  private readonly pokemonService = inject(PokemonService);
  private readonly i18n = inject(I18nService);

  constructor() {
    effect(() => {
      this.i18n.language();
      this.pagesCache.clear();
    });
  }

  initializeFromQuery(query: {
    source?: string | null;
    generation?: string | null;
    type?: string | null;
  }): void {
    const source = (query.source as BookKind | null) ?? 'national';
    this.selectedBookKind.set(source);

    if (query.generation) {
      this.selectedGeneration.set(query.generation);
    }

    if (query.type) {
      this.selectedType.set(query.type);
    }
  }

  loadBookPages(): void {
    const cacheKey = this.getCacheKey();
    const cachedPages = this.pagesCache.get(cacheKey);

    if (cachedPages) {
      this.pages.set(cachedPages);
      this.loading.set(false);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.getBookPagesByKind()
      .pipe(
        take(1),
        catchError(() => {
          this.error.set(this.resolveErrorMessage());
          this.loading.set(false);
          return of([] as PokemonBookPage[]);
        }),
      )
      .subscribe((pages) => {
        if (!pages.length && this.error()) {
          this.pages.set([]);
          return;
        }

        this.pagesCache.set(cacheKey, pages);
        this.pages.set(pages);
        this.loading.set(false);
      });
  }

  private getBookPagesByKind() {
    const currentKind = this.selectedBookKind();

    if (currentKind === 'generation') {
      return this.loadGenerationBook(this.selectedGeneration());
    }

    if (currentKind === 'type') {
      return this.loadTypeBook(this.selectedType());
    }

    return this.loadNationalBook();
  }

  private loadNationalBook() {
    return this.pokemonService.getPokemonList(1, 0).pipe(
      switchMap((summaryResponse: PokemonListResponse) => {
        const totalPokemon = summaryResponse.count ?? 0;

        if (totalPokemon <= 0) {
          return of([] as PokemonBookPage[]);
        }

        return this.pokemonService
          .getPokemonList(totalPokemon, 0)
          .pipe(
            map((response: PokemonListResponse) =>
              this.mapNamedResourcesToPages(response.results ?? []),
            ),
          );
      }),
    );
  }

  private loadGenerationBook(generationName: string) {
    return this.pokemonService
      .getGeneration(generationName)
      .pipe(
        map((response: GenerationDetailResponse) =>
          this.mapNamedResourcesToPages(response.pokemon_species ?? [], '/pokemon-species/'),
        ),
      );
  }

  private loadTypeBook(typeName: string) {
    return this.pokemonService
      .getType(typeName)
      .pipe(
        map((response: TypeDetailResponse) =>
          this.mapNamedResourcesToPages((response.pokemon ?? []).map((entry) => entry.pokemon)),
        ),
      );
  }

  private mapNamedResourcesToPages(
    resources: NamedApiResource[],
    idPathMarker = '/pokemon/',
  ): PokemonBookPage[] {
    const resultPages: PokemonBookPage[] = [];

    for (const item of resources) {
      const id = this.extractPokemonId(item.url, idPathMarker);
      if (!id) {
        continue;
      }

      resultPages.push({
        id,
        name: item.name,
        imageUrl: this.getOfficialArtworkUrl(id),
        description: this.i18n.t('reader.entryDescription', { id }),
      });
    }

    resultPages.sort((left, right) => left.id - right.id);
    return resultPages;
  }

  private extractPokemonId(url: string, marker = '/pokemon/'): number | null {
    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedMarker}(\\d+)\\/?$`);
    const match = url.match(regex);
    return match ? Number(match[1]) : null;
  }

  private getOfficialArtworkUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  private getCacheKey(): string {
    const kind = this.selectedBookKind();

    if (kind === 'generation') {
      return `generation:${this.selectedGeneration()}`;
    }

    if (kind === 'type') {
      return `type:${this.selectedType()}`;
    }

    return 'national';
  }

  private resolveErrorMessage(): string {
    const kind = this.selectedBookKind();

    if (kind === 'generation') {
      return this.i18n.t('reader.errors.generation');
    }

    if (kind === 'type') {
      return this.i18n.t('reader.errors.type');
    }

    return this.i18n.t('reader.errors.pages');
  }
}
