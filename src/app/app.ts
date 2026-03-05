import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './core/i18n/i18n.service';
import { AppLanguage } from './core/i18n/translations';
import { FloatingControlsComponent } from './shared/layout/floating-controls/floating-controls.component';

type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'pokeapp.theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FloatingControlsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly i18n = inject(I18nService);
  protected readonly themeMode = signal<ThemeMode>('dark');
  protected readonly languageOptions = this.i18n.availableLanguages;
  protected readonly themeLabel = computed(() =>
    this.themeMode() === 'dark' ? this.i18n.t('app.theme.dark') : this.i18n.t('app.theme.light'),
  );

  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    const persistedTheme = this.browser ? localStorage.getItem(THEME_STORAGE_KEY) : null;

    if (persistedTheme === 'light' || persistedTheme === 'dark') {
      this.themeMode.set(persistedTheme);
    }

    this.applyThemeClass(this.themeMode());
  }

  protected setLanguage(language: AppLanguage): void {
    this.i18n.setLanguage(language);
  }

  protected toggleTheme(): void {
    const nextTheme: ThemeMode = this.themeMode() === 'dark' ? 'light' : 'dark';
    this.themeMode.set(nextTheme);
    this.applyThemeClass(nextTheme);

    if (this.browser) {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }
  }

  private applyThemeClass(theme: ThemeMode): void {
    this.document.body.classList.toggle('light-mode', theme === 'light');
  }
}
