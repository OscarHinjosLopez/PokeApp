import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PokemonApiService {
  constructor() {}

  getPokemon(id: number): string {
    return 'https://pokeapi.co/api/v2/pokemon/' + id;
  }

  getPokemonList(limit: number, offset: number): string {
    return `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
  }

  getGenerationList(): string {
    return 'https://pokeapi.co/api/v2/generation?limit=20&offset=0';
  }

  getGeneration(idOrName: string): string {
    return `https://pokeapi.co/api/v2/generation/${idOrName}`;
  }

  getTypeList(): string {
    return 'https://pokeapi.co/api/v2/type?limit=30&offset=0';
  }

  getType(idOrName: string): string {
    return `https://pokeapi.co/api/v2/type/${idOrName}`;
  }

  getDescriptionAbilityByUrl(url: string): string {
    return url;
  }
}
