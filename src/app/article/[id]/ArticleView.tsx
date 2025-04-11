"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/schema";
import { IArticle, IWord } from "@/lib/db/types";
import { PauseIcon, PlayIcon, SpeakerWaveIcon } from "@/components/Icons";
import { getComfortLevelName } from "@/lib/utils";

export default function ArticleView({ id }: { id: string }) {
  const router = useRouter();
  const [article, setArticle] = useState<IArticle | null>(null);
  const [words, setWords] = useState<IWord[]>([]);
  const [wordFrequency, setWordFrequency] = useState<Map<string, number>>(
    new Map()
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedWord, setSelectedWord] = useState<IWord | null>(null);
  const [showMarkAll, setShowMarkAll] = useState(0);
  const [languageSettings, setLanguageSettings] = useState<{
    text_splitting_regex: string;
    word_regex: string;
  }>({ 
    text_splitting_regex: "\\s+", 
    word_regex: "\\p{L}+" 
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
      const [art] = await Promise.all([
        db.articles.get(Number(id)),
      ]);
      
      if (!art) {
        router.push("/");
        return;
      }

      const [lang] = await Promise.all([
        db.languages.
        where("iso_639_1").
        equals(art.language).
        first()
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
      'en': 'en-US',
      'pt': 'pt-BR',
      'es': 'es-ES',
      'fr': 'fr-FR'
    };
    
    const targetLang = langMap[article.language.split('-')[0]] || article.language;
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();

    const preferredVoices = voices.filter(voice => 
      voice.lang === targetLang || 
      voice.lang.startsWith(targetLang.split('-')[0])
    );

    const u = new SpeechSynthesisUtterance(text);
    
    if (preferredVoices.length > 0) {
      u.voice = preferredVoices[0];
    }
    
    u.lang = targetLang;
    u.rate = 0.9;
    u.pitch = 1.2;

    switch(targetLang.split('-')[0]) {
      case 'en':
        u.rate = 1.1;
        u.pitch = 1.0;
        break;
      case 'pt':
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
        console.log('Available voices:', voices);
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
  
      const tokenRegex = new RegExp(
        `(${wordPattern})|([\\p{P}\\p{S}])`, 
        "gui"
      );
  
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

  const markAllKnown = async () => {
    if (showMarkAll === 0) {
      setShowMarkAll(1);
    } else {
      try {
        await Promise.all(
          words.map((word) => db.words.update(word.id!, { comfort: 5 }))
        );
        //setWords(prev => prev.map(w => ({ ...w, comfort: 5 })));
        setShowMarkAll(0);
      } catch (error) {
        console.error("Error marking all as known:", error);
      }
    }
  };

  if (!article || !languageSettings) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const wordsArray = splitText(article.original);
  //const wordsUnique = new Set(
  //  wordsArray.map(word => {
  //      const cleanedWord = word.replace(/^[^a-zA-ZÀ-ÿ]+|[^a-zA-ZÀ-ÿ]+$/g, '');
  //      return cleanedWord.toLowerCase();
  //  })
  //);
  const totalWords = wordsArray.length;
  //const totalWords = wordsUnique.size;
  const knownWords = words.filter((w) => w?.comfort >= 4).length;
  //const knownWords = words.filter(w => w?.comfort >= 4).length; (all known words)
  const startIdx = currentPage * pageSize;
  const endIdx = startIdx + pageSize;
  const wordsToShow = wordsArray.slice(startIdx, endIdx);
  const totalPages = Math.ceil(totalWords / pageSize);

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
        date_created: Date.now()
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
      'en': 'en-US',
      'pt': 'pt-BR',
      'es': 'es-ES',
      'fr': 'fr-FR'
    };
  
    const targetLang = langMap[article.language.split('-')[0]] || article.language;
  
    const voices = synth.getVoices();
    
    const preferredVoices = voices.filter(voice => 
      voice.lang === targetLang || 
      voice.lang.startsWith(targetLang.split('-')[0])
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
  
    switch(targetLang.split('-')[0]) {
      case 'en':
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        break;
      case 'pt':
        utterance.rate = 0.9;
        break;
    }
  
    synth.cancel();
    synth.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to articles
          </Link>
          <div className="flex flex-wrap gap-2 items-center justify-end">
            <span className="text-sm">
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
            </button>
            {voicesLoaded && (
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayback}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
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
          <div className="flex-1 bg-white rounded-lg shadow-md p-4 md:p-6 border">
            <h1 className="text-xl md:text-2xl font-bold mb-4">{article.name}</h1>

            <div
              ref={containerRef}
              className="prose mb-6 h-[50vh] sm:h-[60vh] overflow-y-auto text-base sm:text-lg"
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
                          ? "border-2 border-blue-500"
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
            <div className="flex justify-between items-center border-t pt-4">
              <button
                onClick={() => handlePageChange("prev")}
                disabled={currentPage === 0}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm bg-gray-100 rounded-md disabled:opacity-50 cursor-pointer"
              >
                Previous Page
              </button>
              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange("next")}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm bg-gray-100 rounded-md disabled:opacity-50 cursor-pointer"
              >
                Next Page
              </button>
            </div>
          </div>

          {/* Translation Sidebar */}
          <div className="w-full lg:w-96 bg-white rounded-lg shadow-md p-4 md:p-6 border h-[60vh] lg:h-[80vh] flex flex-col sticky top-6">
            {selectedWord ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base md:text-lg font-bold p-1">{selectedWord.name}</h3>
                    <button
                      onClick={playPronunciation}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Listen"
                    >
                      <SpeakerWaveIcon className="w-5 h-5 text-blue-500" />
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Comfort Level
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          className={`p-2 text-sm cursor-pointer rounded ${
                            selectedWord.comfort === num
                              ? "bg-blue-500 text-white"
                              : num === 5
                              ? "bg-green-100 hover:bg-green-300"
                              : num === 4
                              ? "bg-blue-100 hover:bg-blue-300"
                              : num === 3
                              ? "bg-yellow-100 hover:bg-yellow-300"
                              : num === 2
                              ? "bg-red-100 hover:bg-red-300"
                              : "bg-gray-100 hover:bg-gray-200"
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
              </>
            ) : (
              <div className="text-gray-500 text-center flex-1 flex items-center justify-center">
                Select a word to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}