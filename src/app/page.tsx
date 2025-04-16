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

  const currentView = pathname.split("/").pop() || "articles";

  {
    /* Load Settings from DB */
  }
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

        const langCode = latestSettings?.user["target-lang"] || "en";

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

  {
    /* Load articles */
  }
  useEffect(() => {
    const loadArticles = async () => {
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

  {
    /* Check for New Updates */
  }
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
            className="cursor-pointer bg-white border rounded py-1 px-2 text-xs text-red-500 hover:bg-red-500 hover:text-white transition-colors"
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
      <nav className="relative bg-gradient-to-br from-purple-50/80 via-blue-50/80 to-pink-50/80 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-100/50 dark:border-gray-700/30 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute -top-24 -left-32 w-64 h-64 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-2xl animate-float"></div>
          <div className="absolute -top-12 -right-16 w-48 h-48 bg-pink-100 dark:bg-pink-900/20 rounded-full blur-2xl animate-float-delayed"></div>
        </div>

        {/* Subtle grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 dark:opacity-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <Link href="/" className="group flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 shadow-lg group-hover:shadow-purple-200/50 dark:group-hover:shadow-purple-700/30">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400 group-hover:bg-gradient-to-tr transition-all duration-500">
                Palaviva
              </h3>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {["articles", "create", "words", "settings"].map(
                (view) => (
                  <NavLink
                    key={view}
                    href={`/${view === "articles" ? "" : view}`}
                    currentView={currentView}
                    targetView={view}
                    className="relative px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 group"
                  >
                    {view
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
                  </NavLink>
                )
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/20 transition-all duration-200 group"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <div className="space-y-1.5 group-hover:space-y-2 transition-all duration-300">
                  <div
                    className={`w-6 h-0.5 bg-current transform transition duration-300 ${
                      isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                    }`}
                  ></div>
                  <div
                    className={`w-6 h-0.5 bg-current transition duration-300 ${
                      isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  ></div>
                  <div
                    className={`w-6 h-0.5 bg-current transform transition duration-300 ${
                      isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                    }`}
                  ></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`${
            isMenuOpen ? "max-h-96" : "max-h-0"
          } md:hidden overflow-hidden transition-all duration-300 ease-out`}
        >
          <div className="px-4 pb-4 pt-2 space-y-2">
            {["articles", "create", "words", "settings"].map(
              (view) => (
                <Link
                  key={view}
                  href={`/${view === "articles" ? "" : view}`}
                  className={`block px-4 py-3 rounded-xl text-base font-medium ${
                    currentView === view
                      ? "text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100/30 dark:hover:bg-gray-700/20"
                  } transition-colors duration-200 backdrop-blur-sm`}
                >
                  {view
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto p-4 w-full">
        {currentView === "articles" && (
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
