"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { ChevronLeftIcon, SparklesIcon } from "@heroicons/react/24/outline";

import { db } from "@/lib/db/schema";
import { IArticle, IWord } from "@/lib/db/types";
import { getComfortLevelName } from "@/lib/utils";
import { getTranslationSuggestions } from "@/lib/translation";
import { LearningProgress } from "@/components/ArticlePage/LearningProgress";
import { PlaybackControls } from "@/components/ArticlePage/PlaybackControls";
import { PaginationControls } from "@/components/ArticlePage/PaginationControls";
import { ModalOverlay } from "./ModalOverlay";
import { SuggestionsList } from "./SuggestionList";
import { ComfortLevelSelector } from "./ComfortSelector";
import { TranslationInput } from "./TranslationInput";
import { WordDetailHeader } from "./WordDetailHeader";
import WordToken from "./WordToken";

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
    utter.rate = langKey === "en" ? 1.0 : 0.95;
    utter.pitch = langKey === "en" ? 1.0 : 1.05;

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
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <motion.div whileHover={{ x: -2 }}>
            <Link
              href="/"
              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Back to Texts
            </Link>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-600" />
              <LearningProgress known={knownWords} total={totalWords} />
              <PlaybackControls
                isPlaying={isPlaying}
                togglePlayback={togglePlayback}
                voicesLoaded={voicesLoaded}
              />
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href={`/flashcards/${id}`}
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-white/90"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z" />
                </svg>
                <span>Flashcards</span>
              </Link>
            </motion.div>
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
              className="p-1 prose dark:prose-invert max-w-none mb-6 h-[50vh] sm:h-[60vh] overflow-y-auto text-base sm:text-lg"
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
                    <WordToken
                      key={`${token}-${index}`}
                      token={token}
                      index={index}
                      isWord={isWord}
                      comfort={comfort}
                      selectedWord={selectedWord}
                      wordData={wordData}
                      isCurrentWord={isCurrentWord}
                      onWordClick={handleWordClick}
                    />
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
          <ModalOverlay
            isVisible={!!selectedWord && isMobile}
            onClose={() => setSelectedWord(null)}
          />
          <AnimatePresence>
            {selectedWord && (
              <>
                {/* Mobile Translation Panel */}{" "}
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
                      <WordDetailHeader
                        selectedWord={selectedWord}
                        onClose={() => setSelectedWord(null)}
                        onPlayPronunciation={playPronunciation}
                      />

                      <div className="space-y-6 flex-1">
                        <TranslationInput
                          selectedWord={selectedWord}
                          loadingSuggestions={loadingSuggestions}
                          onUpdate={async (updatedWord) => {
                            setSelectedWord(updatedWord);
                            setWords((prev) =>
                              prev.map((w) =>
                                w.id === updatedWord.id ? updatedWord : w
                              )
                            );

                            try {
                              await db.words.update(updatedWord.id!, {
                                translation: updatedWord.translation,
                              });
                            } catch (error) {
                              console.error("Error saving translation:", error);
                              setSelectedWord(selectedWord);
                              setWords((prev) =>
                                prev.map((w) =>
                                  w.id === selectedWord.id ? selectedWord : w
                                )
                              );
                              throw error;
                            }
                          }}
                        />

                        <SuggestionsList
                          suggestions={suggestions}
                          selectedWord={selectedWord}
                          onUpdate={(updatedWord) => {
                            setSelectedWord(updatedWord);
                            setWords((prev) =>
                              prev.map((w) =>
                                w.id === updatedWord.id ? updatedWord : w
                              )
                            );
                            db.words.update(updatedWord.id!, {
                              translation: updatedWord.translation,
                            });
                          }}
                        />

                        <ComfortLevelSelector
                          selectedWord={selectedWord}
                          onUpdate={async (updatedWord) => {
                            setSelectedWord(updatedWord);
                            setWords((prev) =>
                              prev.map((w) =>
                                w.id === updatedWord.id ? updatedWord : w
                              )
                            );

                            try {
                              await db.words.update(updatedWord.id!, {
                                comfort: updatedWord.comfort,
                              });
                            } catch (error) {
                              setSelectedWord(selectedWord);
                              setWords((prev) =>
                                prev.map((w) =>
                                  w.id === selectedWord.id ? selectedWord : w
                                )
                              );
                              throw error;
                            }
                          }}
                          getComfortLevelName={(num) =>
                            getComfortLevelName(num)
                          }
                        />
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
                    <WordDetailHeader
                      selectedWord={selectedWord}
                      onClose={() => setSelectedWord(null)}
                      onPlayPronunciation={playPronunciation}
                    />

                    <div className="space-y-6 flex-1">
                      <TranslationInput
                        selectedWord={selectedWord}
                        loadingSuggestions={loadingSuggestions}
                        onUpdate={async (updatedWord) => {
                          setSelectedWord(updatedWord);
                          setWords((prev) =>
                            prev.map((w) =>
                              w.id === updatedWord.id ? updatedWord : w
                            )
                          );

                          try {
                            await db.words.update(updatedWord.id!, {
                              translation: updatedWord.translation,
                            });
                          } catch (error) {
                            console.error("Error saving translation:", error);
                            setSelectedWord(selectedWord);
                            setWords((prev) =>
                              prev.map((w) =>
                                w.id === selectedWord.id ? selectedWord : w
                              )
                            );
                            throw error;
                          }
                        }}
                      />

                      <SuggestionsList
                        suggestions={suggestions}
                        selectedWord={selectedWord}
                        onUpdate={(updatedWord) => {
                          setSelectedWord(updatedWord);
                          setWords((prev) =>
                            prev.map((w) =>
                              w.id === updatedWord.id ? updatedWord : w
                            )
                          );
                          db.words.update(updatedWord.id!, {
                            translation: updatedWord.translation,
                          });
                        }}
                      />

                      <ComfortLevelSelector
                        selectedWord={selectedWord}
                        onUpdate={async (updatedWord) => {
                          setSelectedWord(updatedWord);
                          setWords((prev) =>
                            prev.map((w) =>
                              w.id === updatedWord.id ? updatedWord : w
                            )
                          );

                          try {
                            await db.words.update(updatedWord.id!, {
                              comfort: updatedWord.comfort,
                            });
                          } catch (error) {
                            setSelectedWord(selectedWord);
                            setWords((prev) =>
                              prev.map((w) =>
                                w.id === selectedWord.id ? selectedWord : w
                              )
                            );
                            throw error;
                          }
                        }}
                        getComfortLevelName={(num) => getComfortLevelName(num)}
                      />
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
