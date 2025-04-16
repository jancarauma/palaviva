import ArticleItem from "@/components/HomePage/ArticleItem";
import { IArticle } from "@/lib/db/types";

export default function ArticleListView({
  articles,
  searchQuery,
  targetLanguageName,
  onDelete,
  onSearch,
}: {
  articles: IArticle[];
  searchQuery: string;
  targetLanguageName: string;
  onDelete: (id: number) => void;
  onSearch: (query: string) => void;
}) {
  return (
    <div className="min-h-full bg-gradient-to-b from-purple-50/30 via-blue-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center relative">
          {/* Animated background elements */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-100/50 dark:bg-purple-900/20 rounded-full blur-3xl opacity-40 animate-float" />
          
          <div className="relative space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4">
              {targetLanguageName ? (
                <>
                  Explore <span className="italic">{targetLanguageName}</span> Texts
                </>
              ) : (
                "Your Language Library"
              )}
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Immerse yourself in curated content. Search, organize, and analyze your{" "}
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {targetLanguageName.toLowerCase() || "target language"}
              </span>{" "}
              learning materials.
            </p>

            {/* Enhanced Search Bar */}
            <div className="relative max-w-2xl mx-auto mt-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-colors duration-200"
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
                onChange={(e) => onSearch(e.target.value)}
                className="w-full px-5 py-3.5 pl-12 text-sm border-0 rounded-xl bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm ring-1 ring-gray-200/30 dark:ring-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500 dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100/50 dark:border-gray-700/30 shadow-sm">
            <div className="inline-flex flex-col items-center justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 text-purple-500 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Start Your Collection
              </h3>
              <p className="mb-8 text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                Begin your language journey by adding your first text content.
                We&apos;ll help you analyze and learn from it effectively.
              </p>
              <button
                onClick={() => (window.location.href = "/create")}
                className="inline-flex items-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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
                Create First Text
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleItem
                key={article.article_id}
                article={article}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}