import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AppLanguage } from '../../../core/i18n/translations';
import { I18nService, TranslationKey } from '../../../core/i18n/i18n.service';

type ThemeMode = 'dark' | 'light';

@Component({
  selector: 'app-floating-controls',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './floating-controls.component.html',
  styleUrl: './floating-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingControlsComponent {
  readonly themeMode = input<ThemeMode>('dark');
  readonly themeLabel = input<string>('');
  readonly languageOptions = input<ReadonlyArray<{ code: AppLanguage; labelKey: TranslationKey }>>(
    [],
  );

  readonly toggleTheme = output<void>();
  readonly languageChange = output<AppLanguage>();

  protected readonly i18n = inject(I18nService);

  protected onToggleTheme(): void {
    this.toggleTheme.emit();
  }

  protected onLanguageChange(language: AppLanguage): void {
    this.languageChange.emit(language);
  }
}
