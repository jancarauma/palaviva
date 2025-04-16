"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { db } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { ChevronLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const countWords = (text: string): number => {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    source: "",
    content: "",
  });
  const [targetLang, setTargetLang] = useState("");
  const [targetLanguageName, setTargetLanguageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [textDirection, setTextDirection] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        let settings = await db.settings.get(1);

        if (!settings) {
          await db.settings.add({
            user: {
              "native-lang": "pt",
              "target-lang": "en",
              version: "0.0.1",
              "page-size": 1000,
            },
          });
          settings = await db.settings.get(1);
        }

        const langCode = settings?.user?.["target-lang"] || "en";
        setTargetLang(langCode);

        const language = await db.languages
          .where("iso_639_1")
          .equalsIgnoreCase(langCode)
          .first();

        setTargetLanguageName(language?.name || "Unknown");
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load language settings");
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const updateTextStats = useCallback((text: string) => {
    setCharCount(text.length);
    setWordCount(countWords(text));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (form.title.trim().length < 3) {
        toast.error("Title must be at least 3 characters");
        return;
      }

      if (wordCount < 10) {
        toast.error("Content must have at least 10 words");
        return;
      }

      if (!targetLang) {
        toast.error("Please set target language in settings first");
        return;
      }

      const newArticle = {
        name: form.title.trim(),
        source: form.source.trim(),
        original: form.content.trim(),
        word_ids: "",
        language: targetLang,
        date_created: Date.now(),
        last_opened: Date.now(),
        current_page: 0,
        word_count: wordCount,
        reading_time: Math.ceil(wordCount / 200),
        direction: textDirection, // Add direction to your DB schema
      };

      await db.settings.update(1, {
        "user.target-lang": newArticle.language,
      });

      await db.articles.add(newArticle);

      toast.success("Text created successfully!");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      router.push("/");
    } catch (error) {
      console.error("Error creating article:", error);
      toast.error("Error creating text");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setForm((prev) => ({ ...prev, content: newContent }));
    updateTextStats(newContent);
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="mb-8">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="md:grid md:grid-cols-2 gap-6 space-y-4">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="flex gap-3">
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex justify-between">
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-blue-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="group inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-all"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
              <span className="bg-gradient-to-r from-purple-600 to-purple-600 bg-[length:0_2px] bg-left-bottom bg-no-repeat transition-[background-size] group-hover:bg-[length:100%_2px]">
                Back to Texts
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl shadow-sm">
              <DocumentTextIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
              Create New {targetLanguageName} Text
            </h1>
          </div>
        </div>

        <div className="relative bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/30 dark:border-gray-700/30">
          {/* Floating background elements */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-100/30 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50" />

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              {/* Text Direction Toggle */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Text Direction:
                </span>
                <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-700/30 rounded-lg">
                  {["ltr", "rtl"].map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setTextDirection(dir as "ltr" | "rtl")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        textDirection === dir
                          ? "bg-purple-600 text-white shadow-inner"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {dir.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Source */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Text Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-700/30 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter a descriptive title"
                    required
                    minLength={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Source (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) =>
                      setForm({ ...form, source: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-700/30 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="e.g., Book Title, Website URL"
                  />
                </div>
              </div>

              {/* Content Editor */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-700/30 px-3 py-1.5 rounded-lg">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {wordCount}
                      </span>
                      <span>words</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-700/30 px-3 py-1.5 rounded-lg">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {charCount}
                      </span>
                      <span>chars</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-700/30 px-3 py-1.5 rounded-lg">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {Math.ceil(wordCount / 200)}
                      </span>
                      <span>min</span>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <textarea
                    value={form.content}
                    onChange={handleContentChange}
                    dir={textDirection}
                    style={{
                      textAlign: textDirection === "rtl" ? "right" : "left",
                    }}
                    rows={10}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-700/30 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500 resize-y font-mono text-sm leading-relaxed shadow-sm group-hover:shadow-md"
                    placeholder="Paste or type your content here..."
                    required
                    minLength={50}
                  />
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <p>Tip: Start with 300-500 words for optimal learning</p>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      {((wordCount / 1000) * 100).toFixed(1)}%
                    </span>
                    <span>of 1000 words goal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-2.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100/30 dark:hover:bg-gray-700/30 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !form.content.trim() || !form.title.trim()
                }
                className="relative px-8 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-all shadow-lg hover:shadow-xl"
              >
                <span
                  className={`relative z-10 ${
                    isSubmitting ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Create Text
                </span>
                {isSubmitting && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
