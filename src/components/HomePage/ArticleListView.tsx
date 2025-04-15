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
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="mb-8 text-4xl font-bold text-gray-800 dark:text-white mb-3">
            {targetLanguageName
              ? `Your ${targetLanguageName} Texts`
              : "Loading Texts..."}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Explore your saved language learning materials. Search, organize,
            and manage your articles in{" "}
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
              onChange={(e) => onSearch(e.target.value)}
              className="w-full px-4 py-3 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700  dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500  transition-all duration-200"
            />
          </div>
        </div>

        {articles.length === 0 ? (
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
              <button
                className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline cursor-pointer transition-colors"
                onClick={() => (window.location.href = "/getting-started")}
              >
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
                Getting Started
              </button>{" "}
              or{" "}
              <button
                className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline cursor-pointer transition-colors"
                onClick={() => (window.location.href = "/best-practices")}
              >
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
                Best Practices
              </button>
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
              Create New Text
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
