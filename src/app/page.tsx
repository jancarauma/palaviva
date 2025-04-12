// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";
import { IArticle } from "@/lib/db/types";

export default function HomePage() {
  const pathname = usePathname();
  const [isDebug] = useState(process.env.NODE_ENV === "development");
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetLang, setTargetLang] = useState<string>("");
  const [targetLanguageName, setTargetLanguageName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const currentView = pathname.split("/").pop() || "article-list";

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        const { db } = await import("@/lib/db/schema");

        let settings = await db.settings.get(1);

        if (!settings) {
          await db.settings.add({
            user: {
              "native-lang": "pt",
              "target-lang": "en",
              version: "0.0.1",
              "page-size": 1000,
            },
          });
          settings = await db.settings.get(1);
        }

        const langCode = (await settings?.user["target-lang"]) || "fr";
        setTargetLang(langCode);

        const language = await db.languages
          .where("iso_639_1")
          .equalsIgnoreCase(langCode)
          .first();

        setTargetLanguageName(language?.name || "Unknow");
      } catch (error) {
        console.error("Error loading settings:", error);
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
          .where("language")
          .equals(targetLang)
          .reverse()
          .sortBy("date_created");

        setArticles(articles);
      } catch (error) {
        console.error("Error loading articles:", error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [targetLang]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') return;
  
    const checkUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                const currentDeployment = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
                const newDeployment = registration.scope.split('/').pop();
                
                if (currentDeployment !== newDeployment) {
                  setUpdateAvailable(true);
                }
              }
            });
          });
          
          // Check every 5 minutes
          setInterval(() => registration.update(), 5 * 60 * 1000);
        }
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };
  
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(checkUpdates);
    }
  }, []);

  const handleUpdateConfirm = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    }
    setUpdateAvailable(false);
  };

  const handleDelete = async (articleId: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      try {
        await db.articles.delete(articleId);
        setArticles((prev) => prev.filter((a) => a.article_id !== articleId));
      } catch (error) {
        console.error("Error deleting article:", error);
      }
    }
  };

  const filteredArticles = articles.filter((article) =>
    article.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wipeDatabase = async () => {
    try {
      await Promise.all([
        db.words.clear(),
        db.articles.clear(),
        db.phrases.clear(),
        db.languages.clear(),
        db.settings.clear(),
      ]);
      window.location.reload();
    } catch (error) {
      console.error("Error wiping database:", error);
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

      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section - Left side */}
            <div className="flex-shrink-0 flex items-center cursor-pointer">
              <Link href="/" className="flex items-center">
                {/*<Image
                  src="/next.svg"
                  alt="LingoLearn Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />*/}
                <span className="ml-2 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  Palaviva
                </span>
              </Link>
            </div>

            {/* Desktop Navigation - Right side */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "article-list"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                } transition-colors duration-200`}
              >
                Articles
              </Link>
              <Link
                href="/create"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "article-create"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                } transition-colors duration-200`}
              >
                Create
              </Link>
              <Link
                href="/words"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "words"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                } transition-colors duration-200`}
              >
                Words
              </Link>
              <Link
                href="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "settings"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                } transition-colors duration-200`}
              >
                Settings
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                currentView === "article-list"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
              } transition-colors duration-200`}
            >
              Articles
            </Link>
            <Link
              href="/create"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                currentView === "article-create"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
              } transition-colors duration-200`}
            >
              Create
            </Link>
            <Link
              href="/words"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                currentView === "words"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
              } transition-colors duration-200`}
            >
              Words
            </Link>
            <Link
              href="/settings"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                currentView === "settings"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
              } transition-colors duration-200`}
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto p-4 w-full">
        {currentView === "article-list" && (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h1 className="mb-8 text-4xl font-bold text-gray-800 dark:text-white mb-3">
                  {targetLanguageName
                    ? `Your ${targetLanguageName} Texts`
                    : "Loading Texts..."}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                  Explore your saved language learning materials. Search,
                  organize, and manage your articles in{" "}
                  {targetLanguageName.toLowerCase() || "your target language"}.
                </p>
                <div className="mb-4 relative max-w-xl mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search texts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700  dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500  transition-all duration-200"
                  />
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center mb-3">
                    <svg
                      className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                      No Articles Found
                    </h3>
                  </div>
                  <p className="mb-6 text-gray-600 dark:text-gray-300 text-sm max-w-md mx-auto leading-6">
                    We couldn&apos;t find any articles in{" "}
                    {targetLanguageName.toLowerCase()}. You can either{" "}
                    <span className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline cursor-pointer transition-colors">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      search again
                    </span>{" "}
                    or{" "}
                    <span className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline cursor-pointer transition-colors">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      create a new article.
                    </span>
                  </p>
                  <button
                    onClick={() => (window.location.href = "/create")}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 dark:from-purple-500 dark:to-fuchsia-500 dark:hover:from-purple-600 dark:hover:to-fuchsia-600 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create Your First Article
                  </button>
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

        {currentView === "article-create" && (
          <div>Create View Component Here</div>
        )}

        {currentView === "words" && <div>Words View Component Here</div>}

        {currentView === "settings" && <div>Settings View Component Here</div>}
      </main>

      <Footer />

      {updateAvailable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Available</h3>
            <p className="mb-4">
              A new version of the Palaviva is available. Would you like to update
              now?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setUpdateAvailable(false)}
                className="px-4 py-2 cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Later
              </button>
              <button
                onClick={handleUpdateConfirm}
                className="px-4 py-2 rounded cursor-pointer text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 dark:from-purple-500 dark:to-fuchsia-500 dark:hover:from-purple-600 dark:hover:to-fuchsia-600 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Footer = () => (
  <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 mt-16">
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Palaviva</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Your smart companion for language immersion through learning with texts content.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase">Learn</h4>
          <ul className="space-y-2">
            <li><Link href="/getting-started" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Getting Started</Link></li>
            <li><Link href="/best-practices" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Best Practices</Link></li>
            <li><Link href="/blog" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Learning Blog</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase">Company</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">About Us</Link></li>
            <li><Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Terms of Service</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase">Support</h4>
          <ul className="space-y-2">
            <li><Link href="/help" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Help Center</Link></li>
            <li><Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">Contact Us</Link></li>
            <li><Link href="/status" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm">System Status</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          © {new Date().getFullYear()} Palaviva. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

function ArticleItem({
  article,
  onDelete,
}: {
  article: IArticle;
  onDelete: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 
                    hover:shadow-md transition-shadow cursor-pointer"
    >
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
            {/*<span>Last opened: {formatDate(article.last_opened)}</span>
            <span className="mx-2">|</span>*/}
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
              ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-200"
              : "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          }`}
        >
          {confirmDelete ? "Confirm Delete" : "Delete"}
        </button>
      </div>
    </div>
  );
}
