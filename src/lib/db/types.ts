// Interfaces baseadas nas tabelas
export interface IWord {
  id?: number;
  name: string;
  slug: string;
  comfort: number;
  translation?: string;
  language: string;
  is_not_a_word: boolean;
  count: number;
}

export interface IPhrase {
  id?: number;
  word_ids: string;
  name: string;
  slug: string;
  comfort: number;
  translation?: string;
  first_word_slug: string;
  last_word_slug: string;
  language: string;
}

export interface IArticle {
  article_id?: number;
  name: string;
  source: string;
  original: string;
  word_ids: string;
  language: string;
  date_created: number;
  last_opened: number;
  current_page: number;
  is_default?: boolean;
}

export interface ILanguage {
  id?: number;
  name: string;
  iso_639_1: string;
  text_splitting_regex: string;
  word_regex: string;
}

export interface ISettings {
  settings_id?: number;
  user: {
    "native-lang": string;
    "target-lang": string;
    "trunk-version": string;
    "page-size": number;
  };
}