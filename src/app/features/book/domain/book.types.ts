import { NamedApiResource, Pokemon } from '../models/pokemon.model';

export type BookKind = 'national' | 'generation' | 'type';

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count?: number;
  results: PokemonListItem[];
}

export interface GenerationListResponse {
  results?: NamedApiResource[];
}

export interface GenerationDetailResponse {
  pokemon_species?: NamedApiResource[];
}

export interface PokemonByTypeEntry {
  pokemon: NamedApiResource;
}

export interface TypeListResponse {
  results?: NamedApiResource[];
}

export interface TypeDetailResponse {
  pokemon?: PokemonByTypeEntry[];
}

export interface AbilityFlavorTextEntry {
  flavor_text: string;
  language?: {
    name: string;
  };
}

export interface AbilityDetailsResponse {
  flavor_text_entries?: AbilityFlavorTextEntry[];
}

export interface PokemonBookPage {
  id: number;
  name: string;
  imageUrl: string | null;
  description: string;
}

export type PokemonResponse = Pokemon;
