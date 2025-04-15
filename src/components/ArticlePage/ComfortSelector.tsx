// components/ArticlePage/ComfortLevelSelector.tsx
"use client";

import { IWord } from "@/lib/db/types";

interface ComfortLevelSelectorProps {
  selectedWord: IWord;
  onUpdate: (updatedWord: IWord) => Promise<void>;
  getComfortLevelName: (level: number) => string;
}

export const ComfortLevelSelector = ({
  selectedWord,
  onUpdate,
  getComfortLevelName,
}: ComfortLevelSelectorProps) => {
  const getComfortClass = (num: number) => {
    if (num === 5) return "bg-green-100 dark:bg-green-700/80 hover:bg-green-900/30";
    if (num === 4) return "bg-blue-100 dark:bg-blue-700/80 hover:bg-blue-900/30";
    if (num === 3) return "bg-yellow-100 dark:bg-yellow-700/80 hover:bg-yellow-900/30";
    if (num === 2) return "bg-red-100 dark:bg-red-700/80 hover:bg-red-900/30";
    return "bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-900/30";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Comfort Level
      </label>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            onClick={async () => {
              const updatedWord = { ...selectedWord, comfort: num };
              try {
                await onUpdate(updatedWord);
              } catch (error) {
                console.error("Error updating comfort:", error);
              }
            }}
            className={`p-3 cursor-pointer rounded-lg text-sm font-medium transition-all ${
              selectedWord.comfort === num ? "ring-2 ring-purple-500" : ""
            } ${getComfortClass(num)}`}
          >
            {num} - {getComfortLevelName(num)}
          </button>
        ))}
      </div>
    </div>
  );
};