import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./features/book/components/book-library/book-library.component').then(
				(m) => m.BookLibraryComponent,
			),
	},
	{
		path: 'libro',
		loadComponent: () =>
			import('./features/book/components/pokemon-page/pokemon-page.component').then(
				(m) => m.PokemonPageComponent,
			),
	},
	{
		path: 'detalles/:id',
		loadComponent: () =>
			import('./features/book/components/pokemon-detail.component/pokemon-detail.component').then(
				(m) => m.PokemonDetailComponent,
			),
	},
	{
		path: '**',
		redirectTo: '',
	},
];
