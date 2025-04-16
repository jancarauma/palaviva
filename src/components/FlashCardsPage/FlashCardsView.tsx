"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
//import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { db } from "@/lib/db/schema";
import { IArticle, IWord } from "@/lib/db/types";
import { CircularProgress } from "./CircularProgress";

type FlashcardType = {
  type: "translation" | "fillIn";
  question: string;
  answer: string;
  options: string[];
  ttsContent: string;
  context?: string;
};

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-ES",
  fr: "fr-FR",
};

export default function FlashcardsView({ id }: { id: string }) {
  //const router = useRouter();
  const [article, setArticle] = useState<IArticle | null>(null);
  const [words, setWords] = useState<IWord[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userNativeLang, setUserNativeLang] = useState("en");
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const settings = await db.settings.get(1);
      if (settings) setUserNativeLang(settings.user["native-lang"] || "en");
      console.info("Native lang:", userNativeLang);

      const art = await db.articles.get(Number(id));
      const wordsDB = await db.words
        .where("language")
        .equals(art?.language || "")
        .toArray();

      if (art) {
        setArticle(art);
        setWords(wordsDB);
        generateFlashcards(art, wordsDB);
        console.info("Words:", words.length);

        //if (art.flashcard_progress) {
        //  setCurrentCard(art.flashcard_progress);
        //}
      }
    };

    loadData();
    synthesisRef.current = window.speechSynthesis;
  }, [id]);

  const generateFlashcards = (article: IArticle, words: IWord[]) => {
    const generated: FlashcardType[] = [];
    const articleWords = article.original.split(/\s+/);
    const sentences = article.original.split(/[.!?]+/g).filter((s) => s.trim());

    const translationWords = words
      .filter((w) => w.translation)
      .sort((a, b) => a.comfort - b.comfort)
      .slice(0, 10);

    translationWords.forEach((word) => {
      const potentialWrongOptions = words.filter(
        (w) =>
          w.id !== word.id &&
          w.comfort === word.comfort &&
          w.translation?.trim()
      );

      if (potentialWrongOptions.length >= 1) {
        const wrongTranslations = potentialWrongOptions
          .map((w) => w.translation!)
          .filter((t, i, arr) => arr.indexOf(t) === i);

        const selectedWrong = wrongTranslations
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(3, wrongTranslations.length));

        const finalOptions = [...selectedWrong, word.translation!].sort(
          () => Math.random() - 0.5
        );

        if (finalOptions.length >= 2) {
          generated.push({
            type: "translation",
            question: word.name,
            answer: word.translation!,
            options: finalOptions,
            ttsContent: word.name,
          });
        }
      }
    });

    sentences.slice(0, 10).forEach((sentence) => {
      const tokens = sentence.trim().split(/\s+/);
      if (tokens.length < 4) return;

      const targetIndex = Math.floor(Math.random() * (tokens.length - 2)) + 1;
      const answerWord = tokens[targetIndex];
      const cleanWord = answerWord.replace(/[^a-zA-ZÀ-ÿ]/g, "");

      if (cleanWord.length < 3) return;

      const similarWords = articleWords
        .filter((w) => {
          const cleanW = w.replace(/[^a-zA-ZÀ-ÿ]/g, "");
          return cleanW !== cleanWord && cleanW.length >= 3;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)
        .map((w) => w.replace(/[^a-zA-ZÀ-ÿ]/g, ""));

      generated.push({
        type: "fillIn",
        question: tokens
          .map((w, i) => (i === targetIndex ? "_____" : w))
          .join(" "),
        answer: cleanWord,
        options: [...similarWords, cleanWord].sort(() => Math.random() - 0.5),
        ttsContent: sentence,
        context: sentence,
      });
    });

    setFlashcards(generated.sort(() => Math.random() - 0.5).slice(0, 15));
  };

  const handleAnswer = (answer: string) => {
    setSelectedOption(answer);
    const isCorrect = answer === flashcards[currentCard].answer;
    setShowAnswer(true);

    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      setShowAnswer(false);
      setSelectedOption(null);
      if (currentCard < flashcards.length - 1) {
        const newCard = currentCard + 1;
        setCurrentCard(newCard);
        //db.articles.update(Number(id), { flashcard_progress: newCard });
      }
    }, 2500);
  };

  const playSound = (text: string) => {
    if (!article || !synthesisRef.current) return;

    const langKey = article.language.split("-")[0] || "en";
    const targetLang = LANG_MAP[langKey] || article.language;
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find((v) => v.lang.startsWith(targetLang));

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = langKey === "en" ? 1.0 : 0.95;
    utterance.pitch = langKey === "en" ? 1.0 : 1.05;

    synthesisRef.current.cancel();
    synthesisRef.current.speak(utterance);
  };

  if (!article)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.div whileHover={{ x: -2 }}>
            <Link
              href={`/article/${id}`}
              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Back to Texts
            </Link>
          </motion.div>
          {/*((currentCard + 1) < flashcards.length) && (<div className="text-lg font-semibold text-purple-500">
            Score: {score} of {flashcards.length - 1}
          </div>)*/}
        </div>

        {currentCard + 1 < flashcards.length && (
          <div className="flex justify-between mb-6">
            <button
              onClick={() => {
                setCurrentCard((prev) => Math.max(0, prev - 1));
                setShowAnswer(false);
                setSelectedOption(null);
              }}
              disabled={currentCard === 0}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous Card
            </button>

            <button
              onClick={() => {
                setCurrentCard((prev) =>
                  Math.min(flashcards.length - 1, prev + 1)
                );
                setShowAnswer(false);
                setSelectedOption(null);
              }}
              disabled={currentCard + 1 === flashcards.length - 1}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Card
            </button>
          </div>
        )}

        {currentCard + 1 < flashcards.length ? (
          <motion.div
            key={currentCard}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      ((currentCard + 1) / (flashcards.length - 1)) * 100
                    }%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-gray-600 dark:text-gray-400">
                  Card {currentCard + 1} of {flashcards.length - 1}
                </div>
                <button
                  onClick={() => playSound(flashcards[currentCard].ttsContent)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <SpeakerWaveIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">
                {flashcards[currentCard].type === "translation"
                  ? flashcards[currentCard].question
                  : flashcards[currentCard].question
                      .split("_____")
                      .map((part, i) => (
                        <React.Fragment key={i}>
                          {part}
                          {i === 0 && <span className="underline">_____</span>}
                        </React.Fragment>
                      ))}
              </h2>

              {/*flashcards[currentCard].context && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 italic">
                  "{flashcards[currentCard].context}"
                </p>
              )*/}
            </div>

            <div className="text-center mb-4">
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 text-center font-semibold dark:text-white"
                  >
                    {selectedOption === flashcards[currentCard].answer ? (
                      <span className="text-green-600 dark:text-green-400">
                        ✓ Correct!
                      </span>
                    ) : (
                      <div>
                        <span className="text-red-600 dark:text-red-400">
                          ✗ Incorrect.{" "}
                        </span>
                        <span>Answer: </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {flashcards[currentCard].answer}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcards[currentCard].options.map((option, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  disabled={showAnswer}
                  whileHover={{ scale: selectedOption ? 1 : 1.02 }}
                  whileTap={{ scale: selectedOption ? 1 : 0.98 }}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedOption === option
                      ? option === flashcards[currentCard].answer
                        ? "bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-200"
                        : "bg-red-100 dark:bg-red-800 text-red-900 dark:text-red-200"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  } ${
                    selectedOption ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700"
          >
            {/* Victory Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 150 }}
              className="mx-auto mb-6"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
                <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-300">
                Well Done!
              </h2>

              <div className="flex items-center justify-center space-x-4">
                <div className="relative">
                  <CircularProgress
                    value={(score / flashcards.length) * 100}
                    className="h-24 w-24 text-blue-500"
                    strokeWidth={8}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold dark:text-white">
                      {Math.round((score / flashcards.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
                {score} out of {flashcards.length} correct answers
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCurrentCard(0);
                    setScore(0);
                  }}
                  className="px-8 py-3 cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Retry Challenge
                </motion.button>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={`/article/${id}`}
                    className="inline-block px-8 py-3 cursor-pointer bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Return to Article
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Floating Confetti Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-sm"
                  initial={{
                    scale: 0,
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0.5, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: "anticipate",
                  }}
                  style={{
                    top: `${Math.random() * 20}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
