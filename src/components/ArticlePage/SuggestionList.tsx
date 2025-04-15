// components/SuggestionsList.tsx
"use client";

import { IWord } from "@/lib/db/types"; // Adjust import path as needed

interface SuggestionsListProps {
  suggestions: string[];
  selectedWord: IWord;
  onUpdate: (updatedWord: IWord) => void;
}

export const SuggestionsList = ({
  suggestions,
  selectedWord,
  onUpdate,
}: SuggestionsListProps) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {suggestions.length > 1 ? "Suggestions" : "Suggestion"}
      </label>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((translation, index) => (
          <button
            key={index}
            onClick={() => {
              const updatedWord = {
                ...selectedWord,
                translation,
              };
              onUpdate(updatedWord);
            }}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {translation}
          </button>
        ))}
      </div>
    </div>
  );
};