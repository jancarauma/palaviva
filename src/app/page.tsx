// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils';
import { IArticle } from '@/lib/db/types';

export default function HomePage() {
  const pathname = usePathname();
  const [isDebug] = useState(process.env.NODE_ENV === 'development');
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetLang, setTargetLang] = useState<string>('');
  const [targetLanguageName, setTargetLanguageName] = useState('');

  const currentView = pathname.split('/').pop() || 'article-list';

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        const { db } = await import('@/lib/db/schema');
        
        // Carregar ou criar configurações padrão
        let settings = await db.settings.get(1);

        if (!settings) {
          await db.settings.add({
            user: {
              "native-lang": "pt",
              "target-lang": "en",
              "version": "0.0.1",
              "page-size": 1000
            }
          });
          settings = await db.settings.get(1);
        }
  
        // Definir targetLang
        const langCode = await settings?.user['target-lang'] || 'fr';
        setTargetLang(langCode);
  
        // Carregar nome do idioma
        const language = await db.languages
          .where('iso_639_1')
          .equalsIgnoreCase(langCode)
          .first();
        
        setTargetLanguageName(language?.name || 'Unknow');
  
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadSettings();
  }, []);
  
  useEffect(() => {
    const loadArticles = async () => {
      if (!targetLang) return;
  
      try {
        setLoading(true);
        const articles = await db.articles
          .where('language')
          .equals(targetLang)
          .reverse()
          .sortBy('date_created');
        
        setArticles(articles);
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadArticles();
  }, [targetLang]);

  const handleDelete = async (articleId: number) => {
    if (confirm('Are you sure you want to delete this article?')) {
      try {
        await db.articles.delete(articleId);
        setArticles(prev => prev.filter(a => a.article_id !== articleId));
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wipeDatabase = async () => {
    try {
      await Promise.all([
        db.words.clear(),
        db.articles.clear(),
        db.phrases.clear(),
        db.languages.clear(),
        db.settings.clear()
      ]);
      window.location.reload();
    } catch (error) {
      console.error('Error wiping database:', error);
    }
  };

  return (
    <div className="dark:bg-gray-900 dark:text-white flex flex-col min-h-screen bg-gray-50">
      {/* Debug Button */}
      {isDebug && (
        <div className="fixed bottom-0 right-0 p-2 z-50">
          <button
            onClick={wipeDatabase}
            className="bg-white border rounded py-1 px-2 text-xs text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            Wipe Database
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex space-x-8">
              <Link href="/" className={`nav-link ${currentView === 'article-list' ? 'active' : ''}`}>
                Articles
              </Link>
              <Link href="/create" className={`nav-link ${currentView === 'article-create' ? 'active' : ''}`}>
                Create
              </Link>
              <Link href="/words" className={`nav-link ${currentView === 'words' ? 'active' : ''}`}>
                Words
              </Link>
              <Link href="/settings" className={`nav-link ${currentView === 'settings' ? 'active' : ''}`}>
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto p-4 w-full">
        {currentView === 'article-list' && (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {targetLanguageName ? `Your ${targetLanguageName} Texts` : "Loading Texts..."}
              </h1>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search texts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 
                             dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No articles found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <ArticleItem
                      key={article.article_id}
                      article={article}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'article-create' && (
          <div>Create View Component Here</div>
        )}

        {currentView === 'words' && (
          <div>Words View Component Here</div>
        )}

        {currentView === 'settings' && (
          <div>Settings View Component Here</div>
        )}
      </main>
    </div>
  );
}

function ArticleItem({ article, onDelete }: { article: IArticle; onDelete: (id: number) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 
                    hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Link href={`/article/${article.article_id}`} className="block">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
              {article.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {article.original}
            </p>
          </Link>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span>Last opened: {formatDate(article.last_opened)}</span>
            <span className="mx-2">|</span>
            <span>Created: {formatDate(article.date_created)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 3000);
            } else {
              onDelete(article.article_id!);
            }
          }}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            confirmDelete 
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-200'
              : 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
          }`}
        >
          {confirmDelete ? 'Confirm Delete' : 'Delete'}
        </button>
      </div>
    </div>
  );
}