"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/schema";
import { IArticle, IWord } from "@/lib/db/types";
import { PauseIcon, PlayIcon, SpeakerWaveIcon } from "@/components/Icons";
import { getComfortLevelName } from "@/lib/utils";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function ArticleView({ id }: { id: string }) {
  const router = useRouter();
  const [article, setArticle] = useState<IArticle | null>(null);
  const [words, setWords] = useState<IWord[]>([]);
  const [wordFrequency, setWordFrequency] = useState<Map<string, number>>(
    new Map()
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedWord, setSelectedWord] = useState<IWord | null>(null);
  //const [showMarkAll, setShowMarkAll] = useState(0);
  const [languageSettings, setLanguageSettings] = useState<{
    text_splitting_regex: string;
    word_regex: string;
  }>({
    text_splitting_regex: "\\s+",
    word_regex: "\\p{L}+",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const pageSize = 500;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(
    null
  );
  const speechSynthesis = useRef<SpeechSynthesis>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );
  const [wordOffsets, setWordOffsets] = useState<number[]>([]);
  const wordOffsetsRef = useRef<number[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const cleanWord = (rawWord: string): string => {
    if (!languageSettings) return "";

    const normalized = rawWord.normalize("NFD");

    const trimmed = normalized.replace(
      /^[\p{P}\p{S}\p{N}]+|[\p{P}\p{S}\p{N}]+$/gu,
      ""
    );

    const isValid = languageSettings.word_regex
      ? new RegExp(languageSettings.word_regex, "u").test(trimmed)
      : trimmed.length > 0;

    return isValid ? trimmed.toLowerCase() : "";
  };

  useEffect(() => {
    const loadBaseData = async () => {
      const [art] = await Promise.all([db.articles.get(Number(id))]);

      if (!art) {
        router.push("/");
        return;
      }

      const [lang] = await Promise.all([
        db.languages.where("iso_639_1").equals(art.language).first(),
      ]);

      return { art, lang };
    };

    loadBaseData().then((data) => {
      if (!data) return;

      const { art, lang } = data;
      setArticle(art);
      setLanguageSettings({
        text_splitting_regex: lang?.text_splitting_regex || "\\s+",
        word_regex: lang?.word_regex || "",
      });

      db.words
        .where("language")
        .equals(art.language)
        .toArray()
        .then((allWords) => {
          setWords(allWords);

          const articleWordIds = art.word_ids
            .split("$")
            .filter(Boolean)
            .map(Number);
          const newIds = allWords
            .filter((word) => articleWordIds.includes(word.id!))
            .map((word) => word.id!.toString())
            .join("$");

          if (newIds !== art.word_ids) {
            db.articles.update(art.article_id!, { word_ids: newIds });
          }
        });
    });
  }, [id, router]);

  useEffect(() => {
    if (!article || !languageSettings) return;

    const processText = () => {
      const frequencyMap = new Map<string, number>();
      const splitRegex = new RegExp(
        languageSettings.text_splitting_regex,
        "gu"
      );

      article.original.split(splitRegex).forEach((rawWord) => {
        const cleaned = cleanWord(rawWord);
        if (cleaned)
          frequencyMap.set(cleaned, (frequencyMap.get(cleaned) || 0) + 1);
      });

      setWordFrequency(frequencyMap);
    };

    processText();
  }, [
    article?.article_id,
    languageSettings?.text_splitting_regex,
    languageSettings?.word_regex,
  ]);

  useEffect(() => {
    if (!article) return;

    const text = article.original;
    const tokens = splitText(text);

    const offsets: number[] = [];
    let currentPos = 0;
    tokens.forEach((token) => {
      offsets.push(currentPos);
      currentPos += token.length + 1;
    });
    setWordOffsets(offsets);
    wordOffsetsRef.current = offsets;

    const langMap: { [key: string]: string } = {
      en: "en-US",
      pt: "pt-BR",
      es: "es-ES",
      fr: "fr-FR",
    };

    const targetLang =
      langMap[article.language.split("-")[0]] || article.language;
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();

    const preferredVoices = voices.filter(
      (voice) =>
        voice.lang === targetLang ||
        voice.lang.startsWith(targetLang.split("-")[0])
    );

    const u = new SpeechSynthesisUtterance(text);

    if (preferredVoices.length > 0) {
      u.voice = preferredVoices[0];
    }

    u.lang = targetLang;
    u.rate = 0.9;
    u.pitch = 1.2;

    switch (targetLang.split("-")[0]) {
      case "en":
        u.rate = 1.1;
        u.pitch = 1.0;
        break;
      case "pt":
        u.rate = 0.9;
        break;
    }

    u.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        const offsets = wordOffsetsRef.current;

        let low = 0,
          high = offsets.length - 1;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (offsets[mid] <= charIndex) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        const wordIndex = high;

        if (wordIndex >= 0 && wordIndex < tokens.length) {
          setCurrentWordIndex(wordIndex);

          const page = Math.floor(wordIndex / pageSize);
          if (page !== currentPage) {
            setCurrentPage(page);
            containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
          }

          setTimeout(() => {
            const elements = containerRef.current?.getElementsByTagName("span");
            if (elements?.[wordIndex - page * pageSize]) {
              elements[wordIndex - page * pageSize].scrollIntoView({
                block: "center",
                behavior: "smooth",
              });
            }
          }, 0);
        }
      }
    };

    setUtterance(u);
  }, [article, currentPage, pageSize]);

  useEffect(() => {
    wordOffsetsRef.current = wordOffsets;
  }, [wordOffsets]);

  useEffect(() => {
    setCurrentWordIndex(-1);
  }, [currentPage]);

  const togglePlayback = () => {
    if (!utterance || !speechSynthesis.current) return;

    if (isPlaying) {
      speechSynthesis.current.pause();
      setIsPlaying(false);
    } else {
      if (speechSynthesis.current.paused) {
        speechSynthesis.current.resume();
      } else {
        if (currentWordIndex >= wordsArray.length - 1) {
          setCurrentWordIndex(-1);
        }
        speechSynthesis.current.cancel();
        speechSynthesis.current.speak(utterance);
      }
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log("Available voices:", voices);
        setVoicesLoaded(true);
      };

      window.speechSynthesis.onvoiceschanged = updateVoices;
      updateVoices();

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      speechSynthesis.current = window.speechSynthesis;
      const loadVoices = () => {
        setVoicesLoaded(true);
      };

      speechSynthesis.current.onvoiceschanged = loadVoices;
      return () => {
        speechSynthesis.current!.onvoiceschanged = null;
      };
    }
  }, []);

  const splitText = (text: string) => {
    if (!languageSettings) return [];

    try {
      const wordPattern = languageSettings.word_regex
        ? languageSettings.word_regex.replace(/^\^|\$$/g, "")
        : "\\p{L}+"; // Fallback

      const tokenRegex = new RegExp(`(${wordPattern})|([\\p{P}\\p{S}])`, "gui");

      return text.match(tokenRegex) || [];
    } catch (e) {
      console.error("Regex inválida, usando fallback", e);
      return text.split(/(\p{L}+)/giu).filter(Boolean);
    }
  };

  const handlePageChange = async (direction: "prev" | "next") => {
    if (!article || !languageSettings) return;

    const wordsArray = splitText(article.original);
    const totalPages = Math.ceil(wordsArray.length / pageSize);
    const newPage = direction === "next" ? currentPage + 1 : currentPage - 1;

    if (newPage >= 0 && newPage < totalPages) {
      try {
        await db.articles.update(article.article_id!, {
          current_page: newPage,
        });
        setCurrentPage(newPage);
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Error updating page:", error);
      }
    }
  };

  //const markAllKnown = async () => {
  //  if (showMarkAll === 0) {
  //    setShowMarkAll(1);
  //  } else {
  //    try {
  //      await Promise.all(
  //        words.map((word) => db.words.update(word.id!, { comfort: 5 }))
  //      );
  //      //setWords(prev => prev.map(w => ({ ...w, comfort: 5 })));
  //      setShowMarkAll(0);
  //    } catch (error) {
  //      console.error("Error marking all as known:", error);
  //    }
  //  }
  //};

  if (!article || !languageSettings) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const wordsArray = splitText(article.original);
  const wordsUnique = new Set(
    wordsArray.map(word => {
        const cleanedWord = word.replace(/^[^a-zA-ZÀ-ÿ]+|[^a-zA-ZÀ-ÿ]+$/g, '');
        return cleanedWord.toLowerCase();
    })
  );
  //const totalWords = wordsArray.length;
  const totalWords = wordsUnique.size;
  //const knownWords = words.filter((w) => w?.comfort >= 4).length;
  const knownWords = words.filter(w => w?.comfort >= 4).length; //(all known words)
  const startIdx = currentPage * pageSize;
  const endIdx = startIdx + pageSize;
  const wordsToShow = wordsArray.slice(startIdx, endIdx);
  const totalPages = Math.ceil(totalWords / pageSize);
  const progress = (knownWords / totalWords) * 100;

  const handleWordClick = async (rawWord: string) => {
    if (!languageSettings || !article) return;

    const cleanedWord = cleanWord(rawWord);
    if (!cleanedWord) return;

    try {
      const existingWord = words.find(
        (w) =>
          w.name.localeCompare(cleanedWord, undefined, {
            sensitivity: "base",
          }) === 0
      );

      if (existingWord) {
        setSelectedWord(existingWord);

        if (!article.word_ids.includes(existingWord.id!.toString())) {
          const updatedIds = `${article.word_ids}${existingWord.id}$`;
          await db.articles.update(article.article_id!, {
            word_ids: updatedIds,
          });
          setArticle((prev) =>
            prev ? { ...prev, word_ids: updatedIds } : null
          );
        }
        return;
      }

      // Create a new word
      const newWord: IWord = {
        name: cleanedWord,
        slug: cleanedWord.toLowerCase(),
        comfort: 0,
        language: article.language,
        is_not_a_word: false,
        count: wordFrequency.get(cleanedWord) || 0,
        date_created: Date.now(),
      };

      const id = await db.words.add(newWord);
      const updatedArticleIds = `${article.word_ids}${id}$`;

      setWords((prev) => [...prev, { ...newWord, id }]);
      setSelectedWord({ ...newWord, id });

      await db.articles.update(article.article_id!, {
        word_ids: updatedArticleIds,
      });
      setArticle((prev) =>
        prev ? { ...prev, word_ids: updatedArticleIds } : null
      );
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  const playPronunciation = () => {
    if (!selectedWord || !article || typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    if (!synth) {
      alert("Text-to-speech not available!");
      return;
    }

    const langMap: { [key: string]: string } = {
      en: "en-US",
      pt: "pt-BR",
      es: "es-ES",
      fr: "fr-FR",
    };

    const targetLang =
      langMap[article.language.split("-")[0]] || article.language;

    const voices = synth.getVoices();

    const preferredVoices = voices.filter(
      (voice) =>
        voice.lang === targetLang ||
        voice.lang.startsWith(targetLang.split("-")[0])
    );

    if (preferredVoices.length === 0) {
      console.info(`Voice not available for ${targetLang}`);
      //return;
    }

    const utterance = new SpeechSynthesisUtterance(selectedWord.name);
    utterance.voice = preferredVoices[0];
    utterance.lang = targetLang;
    utterance.rate = 0.9;
    utterance.pitch = 1.2;

    switch (targetLang.split("-")[0]) {
      case "en":
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        break;
      case "pt":
        utterance.rate = 0.9;
        break;
    }

    synth.cancel();
    synth.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <Link
            href="/"
            className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            Back to Texts
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/*<span className="text-sm">
              Known words: {knownWords}/{totalWords} (
              {((knownWords / totalWords) * 100).toFixed(1)}%)
            </span>
            <button
              onClick={markAllKnown}
              className={`px-3 py-1 rounded-md ${
                showMarkAll === 1
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {showMarkAll === 0 ? "Mark all known?" : "Confirm"}
            </button>*/}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Learning Progress: 
                </span>
                <span className="px-1 text-sm text-gray-500 dark:text-gray-400">
                  {knownWords}/{totalWords} words
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {voicesLoaded && (
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayback}
                  className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  {isPlaying ? (
                    <>
                      <PauseIcon className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      Play
                    </>
                  )}
                </button>
                {/*<span className="text-sm text-gray-600">
                Lang: {article.language.toUpperCase()}
              </span>*/}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Article Section */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h1 className="text-xl md:text-2xl font-bold mb-4">
              {article.name}
            </h1>

            <div
              ref={containerRef}
              className="prose dark:prose-invert max-w-none mb-6 h-[50vh] sm:h-[60vh] overflow-y-auto text-base sm:text-lg"
            >
              {!article && (
                <div className="text-gray-500">Loading article...</div>
              )}
              {article &&
                wordsToShow.map((token, index) => {
                  const cleanedWord = cleanWord(token);
                  const isWord = cleanedWord !== "";
                  const wordData = isWord
                    ? words.find(
                        (w) =>
                          w.name.localeCompare(cleanedWord, undefined, {
                            sensitivity: "base",
                          }) === 0
                      )
                    : null;
                  const comfort = wordData?.comfort || 0;

                  const isWordAdd = isWord ? 0 : 2;
                  const globalIndex = startIdx + index + isWordAdd;
                  const isCurrentWord = globalIndex === currentWordIndex;

                  return (
                    <span
                      key={`${token}-${index}`}
                      className={`px-1 rounded ${
                        isWord
                          ? "cursor-pointer hover:underline hover:bg-gray-100"
                          : ""
                      } ${
                        isCurrentWord && isWord
                          ? "bg-yellow-200 scale-105 shadow-md"
                          : ""
                      } ${
                        comfort === 5
                          ? "bg-green-100"
                          : comfort === 4
                          ? "bg-blue-100"
                          : comfort === 3
                          ? "bg-yellow-100"
                          : comfort === 2
                          ? "bg-red-100"
                          : ""
                      } ${
                        selectedWord && wordData?.id === selectedWord.id
                          ? "ring-2 ring-purple-500 scale-110"
                          : ""
                      }`}
                      style={{
                        transition: "background-color 50ms ease-in-out",
                      }}
                      onClick={
                        isWord ? () => handleWordClick(token) : undefined
                      }
                    >
                      {" "}
                      {token}{" "}
                    </span>
                  );
                })}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center border-t pt-6 border-gray-100 dark:border-gray-700">
              <button
                onClick={() => handlePageChange("prev")}
                disabled={currentPage === 0}
                className="px-6 cursor-pointer py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
              >
                Previous Page
              </button>
              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange("next")}
                disabled={currentPage === totalPages - 1}
                className="px-6 cursor-pointer py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
              >
                Next Page
              </button>
            </div>
          </div>

          {/* Translation Sidebar */}
          <AnimatePresence>
            {selectedWord && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 h-[60vh] lg:h-[80vh] flex flex-col sticky top-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold dark:text-gray-100">
                      {selectedWord.name}
                    </h3>
                    <button
                      onClick={playPronunciation}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                      title="Listen"
                    >
                      <SpeakerWaveIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Translation
                    </label>
                    <input
                      type="text"
                      value={selectedWord.translation || ""}
                      onChange={async (e) => {
                        const newTranslation = e.target.value;
                        const updatedWord = {
                          ...selectedWord,
                          translation: newTranslation,
                        };
                        setSelectedWord(updatedWord);
                        setWords((prev) =>
                          prev.map((w) =>
                            w.id === updatedWord.id ? updatedWord : w
                          )
                        );
                        try {
                          await db.words.update(updatedWord.id!, {
                            translation: newTranslation,
                          });
                        } catch (error) {
                          console.error("Error saving translation:", error);

                          setSelectedWord(selectedWord);
                          setWords((prev) =>
                            prev.map((w) =>
                              w.id === selectedWord.id ? selectedWord : w
                            )
                          );
                        }
                      }}
                      placeholder="Add translation..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Comfort Level
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={async () => {
                            const updatedWord = {
                              ...selectedWord,
                              comfort: num,
                            };
                            setSelectedWord(updatedWord);
                            setWords((prev) =>
                              prev.map((w) =>
                                w.id === updatedWord.id ? updatedWord : w
                              )
                            );

                            try {
                              await db.words.update(updatedWord.id!, {
                                comfort: num,
                              });
                            } catch (error) {
                              console.error("Error updating comfort:", error);

                              setSelectedWord(selectedWord);
                              setWords((prev) =>
                                prev.map((w) =>
                                  w.id === selectedWord.id ? selectedWord : w
                                )
                              );
                            }
                          }}
                          className={`p-3 cursor-pointer rounded-lg text-sm font-medium transition-all ${
                            selectedWord.comfort === num
                              ? "bg-purple-600 text-white"
                              : num === 5
                              ? "bg-green-100 hover:bg-green-300"
                              : num === 4
                              ? "bg-blue-100 hover:bg-blue-300"
                              : num === 3
                              ? "bg-yellow-100 hover:bg-yellow-300"
                              : num === 2
                              ? "bg-red-100 hover:bg-red-300"
                              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {num} - {getComfortLevelName(num)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/*<div className="flex-1">
                    <iframe
                      src={`https://translate.google.com/?sl=${article.language}&tl=en&text=${encodeURIComponent(selectedWord.name)}`}
                      className="w-full h-48 border rounded mt-4"
                      title="Google Translate"
                    />
                  </div>*/}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
