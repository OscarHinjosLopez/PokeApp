# PokeApp

An Angular 21 application inspired by a Pokédex experience. It lets users browse Pokémon in a book-style UI, filter by generation or type, search by name or number, and view detailed Pokémon profiles.

## Main Features

- Pokémon library with 3 sections:
  - `National`: full collection.
  - `Generations`: books grouped by generation.
  - `Types`: books grouped by Pokémon type.
- Book-like reading view with page-turn animation powered by `page-flip`.
- Real-time search by Pokémon name or Pokédex number.
- Pokémon detail page with:
  - official artwork,
  - types,
  - base data (experience, height, weight),
  - abilities (including hidden abilities),
  - base stats.
- Internationalization (`i18n`) in:
  - English (`en`)
  - Spanish (`es`)
  - French (`fr`)
- Light/dark theme switch with `localStorage` persistence.
- Context-aware navigation:
  - from book to detail,
  - back to the same book state (position/filter),
  - back to the originating library tab.
- SSR + prerender support with Angular 21.
- UI built with Angular Material and custom SCSS theme tokens.

## Tech Stack

- Angular `21`
- Angular Material
- RxJS
- Angular SSR + Express
- SCSS (custom variables and global theme)
- PageFlip (`page-flip`) for book animation
- Vitest (through Angular unit-test builder)

## Architecture Overview

- `src/app/core/i18n`
  - Translation service, typed translation keys, and helpers for type/stat labels.
- `src/app/features/book/application`
  - `BookFacade`: orchestrates reader state (book type, pages, loading/errors, cache, titles).
- `src/app/features/book/services`
  - `PokemonApiService`: builds PokeAPI endpoints.
  - `PokemonService`: HTTP layer + response caching via `shareReplay`.
- `src/app/features/book/components`
  - `book-library`: entry point for National/Generation/Type books.
  - `pokemon-page`: book reader with search and detail navigation.
  - `pokemon-detail.component`: full Pokémon profile view.
- `src/app/shared/layout/floating-controls`
  - Floating controls for theme and language switching.

## Routes

- `/`
  Main library.
- `/libro`
  Book reader view.
- `/detalles/:id`
  Pokémon detail by ID.
- `**`
  Redirects to `/`.

### Query Params Used

- On `/libro`:
  - `source`: `national | generation | type`
  - `generation`: generation name (e.g. `generation-i`)
  - `type`: type name (e.g. `fire`)
  - `q`: search term
  - `book`: Pokémon ID used to restore page context
- On `/`:
  - `tab`: `national | generation | type`

## Local Persistence

- Language key: `pokeapp.language`
- Theme key: `pokeapp.theme`
- Light mode body class: `body.light-mode`

## Data Source

This app consumes the [PokeAPI](https://pokeapi.co/) mainly through:

- `/pokemon`
- `/generation`
- `/type`
- Ability detail URLs (for localized ability descriptions)
- Official sprites from `raw.githubusercontent.com/PokeAPI/sprites/...`

## Requirements

- Node.js (LTS recommended)
- npm (project uses `npm@10.9.2`)

## Installation

```bash
npm install
```

## Available Scripts

```bash
npm run start
```

Starts the development server (`ng serve`) at `http://localhost:4200`.

```bash
npm run build
```

Builds the project (browser + server output for SSR).

```bash
npm run watch
```

Builds in watch mode for development.

```bash
npm run test
```

Runs unit tests (`ng test`).

```bash
npm run serve:ssr:pokeApp
```

Serves the SSR build from `dist/pokeApp/server/server.mjs`.

## SSR and Rendering

- SSR is enabled in `angular.json`.
- Client hydration is configured in `src/app/app.config.ts` with:
  - `provideClientHydration`
  - `withEventReplay`
- Server route strategy in `src/app/app.routes.server.ts`:
  - `detalles/:id` uses `RenderMode.Server`
  - all other routes use `RenderMode.Prerender`

## Styling and Design

- Theme variables/tokens:
  - `src/styles/_variables.scss`
  - `src/styles/theme.scss`
- Dark mode is default.
- Light mode is applied via `body.light-mode`.
- Pokédex-inspired panels/cards and per-type chip styles.
- Reduced-motion support via `prefers-reduced-motion`.

## Current Testing Scope

Basic app tests in `src/app/app.spec.ts` validate:

- root app creation,
- `router-outlet` rendering,
- floating controls rendering.

## Project Structure (Feature-First)

```text
src/
  app/
    core/
      i18n/
    features/
      book/
        application/
        components/
        domain/
        models/
        services/
    shared/
      layout/
```

## Notes

- `gsap` is present in `package.json` but currently not used in source code.
- `src/app/features/book/components/pokemon-detail/` exists as an empty folder; the active detail component is under `pokemon-detail.component/`.

## License

Educational / practice project (adjust as needed).
