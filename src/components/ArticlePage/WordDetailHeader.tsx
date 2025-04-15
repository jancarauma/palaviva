// components/WordDetailHeader.tsx
"use client";

import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { IWord } from "@/lib/db/types"; 

interface WordDetailHeaderProps {
  selectedWord: IWord;
  onClose: () => void;
  onPlayPronunciation: () => void;
}

export const WordDetailHeader = ({
  selectedWord,
  onClose,
  onPlayPronunciation,
}: WordDetailHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-semibold dark:text-gray-100">
          {selectedWord.name}
        </h3>
        <button
          onClick={onPlayPronunciation}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          title="Listen"
        >
          <SpeakerWaveIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
        </button>
      </div>
      <button
        onClick={onClose}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl cursor-pointer"
      >
        &times;
      </button>
    </div>
  );
};