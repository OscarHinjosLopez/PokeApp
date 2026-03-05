import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AppLanguage, translations } from './translations';

const LANGUAGE_STORAGE_KEY = 'pokeapp.language';

type TranslationTree = (typeof translations)['en'];
type DotPrefix<Prefix extends string, Key extends string> = Prefix extends ''
  ? Key
  : `${Prefix}.${Key}`;
type TranslationKeyOf<T, Prefix extends string = ''> = T extends string
  ? never
  : {
      [Key in Extract<keyof T, string>]: T[Key] extends string
        ? DotPrefix<Prefix, Key>
        : TranslationKeyOf<T[Key], DotPrefix<Prefix, Key>>;
    }[Extract<keyof T, string>];

export type TranslationKey = TranslationKeyOf<TranslationTree>;
type PokemonTypeTranslationKey = Extract<keyof TranslationTree['pokemon']['types'], string>;
type PokemonStatTranslationKey = Extract<keyof TranslationTree['pokemon']['stats'], string>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly activeLanguage = signal<AppLanguage>('en');
  private readonly translationCache = new Map<string, string>();

  readonly language = computed(() => this.activeLanguage());
  readonly availableLanguages: ReadonlyArray<{ code: AppLanguage; labelKey: TranslationKey }> = [
    { code: 'en', labelKey: 'app.languageName.en' },
    { code: 'es', labelKey: 'app.languageName.es' },
    { code: 'fr', labelKey: 'app.languageName.fr' },
  ];

  constructor() {
    const initialLanguage = this.resolveInitialLanguage();
    this.activeLanguage.set(initialLanguage);
  }

  setLanguage(language: AppLanguage): void {
    this.activeLanguage.set(language);
    this.translationCache.clear();

    if (this.browser) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    return this.translateKey(key, params);
  }

  tPokemonType(typeName: string): string {
    if (this.isPokemonTypeKey(typeName)) {
      return this.translateKey(`pokemon.types.${typeName}`);
    }

    return this.prettyLabel(typeName);
  }

  tPokemonStat(statName: string): string {
    if (this.isPokemonStatKey(statName)) {
      return this.translateKey(`pokemon.stats.${statName}`);
    }

    return this.prettyLabel(statName);
  }

  private translateKey(key: string, params?: Record<string, string | number>): string {
    const cacheKey = this.buildCacheKey(this.activeLanguage(), key, params);
    const cached = this.translationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const selectedLanguage = this.activeLanguage();
    const selectedValue = this.lookup(selectedLanguage, key);
    const fallbackValue = this.lookup('en', key);
    const resolvedText = (selectedValue ?? fallbackValue ?? key) as string;

    if (!params) {
      this.translationCache.set(cacheKey, resolvedText);
      return resolvedText;
    }

    const translated = Object.entries(params).reduce(
      (acc, [paramKey, paramValue]) => acc.replaceAll(`{{${paramKey}}}`, String(paramValue)),
      resolvedText,
    );

    this.translationCache.set(cacheKey, translated);
    return translated;
  }

  private isPokemonTypeKey(value: string): value is PokemonTypeTranslationKey {
    return value in translations.en.pokemon.types;
  }

  private isPokemonStatKey(value: string): value is PokemonStatTranslationKey {
    return value in translations.en.pokemon.stats;
  }

  private prettyLabel(value: string): string {
    if (!value) {
      return value;
    }

    const normalized = value.replace(/-/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private resolveInitialLanguage(): AppLanguage {
    if (!this.browser) {
      return 'en';
    }

    const persistedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (persistedLanguage === 'en' || persistedLanguage === 'es' || persistedLanguage === 'fr') {
      return persistedLanguage;
    }

    const browserLanguage = navigator.language.toLowerCase();

    if (browserLanguage.startsWith('es')) {
      return 'es';
    }

    if (browserLanguage.startsWith('fr')) {
      return 'fr';
    }

    return 'en';
  }

  private lookup(language: AppLanguage, key: string): string | null {
    const dictionary = translations[language];
    const path = key.split('.');

    let current: unknown = dictionary;
    for (const segment of path) {
      if (typeof current !== 'object' || current === null || !(segment in current)) {
        return null;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return typeof current === 'string' ? current : null;
  }

  private buildCacheKey(
    language: AppLanguage,
    key: string,
    params?: Record<string, string | number>,
  ): string {
    const paramsKey = params ? JSON.stringify(params) : '';
    return `${language}|${key}|${paramsKey}`;
  }
}
