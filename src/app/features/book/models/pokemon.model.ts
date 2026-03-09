export interface NamedApiResource {
  name: string;
  url: string;
}

export interface PokemonAbility {
  ability: NamedApiResource | null;
  is_hidden: boolean;
  slot: number;
}

export interface PokemonCries {
  latest: string;
  legacy: string;
}

export interface PokemonGameIndex {
  game_index: number;
  version: NamedApiResource;
}

export interface PokemonMoveVersionDetail {
  level_learned_at: number;
  move_learn_method: NamedApiResource;
  order: number | null;
  version_group: NamedApiResource;
}

export interface PokemonMove {
  move: NamedApiResource;
  version_group_details: PokemonMoveVersionDetail[];
}

export interface PokemonSpritesSimple {
  back_default: string | null;
  back_female: string | null;
  back_shiny: string | null;
  back_shiny_female: string | null;
  front_default: string | null;
  front_female: string | null;
  front_shiny: string | null;
  front_shiny_female: string | null;
}

export interface PokemonSpritesOther {
  dream_world?: {
    front_default: string | null;
    front_female: string | null;
  };
  home?: PokemonSpritesSimple;
  'official-artwork'?: {
    front_default: string | null;
    front_shiny: string | null;
  };
  showdown?: PokemonSpritesSimple;
  [key: string]: unknown;
}

export interface PokemonSprites {
  back_default: string | null;
  back_female: string | null;
  back_shiny: string | null;
  back_shiny_female: string | null;
  front_default: string | null;
  front_female: string | null;
  front_shiny: string | null;
  front_shiny_female: string | null;
  other?: PokemonSpritesOther;
  versions?: Record<string, Record<string, unknown>>;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: NamedApiResource;
}

export interface PokemonType {
  slot: number;
  type: NamedApiResource;
}

export interface PokemonPastAbility {
  abilities: PokemonAbility[];
  generation: NamedApiResource;
}

export interface PokemonPastStat {
  generation: NamedApiResource;
  stats: PokemonStat[];
}

export interface Pokemon {
  id: number;
  name: string;
  order: number;
  base_experience: number;
  height: number;
  weight: number;
  is_default: boolean;

  abilities: PokemonAbility[];
  forms: NamedApiResource[];
  game_indices: PokemonGameIndex[];
  held_items: unknown[];
  location_area_encounters: string;
  moves: PokemonMove[];

  past_abilities: PokemonPastAbility[];
  past_stats: PokemonPastStat[];
  past_types: unknown[];

  species: NamedApiResource;
  sprites: PokemonSprites;
  stats: PokemonStat[];
  types: PokemonType[];
  cries: PokemonCries;
}