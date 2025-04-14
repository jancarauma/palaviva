// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/lib/db/schema";
import { IArticle } from "@/lib/db/types";
import Footer from "@/components/Common/Footer";
import NavLink from "@/components/Common/NavLink";
import ArticleListView from "../components/HomePage/ArticleListView";

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

  {/* Load Settings from DB */}
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        const refreshedSettings = await db.settings.get(1);      

        if (!refreshedSettings) {
          await db.settings.add({
            user: {
              "native-lang": "pt",
              "target-lang": "en",
              version: "0.0.1",
              "page-size": 1000,
            },
          });
        }

        const latestSettings = await db.settings.get(1);

        const langCode = (await latestSettings?.user["target-lang"]) || "en";

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

  {/* Load articles */}
  useEffect(() => {
    const loadArticles = async () => {
      if (!targetLang) return;

      try {
        setLoading(true);

        const currentSettings = await db.settings.get(1);
        const currentLang = currentSettings?.user["target-lang"] || "en";

        if (currentLang !== targetLang) {
          setTargetLang(currentLang);
        }

        const articles = await db.articles
          .where("language")
          .equals(currentLang)
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

  {/* Check for New Updates */}
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return;

    const checkUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                const currentDeployment =
                  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
                const newDeployment = registration.scope.split("/").pop();

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
        console.error("Update check failed:", error);
      }
    };

    if ("serviceWorker" in navigator) {
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
              <NavLink
                href="/"
                currentView={currentView}
                targetView="article-list"
              >
                Articles
              </NavLink>
              <NavLink
                href="/create"
                currentView={currentView}
                targetView="article-create"
              >
                Create
              </NavLink>
              <NavLink
                href="/words"
                currentView={currentView}
                targetView="words"
              >
                Words
              </NavLink>
              <NavLink
                href="/settings"
                currentView={currentView}
                targetView="settings"
              >
                Settings
              </NavLink>
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
          <ArticleListView
            articles={filteredArticles}
            searchQuery={searchQuery}
            targetLanguageName={targetLanguageName}
            onDelete={handleDelete}
            onSearch={setSearchQuery}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {updateAvailable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Available</h3>
            <p className="mb-4">
              A new version of the Palaviva is available. Would you like to
              update now?
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
