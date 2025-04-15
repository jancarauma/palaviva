import { IWord } from '@/lib/db/types';
import React from 'react';

interface WordTokenProps {
  token: string;
  index: number;
  isWord: boolean;
  comfort?: number;
  selectedWord?: IWord | null;
  wordData?: IWord | null | undefined ;
  isCurrentWord?: boolean;
  onWordClick?: (token: string) => void;
}

const WordToken: React.FC<WordTokenProps> = ({
  token,
  isWord,
  comfort,
  selectedWord,
  wordData,
  isCurrentWord,
  onWordClick,
}) => {
  return (
    <span
      className={`px-1 rounded 
        ${isWord ? "cursor-pointer hover:underline hover:bg-gray-100 dark:hover:bg-gray-900" : ""}
        ${
          comfort === 5
            ? "bg-green-100 dark:bg-green-900"
            : comfort === 4
            ? "bg-blue-100 dark:bg-blue-900"
            : comfort === 3
            ? "bg-yellow-100 dark:bg-yellow-900"
            : comfort === 2
            ? "bg-red-100 dark:bg-red-900"
            : ""
        }
        ${
          selectedWord && wordData?.id === selectedWord.id
            ? "ring-2 ring-purple-500"
            : ""
        }
        ${
          isCurrentWord && isWord
            ? "bg-orange-100 dark:bg-orange-900 shadow-md"
            : ""
        }`}
      style={{ transition: "background-color 50ms ease-in-out" }}
      onClick={isWord ? () => onWordClick?.(token) : undefined}
    >
      {" "}
      {token}{" "}
    </span>
  );
};

export default WordToken;