"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { db } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
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

        const langCode = (await settings?.user["target-lang"]) || "en";
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
      };

      await db.articles.add(newArticle);

      toast.success("Text created successfully!");
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
    setForm(prev => ({ ...prev, content: newContent }));
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Back to Texts
            </Link>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
            Create New Text
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Content */}
              <div className="col-span-2 space-y-6">
                <div className="md:grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Text Title
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                               dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                               transition-all placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Enter a descriptive title"
                      required
                      minLength={3}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Source (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                               dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                               transition-all placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="e.g., Book Title, Website URL"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Content in {targetLanguageName}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-3">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{wordCount}</span>
                        <span className="hidden sm:inline">words,</span>
                        <span className="sm:hidden">words,</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{charCount}</span>
                        <span className="hidden sm:inline">characters,</span>
                        <span className="sm:hidden">characters,</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">and ~{Math.ceil(wordCount / 200)}</span>
                        <span className="hidden sm:inline">min read.</span>
                        <span className="sm:hidden">min. read.</span>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={form.content}
                    onChange={handleContentChange}
                    rows={10}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                             dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             transition-all placeholder-gray-400 dark:placeholder-gray-500 resize-y
                             font-mono text-sm leading-relaxed"
                    placeholder="Paste or type your content here..."
                    required
                    minLength={50}
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tip: Start with texts between 300-500 words for optimal learning.
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {((wordCount / 1000) * 100).toFixed(1)}% of 1000 words goal.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 
                         text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                         transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.content.trim() || !form.title.trim()}
                className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 
                         hover:from-purple-700 hover:to-fuchsia-700 text-white font-medium 
                         disabled:opacity-50 disabled:cursor-not-allowed relative transition-all 
                         shadow-md hover:shadow-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="invisible">Creating Text...</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Create Text"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}