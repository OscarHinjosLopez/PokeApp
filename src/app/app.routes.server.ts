import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'detalles/:id',
    renderMode: RenderMode.Server,
  },
  {
    // The book reader is dynamic (depends on query params) and uses
    // heavy client-side animations (page-flip). Prerendering it causes
    // a hydration mismatch because BookFacade.loading starts as true
    // on the client while the server had already resolved the data.
    path: 'libro',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
