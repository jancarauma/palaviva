// components/ArticlePage/TranslationInput.tsx
"use client";

import { IWord } from "@/lib/db/types";

interface TranslationInputProps {
  selectedWord: IWord;
  loadingSuggestions: boolean;
  onUpdate: (updatedWord: IWord) => Promise<void>;
}

export const TranslationInput = ({
  selectedWord,
  loadingSuggestions,
  onUpdate,
}: TranslationInputProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Translation
      </label>
      <div className="relative">
        <input
          type="text"
          value={selectedWord.translation || ""}
          onChange={async (e) => {
            const newTranslation = e.target.value;
            const updatedWord = {
              ...selectedWord,
              translation: newTranslation,
            };
            await onUpdate(updatedWord);
          }}
          placeholder="Add translation..."
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        {loadingSuggestions && (
          <div className="absolute right-3 top-3.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};