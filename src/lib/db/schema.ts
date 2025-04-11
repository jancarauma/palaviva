// src/lib/db/schema.ts
import Dexie from 'dexie';
import { IWord, IPhrase, IArticle, ILanguage, ISettings } from './types';

const DEFAULT_ARTICLE_CONTENT = `Almustafa, the chosen and the beloved, who was a dawn unto his own day, had waited twelve years in the city of Orphalese for his ship that was to return and bear him back to the isle of his birth.

And in the twelfth year, on the seventh day of Ielool, the month of reaping, he climbed the hill without the city walls and looked seaward; and he beheld his ship coming with the mist.

Then the gates of his heart were flung open, and his joy flew far over the sea. And he closed his eyes and prayed in the silences of his soul.

But as he descended the hill, a sadness came upon him, and he thought in his heart:

How shall I go in peace and without sorrow? Nay, not without a wound in the spirit shall I leave this city. Long were the days of pain I have spent within its walls, and long were the nights of aloneness; and who can depart from his pain and his aloneness without regret?

Too many fragments of the spirit have I scattered in these streets, and too many are the children of my longing that walk naked among these hills, and I cannot withdraw from them without a burden and an ache.

It is not a garment I cast off this day, but a skin that I tear with my own hands.

Nor is it a thought I leave behind me, but a heart made sweet with hunger and with thirst.

Yet I cannot tarry longer.

The sea that calls all things unto her calls me, and I must embark.

For to stay, though the hours burn in the night, is to freeze and crystallize and be bound in a mould.

Fain would I take with me all that is here. But how shall I?

A voice cannot carry the tongue and the lips that gave it wings. Alone must it seek the ether.

And alone and without his nest shall the eagle fly across the sun.

Now when he reached the foot of the hill, he turned again towards the sea, and he saw his ship approaching the harbour, and upon her prow the mariners, the men of his own land.

And his soul cried out to them, and he said:

Sons of my ancient mother, you riders of the tides,

How often have you sailed in my dreams. And now you come in my awakening, which is my deeper dream.

Ready am I to go, and my eagerness with sails full set awaits the wind.

Only another breath will I breathe in this still air, only another loving look cast backward,

And then I shall stand among you, a seafarer among seafarers. And you, vast sea, sleepless mother,

Who alone are peace and freedom to the river and the stream,

Only another winding will this stream make, only another murmur in this glade,

And then shall I come to you, a boundless drop to a boundless ocean.

And as he walked he saw from afar men and women leaving their fields and their vineyards and hastening towards the city gates.

And he heard their voices calling his name, and shouting from field to field telling one another of the coming of his ship.

And he said to himself:

Shall the day of parting be the day of gathering?

And shall it be said that my eve was in truth my dawn?

And what shall I give unto him who has left his plough in midfurrow, or to him who has stopped the wheel of his winepress? Shall my heart become a tree heavy-laden with fruit that I may gather and give unto them?

And shall my desires flow like a fountain that I may fill their cups?

Am I a harp that the hand of the mighty may touch me, or a flute that his breath may pass through me?

A seeker of silences am I, and what treasure have I found in silences that I may dispense with confidence?

If this is my day of harvest, in what fields have I sowed the seed, and in what unremembered seasons?

If this indeed be the hour in which I lift up my lantern, it is not my flame that shall burn therein.

Empty and dark shall I raise my lantern,

And the guardian of the night shall fill it with oil and he shall light it also.

These things he said in words. But much in his heart remained unsaid. For he himself could not speak his deeper secret.`;
class LanguageAppDB extends Dexie {
  words!: Dexie.Table<IWord, number>;
  phrases!: Dexie.Table<IPhrase, number>;
  articles!: Dexie.Table<IArticle, number>;
  languages!: Dexie.Table<ILanguage, number>;
  settings!: Dexie.Table<ISettings, number>;

  constructor() {
    super('LanguageAppDB');
    
    this.version(1).stores({
      words: '++id, name, slug, comfort, language',
      phrases: '++id, word_ids, first_word_slug, last_word_slug, language',
      articles: '++article_id, name, language, date_created',
      languages: '++id, iso_639_1',
      settings: '++settings_id'
    });

    this.version(2).stores({
      words: '++id, name, slug, comfort, language, count',      
    });

    this.version(3).stores({
      languages: '++id, iso_639_1, name',
    });

    this.version(4).stores({}).upgrade(async tx => {
      const existing = await tx.table('articles').get(1);
      if (!existing) {
        await tx.table('articles').add({
          name: 'The Prophet',
          source: 'Khalil Gibran',
          original: DEFAULT_ARTICLE_CONTENT,
          word_ids: '',
          language: 'en',
          date_created: Date.now(),
          last_opened: 0,
          current_page: 0
        });
      }
    });

    this.version(5).stores({
      words: '++id, name, slug, comfort, language, count, date_created' // date_created
    }).upgrade(async tx => {
      await tx.table('words').toCollection().modify(word => {
        if (!word.date_created) {
          word.date_created = Date.now();
        }
      });
    });
  }

  // Métodos customizados
  async searchWords(query: string, lang: string): Promise<IWord[]> {
    return this.words
      .where('language').equals(lang)
      .filter(word => 
        word.name.toLowerCase().includes(query.toLowerCase()) ||
        (word.translation?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
      .toArray();
  }

  // Inicialização do banco
  async seed() {
    return Dexie.Promise.all([

      this.languages.bulkAdd([
        {
          name: "French",
          iso_639_1: "fr",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "English",
          iso_639_1: "en",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "Spanish",
          iso_639_1: "es",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "Polish",
          iso_639_1: "pl",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "German",
          iso_639_1: "de",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "Swedish",
          iso_639_1: "sv",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "Dutch",
          iso_639_1: "nl",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "Italian",
          iso_639_1: "it",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+(['’-]\\p{L}+)*$"
        },
        {
          name: "Português",
          iso_639_1: "pt",
          text_splitting_regex: "[\\p{Z}\\p{P}\\p{S}]+",
          word_regex: "^\\p{L}+([ãõâêôáéíóúç'-]\\p{L}+)*$"
        }
      ]),
      
      this.settings.add({
        user: {
          "native-lang": "pt",
          "target-lang": "en",
          "trunk-version": "0.0.1",
          "page-size": 1000
        }
      }),

      this.articles.add({
        article_id: 1,
        name: 'The Prophet',
        source: 'Khalil Gibran',
        original: DEFAULT_ARTICLE_CONTENT,
        word_ids: '',
        language: 'en',
        date_created: Date.now(),
        last_opened: 0,
        current_page: 0
      })
    ]);
  }
}

export const db = new LanguageAppDB();

// Words operations
export const wordService = {
  async updateComfort(slug: string, language: string, comfort: number): Promise<void> {
    await db.words
      .where(['slug', 'language'])
      .equals([slug, language])
      .modify({ comfort });
  },

  async bulkInsert(words: Omit<IWord, 'id'>[]): Promise<void> {
    const wordsWithDates = words.map(word => ({
      ...word,
      date_created: word.date_created || Date.now()
    }));
    await db.words.bulkAdd(wordsWithDates as IWord[]);
  },

  async getForArticle(language: string): Promise<IWord[]> {
    return db.words
      .where('language').equals(language)
      .filter(word => !word.is_not_a_word)
      .toArray();
  }
};

// Articles operations
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

// Settings operations
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
    await db.settings.update(1, { user: { ...current, ...update } });
  }
};

// Initialize the Database
export async function initializeDB() {
  if (await db.settings.count() === 0) {
    await db.delete();
    await db.open();
    await db.seed();    
  }
}