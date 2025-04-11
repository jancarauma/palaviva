"use client";

//import { useEffect, useState, useRef, Usable } from "react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
//import { use } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/schema";
import { IArticle, IWord } from "@/lib/db/types";

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
  //const [languageSettings, setLanguageSettings] = useState<{
  //  text_splitting_regex: string;
  //  word_regex: string;
  //} | null>(null);
  //const unwrappedParams = use(params) as { id: string }
  //const unwrappedParams = id;

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

    // Passo 1: Normalização Unicode
    const normalized = rawWord.normalize("NFD");

    // Passo 2: Remover símbolos apenas no início/fim
    const trimmed = normalized.replace(
      /^[\p{P}\p{S}\p{N}]+|[\p{P}\p{S}\p{N}]+$/gu,
      ""
    );

    // Passo 3: Validar estrutura interna da palavra
    const isValid = languageSettings.word_regex
      ? new RegExp(languageSettings.word_regex, "u").test(trimmed)
      : trimmed.length > 0;

    return isValid ? trimmed.toLowerCase() : "";
  };
  

  useEffect(() => {
    const loadBaseData = async () => {
      //const art = await db.articles.get(Number(id));
      const [art] = await Promise.all([
        db.articles.get(Number(id)),
        //db.languages.get(art.language),
      ]);
      
      if (!art) {
        router.push("/");
        return;
      }

      const [lang] = await Promise.all([
        //db.articles.get(Number(id)),
        db.languages.
        where("iso_639_1").
        equals(art.language).
        first()
      ]);

      //const lang = await db.languages
      //  .where("iso_639_1")
      //  .equals(art.language)
      //  .first();

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

      // Carregar palavras
      //const wordIds = art.word_ids.split('$').filter(Boolean).map(Number);
      //db.words.bulkGet(wordIds).then(words =>
      //  setWords(words.filter(Boolean) as IWord[])
      //);

      // Carregar TODAS as palavras do idioma, não só as do artigo
      db.words
        .where("language")
        .equals(art.language)
        .toArray()
        .then((allWords) => {
          setWords(allWords);

          // Atualizar lista de IDs do artigo se necessário
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

    // Processar texto apenas uma vez
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

    // Calcular offsets
    const offsets: number[] = [];
    let currentPos = 0;
    tokens.forEach((token) => {
      offsets.push(currentPos);
      currentPos += token.length + 1;
    });
    setWordOffsets(offsets);
    wordOffsetsRef.current = offsets;

    // Configuração de idioma igual ao Código 2
    const langMap: { [key: string]: string } = {
      'en': 'en-US',
      'pt': 'pt-BR',
      'es': 'es-ES',
      'fr': 'fr-FR'
    };
    
    const targetLang = langMap[article.language.split('-')[0]] || article.language;
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();

    // Mesma lógica de seleção de voz do Código 2
    const preferredVoices = voices.filter(voice => 
      voice.lang === targetLang || 
      voice.lang.startsWith(targetLang.split('-')[0])
    );

    const u = new SpeechSynthesisUtterance(text);
    
    // Aplicar mesma voz do Código 2
    if (preferredVoices.length > 0) {
      u.voice = preferredVoices[0];
    }
    
    // Mesma configuração de idioma e parâmetros
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
        const offsets = wordOffsetsRef.current; // Usa a ref atualizada

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
            // Forçar rerenderização imediata da nova página
            containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
          }

          // Aguardar atualização do DOM
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
        // Reiniciar a reprodução se chegou ao fim
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
      updateVoices(); // Carrega imediatamente se já disponível
  
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
        : "\\p{L}+"; // Fallback padrão
  
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

  // Processamento do texto com regex específica
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
  //const knownWords = words.filter(w => w?.comfort >= 4).length; (todas as palavras conhecidas)
  const startIdx = currentPage * pageSize;
  const endIdx = startIdx + pageSize;
  const wordsToShow = wordsArray.slice(startIdx, endIdx);
  const totalPages = Math.ceil(totalWords / pageSize);
  //const wordRegex = new RegExp(languageSettings.word_regex);

  const handleWordClick = async (rawWord: string) => {
    if (!languageSettings || !article) return;

    const cleanedWord = cleanWord(rawWord);
    if (!cleanedWord) return;

    try {
      // Buscar em TODAS as palavras do idioma
      const existingWord = words.find(
        (w) =>
          w.name.localeCompare(cleanedWord, undefined, {
            sensitivity: "base",
          }) === 0
      );

      if (existingWord) {
        setSelectedWord(existingWord);

        // Verificar se já está vinculada ao artigo
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

      // Criar nova palavra global
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

      // Atualizar estado global
      setWords((prev) => [...prev, { ...newWord, id }]);
      setSelectedWord({ ...newWord, id });

      // Atualizar artigo e banco
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
      alert("Text-to-speech não suportado!");
      return;
    }
  
    // Configuração inteligente de idioma
    const langMap: { [key: string]: string } = {
      'en': 'en-US',
      'pt': 'pt-BR',
      'es': 'es-ES',
      'fr': 'fr-FR'
    };
  
    const targetLang = langMap[article.language.split('-')[0]] || article.language;
  
    // Obter vozes disponíveis
    const voices = synth.getVoices();
    
    // Priorizar vozes em ordem:
    const preferredVoices = voices.filter(voice => 
      voice.lang === targetLang || 
      voice.lang.startsWith(targetLang.split('-')[0])
    );
    //.sort((a, b) => {
    //  // Ordenar por qualidade
    //  if (a.name.includes("Google")) return -1;
    //  if (a.name.includes("Natural")) return -1;
    //  if (a.name.includes("WaveNet")) return -1;
    //  return 1;
    //});
  
    if (preferredVoices.length === 0) {
      console.info(`Voice not available for ${targetLang}`);
      //return;
    }
  
    const utterance = new SpeechSynthesisUtterance(selectedWord.name);
    utterance.voice = preferredVoices[0];
    utterance.lang = targetLang;
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
  
    // Configurações específicas por idioma
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
                          // Reverte o estado em caso de erro
                          setSelectedWord(selectedWord);
                          setWords((prev) =>
                            prev.map((w) =>
                              w.id === selectedWord.id ? selectedWord : w
                            )
                          );
                        }
                        //setSelectedWord(prev => ({...prev!, translation: newTranslation}));
                        //setWords(prev =>
                        //    prev.map(w =>
                        //      w.id === selectedWord.id ? {...w, translation: newTranslation} : w
                        //    )
                        //  );
                        //await db.words.update(selectedWord.id!, { translation: newTranslation });
                        //setWords(prev =>
                        //  prev.map(w =>
                        //    w.id === selectedWord.id ? {...w, translation: newTranslation} : w
                        //  )
                        //);
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
                              // Reverte em caso de erro
                              setSelectedWord(selectedWord);
                              setWords((prev) =>
                                prev.map((w) =>
                                  w.id === selectedWord.id ? selectedWord : w
                                )
                              );
                            }
                            //await db.words.update(selectedWord.id!, { comfort: num });
                            //setWords(prev =>
                            //  prev.map(w =>
                            //    w.id === selectedWord.id ? {...w, comfort: num} : w
                            //  )
                            //);
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

function getComfortLevelName(comfort: number): string {
  switch (comfort) {
    case 1:
      return "Unknown";
    case 2:
      return "Hard";
    case 3:
      return "Medium";
    case 4:
      return "Easy";
    case 5:
      return "Known";
    default:
      return "Unknown";
  }
}

const PlayIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
    />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 5.25v13.5m-7.5-13.5v13.5"
    />
  </svg>
);

const SpeakerWaveIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
    />
  </svg>
);
