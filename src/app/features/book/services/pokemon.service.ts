import { Injectable } from '@angular/core';
import { PokemonApiService } from './pokemon.api.service';
import { Observable, shareReplay } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Pokemon } from '../models/pokemon.model';
import {
  AbilityDetailsResponse,
  GenerationDetailResponse,
  GenerationListResponse,
  PokemonListResponse,
  TypeDetailResponse,
  TypeListResponse,
} from '../domain/book.types';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private readonly pokemonByIdCache = new Map<number, Observable<Pokemon>>();
  private readonly pokemonListCache = new Map<string, Observable<PokemonListResponse>>();
  private readonly generationByNameCache = new Map<string, Observable<GenerationDetailResponse>>();
  private readonly typeByNameCache = new Map<string, Observable<TypeDetailResponse>>();
  private generationListCache?: Observable<GenerationListResponse>;
  private typeListCache?: Observable<TypeListResponse>;

  constructor(
    private pokemonApiService: PokemonApiService,
    private httpClient: HttpClient,
  ) {}

  getPokemon(id: number): Observable<Pokemon> {
    const cached = this.pokemonByIdCache.get(id);
    if (cached) {
      return cached;
    }

    const request = this.httpClient
      .get<Pokemon>(this.pokemonApiService.getPokemon(id))
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.pokemonByIdCache.set(id, request);

    return request;
  }

  getPokemonList(limit: number, offset: number): Observable<PokemonListResponse> {
    const cacheKey = `${limit}:${offset}`;
    const cached = this.pokemonListCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request = this.httpClient
      .get<PokemonListResponse>(this.pokemonApiService.getPokemonList(limit, offset))
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.pokemonListCache.set(cacheKey, request);

    return request;
  }

  getGenerationList(): Observable<GenerationListResponse> {
    if (this.generationListCache) {
      return this.generationListCache;
    }

    this.generationListCache = this.httpClient
      .get<GenerationListResponse>(this.pokemonApiService.getGenerationList())
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));

    return this.generationListCache;
  }

  getGeneration(idOrName: string): Observable<GenerationDetailResponse> {
    const cached = this.generationByNameCache.get(idOrName);
    if (cached) {
      return cached;
    }

    const request = this.httpClient
      .get<GenerationDetailResponse>(this.pokemonApiService.getGeneration(idOrName))
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.generationByNameCache.set(idOrName, request);

    return request;
  }

  getTypeList(): Observable<TypeListResponse> {
    if (this.typeListCache) {
      return this.typeListCache;
    }

    this.typeListCache = this.httpClient
      .get<TypeListResponse>(this.pokemonApiService.getTypeList())
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));

    return this.typeListCache;
  }

  getType(idOrName: string): Observable<TypeDetailResponse> {
    const cached = this.typeByNameCache.get(idOrName);
    if (cached) {
      return cached;
    }

    const request = this.httpClient
      .get<TypeDetailResponse>(this.pokemonApiService.getType(idOrName))
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.typeByNameCache.set(idOrName, request);

    return request;
  }

  getDescriptionAbilities(url: string): Observable<AbilityDetailsResponse> {
    return this.httpClient.get<AbilityDetailsResponse>(
      this.pokemonApiService.getDescriptionAbilityByUrl(url),
    );
  }
}
