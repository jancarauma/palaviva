"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { db, IArticle, IWord } from "@/lib/db/schema";

export default function ArticleView({ params }: { params: { id: string } }) {
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
  } | null>(null);
  const unwrappedParams = use(params);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageSize = 500;

  const cleanWord = (rawWord: string): string => {
    if (!languageSettings) return '';
  
    // Passo 1: Normalização Unicode
    const normalized = rawWord.normalize('NFD');
    
    // Passo 2: Remover símbolos apenas no início/fim
    const trimmed = normalized.replace(
      /^[\p{P}\p{S}\p{N}]+|[\p{P}\p{S}\p{N}]+$/gu, 
      ''
    );
  
    // Passo 3: Validar estrutura interna da palavra
    const isValid = languageSettings.word_regex
      ? new RegExp(languageSettings.word_regex, 'u').test(trimmed)
      : trimmed.length > 0;
  
    return isValid ? trimmed.toLowerCase() : '';
  };

  useEffect(() => {
    const loadBaseData = async () => {
      const art = await db.articles.get(Number(unwrappedParams.id));
      if (!art) {
        router.push("/");
        return;
      }

      const lang = await db.languages
        .where("iso_639_1")
        .equals(art.language)
        .first();

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
  }, [unwrappedParams.id, router]);

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

  const splitText = (text: string) => {
    if (!languageSettings) return [];

    try {
      // Remove âncoras do word_regex para uso em captura
      const wordPattern = languageSettings.word_regex.replace(/^\^|\$$/g, "");
      // Regex para capturar palavras OU pontuações/símbolos individuais
      const tokenRegex = new RegExp(`(${wordPattern})|([\\p{P}\\p{S}])`, "gui");

      const tokens = text.match(tokenRegex) || [];
      return tokens.filter((t) => t && t.trim().length > 0);
    } catch (e) {
      console.error("Regex inválida, usando fallback", e);
      // Fallback para captura básica
      return (
        text
          .match(/(\p{L}+['’-]?\p{L}*)|([\p{P}\p{S}])/giu)
          ?.filter((t) => t) || []
      );
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to articles
          </Link>
          <div className="flex items-center gap-4">
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
          </div>
        </div>

        <div className="flex gap-6">
          {/* Article Section */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6 border">
            <h1 className="text-2xl font-bold mb-4">{article.name}</h1>

            <div
              ref={containerRef}
              className="prose mb-6 h-[60vh] overflow-y-auto text-lg"
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

                  return (
                    <span
                      key={`${token}-${index}`}
                      className={`px-1 rounded ${
                        isWord ? "cursor-pointer hover:underline hover:bg-gray-100" : ""
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
                      //style={{ whiteSpace: "pre-wrap"}}
                      onClick={
                        isWord ? () => handleWordClick(token) : undefined
                      }
                    >
                      {" "}{token}{" "}
                    </span> 
                  );
                })}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center border-t pt-4">
              <button
                onClick={() => handlePageChange("prev")}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-gray-100 rounded-md disabled:opacity-50"
              >
                Previous Page
              </button>
              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange("next")}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 bg-gray-100 rounded-md disabled:opacity-50"
              >
                Next Page
              </button>
            </div>
          </div>

          {/* Translation Sidebar */}
          <div className="w-96 bg-white rounded-lg shadow-md p-6 border h-[80vh] flex flex-col">
            {selectedWord ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">{selectedWord.name}</h3>
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
                    <div className="grid grid-cols-2 gap-2">
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
