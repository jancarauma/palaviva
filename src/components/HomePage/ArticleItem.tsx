import Link from "next/link";
import { IArticle } from "@/lib/db/types";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Trash2, AlertTriangle } from "react-feather";
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
  const [isHovered, setIsHovered] = useState(false);
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
    <div
      className="group relative bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 
                hover:shadow-md transition-all duration-200 ease-out cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <Link
            href={`/article/${article.article_id}`}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label={`Open article: ${article.name}`}
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
              {article.name}
            </h3>
            <p className="text-sm italic text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
              {article.original}
            </p>
          </Link>

          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
            <DocumentTextIcon className="w-4 h-4" aria-hidden="true" />
            <span>{article.word_count} words</span>
            <ClockIcon className="w-4 h-4" aria-hidden="true" />
            <span>
              {Math.ceil((article.word_count || 0) / 200)}
              {" min read"}
            </span>
            {isHovered && (
              <>
                <CalendarDaysIcon className="w-4 h-4" aria-hidden="true" />
                <time dateTime={article.date_created.toString()}>
                  {formatDate(article.date_created)}
                </time>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            className={`cursor-pointer flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-all
              ${
                confirmDelete
                  ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800/80 dark:text-red-200"
                  : "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
              }`}
            aria-label={confirmDelete ? "Confirm deletion" : "Delete article"}
          >
            {confirmDelete ? (
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{confirmDelete ? "Confirm" : "Delete"}</span>
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div
          role="tooltip"
          className="absolute -top-2 right-0 px-2 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 text-xs rounded-full animate-pulse"
        >
          Click again to confirm
        </div>
      )}
    </div>
  );
}
