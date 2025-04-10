// src/lib/db/schema.ts
import Dexie from 'dexie';

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

class LanguageAppDB extends Dexie {
  words!: Dexie.Table<IWord, number>;
  phrases!: Dexie.Table<IPhrase, number>;
  articles!: Dexie.Table<IArticle, number>;
  languages!: Dexie.Table<ILanguage, number>;
  settings!: Dexie.Table<ISettings, number>;

  constructor() {
    super('LanguageAppDB');
    
    this.version(3).stores({
      words: '++id, name, slug, comfort, language',
      phrases: '++id, word_ids, first_word_slug, last_word_slug, language',
      articles: '++article_id, name, language, date_created',
      languages: '++id, iso_639_1',
      settings: '++settings_id'
    });

    this.version(4).stores({
      words: '++id, name, slug, comfort, language, count', // Adicione count
      phrases: '++id, word_ids, first_word_slug, last_word_slug, language',
      articles: '++article_id, name, language, date_created',
      languages: '++id, iso_639_1',
      settings: '++settings_id'      
    });

    this.version(5).stores({
      words: '++id, name, slug, comfort, language, count', 
      phrases: '++id, word_ids, first_word_slug, last_word_slug, language',
      articles: '++article_id, name, language, date_created',
      languages: '++id, iso_639_1, name', // Adicione name
      settings: '++settings_id'   
    });
  }

  // Métodos customizados
  async searchWords(query: string, lang: string): Promise<IWord[]> {
    return this.words
      .where('language').equals(lang)
      .filter(word => 
        word.name.toLowerCase().includes(query.toLowerCase()) ||
        (word.translation?.toLowerCase()?.includes(query.toLowerCase()))
      )
      .toArray();
  }

  // Inicialização do banco
  async seed() {
    return Dexie.Promise.all([
      this.languages.bulkAdd([
        {
          name: "french",
          iso_639_1: "fr",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "english",
          iso_639_1: "en",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "spanish",
          iso_639_1: "es",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "polish",
          iso_639_1: "pl",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "german",
          iso_639_1: "de",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "swedish",
          iso_639_1: "sv",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "dutch",
          iso_639_1: "nl",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "italian",
          iso_639_1: "it",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "portugues",
          iso_639_1: "pt",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+([ãõâêôáéíóúç'-]\\p{L}+)*$"
        }
      ]),
      
      this.settings.add({
        user: {
          "native-lang": "en",
          "target-lang": "fr",
          "trunk-version": "0.0.1",
          "page-size": 1000
        }
      })
    ]);
  }
}

export const db = new LanguageAppDB();

// Operações com palavras
export const wordService = {
  async updateComfort(slug: string, language: string, comfort: number): Promise<void> {
    return db.words
      .where(['slug', 'language'])
      .equals([slug, language])
      .modify({ comfort });
  },

  async bulkInsert(words: Omit<IWord, 'id'>[]): Promise<void> {
    return db.words.bulkAdd(words as IWord[]);
  },

  async getForArticle(language: string): Promise<IWord[]> {
    return db.words
      .where('language').equals(language)
      .filter(word => !word.is_not_a_word)
      .toArray();
  }
};

// Operações com artigos
export const articleService = {
  async insert(article: Omit<IArticle, 'article_id'>): Promise<number> {
    return db.articles.add(article);
  },

  async getRecent(language: string): Promise<IArticle[]> {
    return db.articles
      .where('language').equals(language)
      .reverse()
      .sortBy('date_created');
  },

  async attachWords(article: IArticle): Promise<IArticle & { word_data: IWord[] }> {
    const wordIds = article.word_ids.split('$').map(Number);
    const words = await db.words.where('id').anyOf(wordIds).toArray();
    return { ...article, word_data: words };
  }
};

// Operações com configurações
export const settingsService = {
  async get(): Promise<ISettings['user']> {
    const settings = await db.settings.get(1);
    return settings?.user || {
      "native-lang": "en",
      "target-lang": "fr",
      "trunk-version": "0.0.1",
      "page-size": 1000
    };
  },

  async update(update: Partial<ISettings['user']>): Promise<void> {
    const current = await this.get();
    return db.settings.update(1, { user: { ...current, ...update } });
  }
};

// Inicialização do banco
export async function initializeDB() {
  if (await db.settings.count() === 0) {
    await db.delete();
    await db.open();
    await db.seed();
  }
}