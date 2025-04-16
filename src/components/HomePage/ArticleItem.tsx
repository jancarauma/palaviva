import Link from "next/link";
import { IArticle } from "@/lib/db/types";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, ChevronRight } from "react-feather";
import {
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function ArticleItem({
  article,
  onDelete,
}: {
  article: IArticle;
  onDelete: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const handleDelete = () => {
    if (!confirmDelete) {
      const id = setTimeout(() => setConfirmDelete(false), 3000);
      setTimeoutId(id);
      setConfirmDelete(true);
    } else {
      onDelete(article.article_id!);
    }
  };

  return (
    <div className="relative group">
      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 dark:from-purple-400/5 dark:to-pink-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200/30 dark:border-gray-700/30 hover:border-purple-200/50 dark:hover:border-purple-400/20 hover:shadow-lg transition-all duration-300 ease-out">
        {/* Progress indicator (TODO) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-700/50 rounded-t-xl">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-xl transition-all duration-500" 
            style={{ width: `${Math.min((article.word_count || 0) / (article.word_count || 1) * 100, 100)}%` }}
          />
        </div>

        <div className="flex flex-col h-full justify-between">
          <Link
            href={`/article/${article.article_id}`}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
            aria-label={`Open article: ${article.name}`}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                {article.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4 transition-all duration-300 group-hover:opacity-90">
                {article.original}
              </p>
            </div>
          </Link>

          <div className="mt-auto">
            {/* Metadata Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="flex items-center space-x-1.5 text-sm text-purple-600 dark:text-purple-400">
                <DocumentTextIcon className="w-4 h-4" />
                <span>{article.word_count}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span>{Math.ceil((article.word_count || 0) / 200)}min</span>
              </div>
              <div className="flex items-center space-x-1.5 text-sm text-gray-600 dark:text-gray-400">
                <CalendarDaysIcon className="w-4 h-4" />
                <time dateTime={article.date_created.toString()}>
                  {formatDate(article.date_created)}
                </time>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center border-t border-gray-100/50 dark:border-gray-700/30 pt-4">
              <div className="flex items-center space-x-2">
                {/* Level indication (TODO) */}
                <span className="px-2 py-1 text-xs font-medium bg-purple-100/50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-full">
                  {/*article.difficulty || 'Intermediate'*/}
                  {'Intermediate'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDelete}
                  onBlur={() => setConfirmDelete(false)}
                  className={`relative flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all
                    ${
                      confirmDelete
                        ? "bg-red-100/80 text-red-600 hover:bg-red-200/80 dark:bg-red-800/50 dark:text-red-200 animate-shake"
                        : "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/30"
                    }`}
                  aria-label={confirmDelete ? "Confirm deletion" : "Delete article"}
                >
                  {confirmDelete ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="absolute top-2 right-2 px-3 py-1 bg-red-100/80 dark:bg-red-800/50 text-red-600 dark:text-red-200 text-xs rounded-full backdrop-blur-sm">
          Confirm deletion
        </div>
      )}
    </div>
  );
}