import React from "react";

interface LearningProgressProps {
  known: number;
  total: number;
}

export const LearningProgress: React.FC<LearningProgressProps> = ({
  known,
  total,
}) => {
  const progress = total > 0 ? (known / total) * 100 : 0;
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        {/*<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Learning Progress:
        </span>*/}
        <span className="px-1 text-sm text-gray-500 dark:text-gray-400">
          {known} / {total} words known
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
