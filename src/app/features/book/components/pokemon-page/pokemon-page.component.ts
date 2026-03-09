import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BookFacade } from '../../application/book.facade';
import { normalizeSearchText } from '../../domain/book-format.util';

type PageFlipCtor = new (
  element: HTMLElement,
  settings: Record<string, unknown>,
) => {
  loadFromHTML: (items: HTMLElement[]) => void;
  destroy: () => void;
};

@Component({
  selector: 'pokemon-page-component',
  imports: [
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './pokemon-page.component.html',
  styleUrl: './pokemon-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('flipBook', { static: false })
  private flipBookElement?: ElementRef<HTMLDivElement>;

  @ViewChildren('flipPage')
  private flipPages?: QueryList<ElementRef<HTMLElement>>;

  protected readonly i18n = inject(I18nService);
  private readonly bookFacade = inject(BookFacade);

  protected readonly loading = this.bookFacade.loading;
  protected readonly error = this.bookFacade.error;
  protected readonly pages = this.bookFacade.pages;
  protected readonly bookTitle = this.bookFacade.bookTitle;
  protected readonly bookDescription = this.bookFacade.bookDescription;
  protected readonly bookInitialized = signal(false);

  protected readonly searchInput = signal('');
  protected readonly searchTerm = signal('');
  protected readonly isSearching = signal(false);
  protected readonly bookBooting = computed(
    () => !this.loading() && !this.error() && this.pages().length > 0 && !this.bookInitialized(),
  );
  protected readonly matchedPages = computed(() => {
    const query = this.searchTerm().trim();
    if (!query) {
      return this.pages();
    }

    const normalizedQuery = this.normalizeText(query);
    const numericQuery = normalizedQuery.replace('#', '');
    const isNumericSearch = /^\d+$/.test(numericQuery);

    return this.pages().filter((page) => {
      if (isNumericSearch) {
        return String(page.id).includes(numericQuery);
      }

      const normalizedName = this.normalizeText(page.name.replace(/-/g, ' '));
      return normalizedName.includes(normalizedQuery);
    });
  });
  protected readonly pageCountLabel = computed(() => {
    const filteredCount = this.matchedPages().length;
    const totalCount = this.pages().length;

    if (filteredCount === totalCount) {
      return this.i18n.t('reader.pagesCountAll', { total: totalCount });
    }

    return this.i18n.t('reader.pagesCountFiltered', {
      filtered: filteredCount,
      total: totalCount,
    });
  });
  protected readonly libraryTabQuery = computed(() => {
    if (this.bookFacade.selectedBookKind() === 'generation') {
      return { tab: 'generation' };
    }

    if (this.bookFacade.selectedBookKind() === 'type') {
      return { tab: 'type' };
    }

    return { tab: 'national' };
  });
  protected readonly backSectionLabel = computed(() => {
    if (this.bookFacade.selectedBookKind() === 'generation') {
      return this.i18n.t('reader.backToGenerations');
    }

    if (this.bookFacade.selectedBookKind() === 'type') {
      return this.i18n.t('reader.backToTypes');
    }

    return this.i18n.t('reader.backToLibrary');
  });

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewReady = signal(false);
  private pageFlip: {
    loadFromHTML: (items: HTMLElement[]) => void;
    destroy: () => void;
  } | null = null;
  private pageFlipCtor: PageFlipCtor | null = null;
  private pendingRestorePokemonId: number | null = null;
  private searchAnimationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private searchDebounceTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private componentDestroyed = false;
  private initToken = 0;
  private loadToken = 0;

  constructor() {
    effect(() => {
      const isReady = this.viewReady();
      const pages = this.pages();

      if (!this.isBrowser || !isReady) {
        return;
      }

      if (pages.length === 0) {
        this.destroyPageFlip();
        return;
      }

      this.bookInitialized.set(false);
      setTimeout(() => this.initializeBook(), 0);
    });
  }

  ngOnInit(): void {
    const querySearch = this.route.snapshot.queryParamMap.get('q');
    const queryBook = Number(this.route.snapshot.queryParamMap.get('book')) || null;
    const queryGeneration = this.route.snapshot.queryParamMap.get('generation');
    const queryType = this.route.snapshot.queryParamMap.get('type');

    this.bookFacade.initializeFromQuery({
      source: this.route.snapshot.queryParamMap.get('source'),
      generation: queryGeneration,
      type: queryType,
    });

    if (querySearch) {
      this.searchInput.set(querySearch);
      this.searchTerm.set(querySearch);
    }

    this.pendingRestorePokemonId = queryBook;
    this.bookFacade.loadBookPages();
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.componentDestroyed = true;

    if (this.searchAnimationTimeoutId !== null) {
      clearTimeout(this.searchAnimationTimeoutId);
      this.searchAnimationTimeoutId = null;
    }

    if (this.searchDebounceTimeoutId !== null) {
      clearTimeout(this.searchDebounceTimeoutId);
      this.searchDebounceTimeoutId = null;
    }

    this.destroyPageFlip();
  }

  protected selectPokemon(pokemonId: number): void {
    const query = this.searchInput().trim();
    const queryParams: Record<string, string | number> = {
      book: pokemonId,
      source: this.bookFacade.selectedBookKind(),
    };

    if (query) {
      queryParams['q'] = query;
    }

    if (this.bookFacade.selectedBookKind() === 'generation') {
      queryParams['generation'] = this.bookFacade.selectedGeneration();
    }

    if (this.bookFacade.selectedBookKind() === 'type') {
      queryParams['type'] = this.bookFacade.selectedType();
    }

    this.router.navigate(['/detalles', pokemonId], { queryParams });
  }

  protected updateSearchFromEvent(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const query = target?.value ?? '';

    this.searchInput.set(query);
    this.triggerSearchAnimation();

    if (this.searchDebounceTimeoutId !== null) {
      clearTimeout(this.searchDebounceTimeoutId);
    }

    this.searchDebounceTimeoutId = setTimeout(() => {
      this.searchTerm.set(this.searchInput());
      this.focusFirstMatch();
      this.searchDebounceTimeoutId = null;
    }, 160);
  }

  protected formatName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private normalizeText(value: string): string {
    return normalizeSearchText(value);
  }

  private initializeBook(): void {
    if (!this.isBrowser) {
      return;
    }

    if (this.componentDestroyed) {
      return;
    }

    // The #flipBook element and #flipPage children live inside an @else block
    // that is only rendered once loading() is false. The effect fires as soon as
    // pages() changes — which happens BEFORE loading.set(false) in the facade.
    // Angular may not have flushed the template to the DOM by the time setTimeout(0)
    // fires, so flipBookElement can still be null. requestAnimationFrame guarantees
    // we wait until the browser has completed the pending render cycle.
    if (!this.flipBookElement || !this.flipPages || !this.flipPages.length) {
      requestAnimationFrame(() => {
        if (!this.componentDestroyed) {
          this.initializeBook();
        }
      });
      return;
    }

    const currentInitToken = ++this.initToken;

    this.ensurePageFlipConstructor()
      .then((PageFlipCtor) => {
        if (!PageFlipCtor || this.componentDestroyed || currentInitToken !== this.initToken) {
          return;
        }

        if (!this.flipBookElement || !this.flipPages || !this.flipPages.length) {
          return;
        }

        this.destroyPageFlip();

        this.pageFlip = new PageFlipCtor(this.flipBookElement.nativeElement, {
          width: 360,
          height: 520,
          size: 'stretch',
          minWidth: 280,
          maxWidth: 420,
          minHeight: 420,
          maxHeight: 560,
          maxShadowOpacity: 0.38,
          drawShadow: true,
          showCover: true,
          flippingTime: 620,
          usePortrait: true,
          autoSize: true,
          clickEventForward: true,
          swipeDistance: 24,
        });

        this.pageFlip.loadFromHTML(this.flipPages.map((page) => page.nativeElement));
        this.bookInitialized.set(true);

        if (this.pendingRestorePokemonId) {
          const pokemonId = this.pendingRestorePokemonId;
          this.pendingRestorePokemonId = null;

          setTimeout(() => this.turnToPokemonPage(pokemonId), 30);
        }
      })
      .catch(() => {
        this.bookInitialized.set(false);
        this.error.set(this.i18n.t('reader.errors.animation'));
      });
  }

  private turnToPokemonPage(pokemonId: number): void {
    if (!this.pageFlip) {
      return;
    }

    const pageIndex = this.pages().findIndex((page) => page.id === pokemonId);
    if (pageIndex < 0) {
      return;
    }

    const pageFlipApi = this.pageFlip as unknown as { turnToPage?: (page: number) => void };
    pageFlipApi.turnToPage?.(pageIndex);
  }

  private triggerSearchAnimation(): void {
    this.isSearching.set(true);

    if (this.pageFlip) {
      const pageFlipApi = this.pageFlip as unknown as {
        getCurrentPageIndex?: () => number;
        turnToPage?: (page: number) => void;
      };

      const currentIndex = pageFlipApi.getCurrentPageIndex?.() ?? 0;
      const maxIndex = Math.max(this.pages().length - 1, 0);
      const nextIndex = Math.min(currentIndex + 1, maxIndex);

      if (nextIndex !== currentIndex) {
        pageFlipApi.turnToPage?.(nextIndex);
        setTimeout(() => {
          pageFlipApi.turnToPage?.(currentIndex);
        }, 120);
      }
    }

    if (this.searchAnimationTimeoutId !== null) {
      clearTimeout(this.searchAnimationTimeoutId);
    }

    this.searchAnimationTimeoutId = setTimeout(() => {
      this.isSearching.set(false);
      this.searchAnimationTimeoutId = null;
    }, 420);
  }

  private async ensurePageFlipConstructor(): Promise<PageFlipCtor | null> {
    if (!this.isBrowser) {
      return null;
    }

    if (this.pageFlipCtor) {
      return this.pageFlipCtor;
    }

    const module = await import('page-flip');
    this.pageFlipCtor = module.PageFlip as unknown as PageFlipCtor;
    return this.pageFlipCtor;
  }

  private focusFirstMatch(): void {
    const firstMatch = this.matchedPages()[0];
    if (!firstMatch) {
      return;
    }

    this.turnToPokemonPage(firstMatch.id);
  }

  private destroyPageFlip(): void {
    if (!this.pageFlip) {
      return;
    }

    try {
      this.pageFlip.destroy();
    } catch {
    } finally {
      this.pageFlip = null;
      this.bookInitialized.set(false);
    }
  }
}
