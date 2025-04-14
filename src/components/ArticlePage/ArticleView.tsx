"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

import { db } from "@/lib/db/schema";
import { IArticle, IWord } from "@/lib/db/types";
import { getComfortLevelName } from "@/lib/utils";
import { getTranslationSuggestions } from "@/lib/translation";
import { SpeakerWaveIcon } from "@/components/Icons";
import { LearningProgress } from "@/components/ArticlePage/LearningProgress";
import { PlaybackControls } from "@/components/ArticlePage/PlaybackControls";
import { PaginationControls } from "@/components/ArticlePage/PaginationControls";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-ES",
  fr: "fr-FR",
};

// -----------------------------------------------------------------------------
// ArticleView Component
// Displays paginated article text with TTS, word selection, and translation sidebar
// -----------------------------------------------------------------------------
export default function ArticleView({ id }: { id: string }) {
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );
  const wordOffsetsRef = useRef<number[]>([]);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [article, setArticle] = useState<IArticle | null>(null);
  const [pageSize, setPageSize] = useState(300);
  const [words, setWords] = useState<IWord[]>([]);
  const [wordFrequency, setWordFrequency] = useState<Map<string, number>>(
    new Map()
  );
  const [userNativeLang, setUserNativeLang] = useState("");
  const [languageSettings, setLanguageSettings] = useState<{
    text_splitting_regex: string;
    word_regex: string;
  }>({
    text_splitting_regex: "\\s+",
    word_regex: "\\p{L}+",
  });
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedWord, setSelectedWord] = useState<IWord | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(
    null
  );
  const [wordOffsets, setWordOffsets] = useState<number[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [panelExpanded, setPanelExpanded] = useState<boolean>(false);

  // Controls and Media Query
  const controls = useAnimation();
  const isMobile = useMediaQuery({ maxWidth: 1023 });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Cleans and normalizes a raw word string based on language regex.
   */
  const cleanWord = useCallback(
    (raw: string): string => {
      const { word_regex } = languageSettings;
      const normalized = raw.normalize("NFD");
      const trimmed = normalized.replace(
        /^[\p{P}\p{S}\p{N}]+|[\p{P}\p{S}\p{N}]+$/gu,
        ""
      );
      const isValid = word_regex
        ? new RegExp(word_regex, "u").test(trimmed)
        : trimmed.length > 0;
      return isValid ? trimmed.toLowerCase() : "";
    },
    [languageSettings]
  );

  /**
   * Splits text into tokens: words and punctuation.
   */
  const splitText = useCallback(
    (text: string): string[] => {
      const { word_regex } = languageSettings;
      try {
        const pattern = word_regex.replace(/^\^|\$$/g, "") || "\\p{L}+";
        const regex = new RegExp(`(${pattern})|([\\p{P}\\p{S}])`, "gui");
        return text.match(regex) || [];
      } catch {
        console.error("Invalid regex, using fallback split");
        return text.split(/(\p{L}+)/giu).filter(Boolean);
      }
    },
    [languageSettings]
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Load article, language settings, and words from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      const latestSettings = await db.settings.get(1);
      if (latestSettings) {
        setUserNativeLang(latestSettings?.user["native-lang"] || "pt");
        setPageSize(latestSettings?.user["page-size"] || 300);
      }

      const art = await db.articles.get(Number(id));

      if (!art) {
        router.push("/");
        return;
      }

      const lang = await db.languages
        .where("iso_639_1")
        .equals(art.language)
        .first();

      setArticle(art);
      setLanguageSettings({
        text_splitting_regex: lang?.text_splitting_regex || "\\s+",
        word_regex: lang?.word_regex || "",
      });

      const allWords = await db.words
        .where("language")
        .equals(art.language)
        .toArray();
      setWords(allWords);

      // Sync word_ids in article if out of date
      const storedIds = art.word_ids.split("$").filter(Boolean).map(Number);
      const validIds = allWords
        .filter((w) => storedIds.includes(w.id!))
        .map((w) => w.id!.toString());
      const newIds = validIds.join("$");
      if (newIds !== art.word_ids) {
        await db.articles.update(art.article_id!, { word_ids: newIds });
      }
    };

    loadData();
  }, [id, router]);

  // Compute word frequency map when article or settings change
  useEffect(() => {
    if (!article) return;
    const freq = new Map<string, number>();
    const splitRegex = new RegExp(languageSettings.text_splitting_regex, "gu");
    article.original.split(splitRegex).forEach((raw) => {
      const w = cleanWord(raw);
      if (w) freq.set(w, (freq.get(w) || 0) + 1);
    });
    setWordFrequency(freq);
  }, [article, cleanWord, languageSettings]);

  // Prepare speech utterance and calculate word offsets
  useEffect(() => {
    if (!article) return;
    const tokens = splitText(article.original);
    const offsets: number[] = [];
    let pos = 0;
    tokens.forEach((tok) => {
      offsets.push(pos);
      pos += tok.length + 1;
    });
    setWordOffsets(offsets);
    wordOffsetsRef.current = offsets;

    // Configure utterance
    const langKey = article.language.split("-")[0] || article.language;
    const targetLang = LANG_MAP[langKey] || article.language;
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const preferredVoices = voices.filter(
      (voice) =>
        voice.lang === targetLang ||
        voice.lang.startsWith(targetLang.split("-")[0])
    );
    const utter = new SpeechSynthesisUtterance(article.original);
    if (preferredVoices.length > 0) {
      utter.voice = preferredVoices[0];
    }
    utter.lang = targetLang;
    utter.rate = langKey === "en" ? 0.89 : 0.9;
    utter.pitch = langKey === "en" ? 1.19 : 1.2;

    utter.onboundary = (evt) => {
      if (evt.name === "word") {
        const idx = wordOffsetsRef.current.findIndex(
          (off, i, arr) => arr[i + 1] > evt.charIndex
        );
        if (idx >= 0) setCurrentWordIndex(idx);
      }
    };

    setUtterance(utter);
  }, [article, splitText]);

  // Keep ref in sync with wordOffsets
  useEffect(() => {
    wordOffsetsRef.current = wordOffsets;
  }, [wordOffsets]);

  // Reset currentWordIndex on page change
  useEffect(() => {
    setCurrentWordIndex(-1);
  }, [currentPage]);

  // Handle Escape key to close panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setSelectedWord(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Toggle body class when panel opens/closes on mobile
  useEffect(() => {
    document.body.classList.toggle("panel-open", !!selectedWord && isMobile);
  }, [selectedWord, isMobile]);

  // Fetch translation suggestions when a word is selected
  useEffect(() => {
    if (!selectedWord || !article) return;
    const targetLang = article.language.split("-")[0] || "en";
    setLoadingSuggestions(true);
    getTranslationSuggestions(selectedWord.name, targetLang, userNativeLang)
      .then(setSuggestions)
      .catch(console.error)
      .finally(() => setLoadingSuggestions(false));
  }, [selectedWord]);

  // Load available voices for TTS
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateVoices = () => {
      window.speechSynthesis.getVoices();
      setVoicesLoaded(true);
    };
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /** Toggles text-to-speech playback */
  const togglePlayback = () => {
    if (!utterance || !speechSynthesisRef.current) return;
    if (isPlaying) {
      speechSynthesisRef.current.pause();
    } else {
      if (speechSynthesisRef.current.paused) {
        speechSynthesisRef.current.resume();
      } else {
        speechSynthesisRef.current.cancel();
        speechSynthesisRef.current.speak(utterance);
      }
    }
    setIsPlaying(!isPlaying);
  };

  /** Handles pagination control clicks */
  const handlePageChange = async (direction: "prev" | "next") => {
    if (!article) return;
    const tokens = splitText(article.original);
    const total = Math.ceil(tokens.length / pageSize);
    const nextPage = direction === "next" ? currentPage + 1 : currentPage - 1;
    if (nextPage >= 0 && nextPage < total) {
      await db.articles.update(article.article_id!, { current_page: nextPage });
      setCurrentPage(nextPage);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /** Handles click on a word token */
  const handleWordClick = async (raw: string) => {
    if (!article) return;
    const cleaned = cleanWord(raw);
    if (!cleaned) return;

    const existing = words.find(
      (w) =>
        w.name.localeCompare(cleaned, undefined, { sensitivity: "base" }) === 0
    );

    if (existing) {
      setSelectedWord(existing);
      if (!article.word_ids.includes(existing.id!.toString())) {
        const updated = `${article.word_ids}${existing.id}$`;
        await db.articles.update(article.article_id!, { word_ids: updated });
        setArticle({ ...article, word_ids: updated });
      }
      return;
    }

    // Create and select new word
    const newWord: IWord = {
      name: cleaned,
      slug: cleaned,
      comfort: 0,
      language: article.language,
      is_not_a_word: false,
      count: wordFrequency.get(cleaned) || 0,
      date_created: Date.now(),
    };
    const newId = await db.words.add(newWord);
    const updatedIds = `${article.word_ids}${newId}$`;
    setWords((prev) => [...prev, { ...newWord, id: newId }]);
    setSelectedWord({ ...newWord, id: newId });
    await db.articles.update(article.article_id!, { word_ids: updatedIds });
    setArticle({ ...article, word_ids: updatedIds });
  };

  /** Plays pronunciation for selected word */
  const playPronunciation = () => {
    if (!selectedWord || !speechSynthesisRef.current) return;
    const langKey = article?.language.split("-")[0] || "en";
    const targetLang = LANG_MAP[langKey] || article!.language;
    const voices = speechSynthesisRef.current.getVoices();
    const preferred = voices.find((v) => v.lang.startsWith(targetLang));
    const utt = new SpeechSynthesisUtterance(selectedWord.name);
    if (preferred) utt.voice = preferred;
    utt.lang = targetLang;
    utt.rate = langKey === "en" ? 0.89 : 0.9;
    utt.pitch = langKey === "en" ? 1.19 : 1.2;
    speechSynthesisRef.current.cancel();
    speechSynthesisRef.current.speak(utt);
  };

  if (!article || !languageSettings) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const wordsArray = splitText(article.original);
  const wordsUnique = new Set(
    wordsArray.map((word) => {
      const cleanedWord = word.replace(/^[^a-zA-ZÀ-ÿ]+|[^a-zA-ZÀ-ÿ]+$/g, "");
      return cleanedWord.toLowerCase();
    })
  );
  //const totalWords = wordsArray.length;
  const totalWords = wordsUnique.size;
  //const knownWords = words.filter((w) => w?.comfort >= 4).length;
  const knownWords = words.filter((w) => w?.comfort >= 4).length; //(all known words)
  const startIdx = currentPage * pageSize;
  const endIdx = startIdx + pageSize;
  const wordsToShow = wordsArray.slice(startIdx, endIdx);
  const totalPages = Math.ceil(totalWords / pageSize);

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
            {/* Learning Progress */}
            <LearningProgress known={knownWords} total={totalWords} />

            {/* Playback Controls */}
            <PlaybackControls
              isPlaying={isPlaying}
              togglePlayback={togglePlayback}
              voicesLoaded={voicesLoaded}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Article Section */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="mb-4">
              <h1 className="text-xl md:text-2xl font-bold">
                {article.name} {/* Main title */}
              </h1>
              {article.source && (
                <h2 className="text-base md:text-lg text-gray-600 dark:text-gray-400 mt-2">
                  {article.source} {/* Subtitle */}
                </h2>
              )}
            </div>
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
                          ? "cursor-pointer hover:underline hover:bg-gray-100 dark:hover:bg-gray-900"
                          : ""
                      } ${
                        comfort === 5
                          ? "bg-green-100 dark:bg-green-900"
                          : comfort === 4
                          ? "bg-blue-100 dark:bg-blue-900"
                          : comfort === 3
                          ? "bg-yellow-100 dark:bg-yellow-900"
                          : comfort === 2
                          ? "bg-red-100 dark:bg-red-900"
                          : ""
                      } ${
                        selectedWord && wordData?.id === selectedWord.id
                          ? "ring-2 ring-purple-500"
                          : ""
                      } ${
                        isCurrentWord && isWord
                          ? "bg-orange-100 dark:bg-orange-900 shadow-md"
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

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={handlePageChange}
            />
          </div>

          {/* Translation Sidebar */}
          <AnimatePresence>
            {selectedWord && isMobile && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                role="presentation"
                className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40"
                onClick={() => setSelectedWord(null)}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {selectedWord && (
              <>
                {" "}
                {isMobile ? (
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="panel-heading"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(_, { offset, velocity }) => {
                      const shouldExpand = offset.y < -50 || velocity.y < -100;
                      const shouldCollapse = offset.y > 50 || velocity.y > 100;

                      if (shouldExpand) {
                        controls.start("expanded");
                        setPanelExpanded(true);
                      } else if (shouldCollapse) {
                        controls.start("collapsed");
                        setPanelExpanded(false);
                      } else {
                        controls.start(
                          panelExpanded ? "expanded" : "collapsed"
                        );
                      }
                    }}
                    animate={controls}
                    initial={false}
                    variants={{
                      expanded: { y: 0 },
                      collapsed: { y: "20%" },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 40,
                      mass: 0.5,
                    }}
                    className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl border-t border-gray-100 dark:border-gray-700 h-[85vh] max-h-screen flex flex-col z-50 focus:outline-none"
                    style={{ touchAction: "pan-y" }}
                    {...(isMobile && {
                      onClick: (e) => e.stopPropagation(),
                    })}
                  >
                    <div className="pt-3 pb-2 flex justify-center touch-pan-y">
                      <button
                        aria-label={
                          panelExpanded ? "Recolher painel" : "Expandir painel"
                        }
                        aria-expanded={panelExpanded}
                        className="w-16 h-2 bg-gray-300 dark:bg-gray-600 rounded-full cursor-grab active:cursor-grabbing focus:ring-2 focus:ring-purple-500"
                        onPointerDown={() => controls.stop()}
                        onClick={() => {
                          setPanelExpanded(!panelExpanded);
                          controls.start(
                            panelExpanded ? "collapsed" : "expanded"
                          );
                        }}
                      />
                    </div>

                    <div
                      className="overflow-y-auto px-6 pb-6 flex-1"
                      tabIndex={-1}
                      ref={panelContentRef}
                    >
                      <div aria-live="polite" className="sr-only">
                        Painel {panelExpanded ? "expandido" : "recolhido"}
                      </div>
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
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>

                      <div className="space-y-6 flex-1">
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
                                  console.error(
                                    "Error saving translation:",
                                    error
                                  );

                                  setSelectedWord(selectedWord);
                                  setWords((prev) =>
                                    prev.map((w) =>
                                      w.id === selectedWord.id
                                        ? selectedWord
                                        : w
                                    )
                                  );
                                }
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

                        {suggestions.length > 0 && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {suggestions.length > 1
                                ? "Suggestions"
                                : "Suggestion"}
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
                                    setSelectedWord(updatedWord);
                                    setWords((prev) =>
                                      prev.map((w) =>
                                        w.id === updatedWord.id
                                          ? updatedWord
                                          : w
                                      )
                                    );
                                    db.words.update(updatedWord.id!, {
                                      translation,
                                    });
                                  }}
                                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  {translation}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

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
                                    console.error(
                                      "Error updating comfort:",
                                      error
                                    );

                                    setSelectedWord(selectedWord);
                                    setWords((prev) =>
                                      prev.map((w) =>
                                        w.id === selectedWord.id
                                          ? selectedWord
                                          : w
                                      )
                                    );
                                  }
                                }}
                                className={`p-3 cursor-pointer rounded-lg text-sm font-medium transition-all ${
                                  selectedWord.comfort === num
                                    ? "ring-2 ring-purple-500"
                                    : ""
                                } ${
                                  num === 5
                                    ? "bg-green-100 hover:bg-green-900/30"
                                    : num === 4
                                    ? "bg-blue-100 hover:bg-blue-900/30"
                                    : num === 3
                                    ? "bg-yellow-100 hover:bg-yellow-900/30"
                                    : num === 2
                                    ? "bg-red-100 hover:bg-red-900/30"
                                    : "bg-gray-100 hover:bg-gray-900/30"
                                }`}
                              >
                                {num} - {getComfortLevelName(num)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
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
                                console.error(
                                  "Error saving translation:",
                                  error
                                );

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
                          {loadingSuggestions && (
                            <div className="absolute right-3 top-3.5">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {suggestions.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {suggestions.length > 1
                              ? "Suggestions"
                              : "Suggestion"}
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
                                  setSelectedWord(updatedWord);
                                  setWords((prev) =>
                                    prev.map((w) =>
                                      w.id === updatedWord.id ? updatedWord : w
                                    )
                                  );
                                  db.words.update(updatedWord.id!, {
                                    translation,
                                  });
                                }}
                                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                {translation}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

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
                                  console.error(
                                    "Error updating comfort:",
                                    error
                                  );

                                  setSelectedWord(selectedWord);
                                  setWords((prev) =>
                                    prev.map((w) =>
                                      w.id === selectedWord.id
                                        ? selectedWord
                                        : w
                                    )
                                  );
                                }
                              }}
                              className={`p-3 cursor-pointer rounded-lg text-sm font-medium transition-all ${
                                selectedWord.comfort === num
                                  ? "ring-2 ring-purple-500"
                                  : ""
                              } ${
                                num === 5
                                  ? "bg-green-100 hover:bg-green-900/30"
                                  : num === 4
                                  ? "bg-blue-100 hover:bg-blue-900/30"
                                  : num === 3
                                  ? "bg-yellow-100 hover:bg-yellow-900/30"
                                  : num === 2
                                  ? "bg-red-100 hover:bg-red-900/30"
                                  : "bg-gray-100 hover:bg-gray-900/30"
                              }`}
                            >
                              {num} - {getComfortLevelName(num)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}{" "}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
