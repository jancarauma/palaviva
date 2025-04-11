// app/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    source: "",
    content: "",
  });
  const [targetLang, setTargetLang] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await db.settings.get(1);
        if (settings?.user) {
          setTargetLang(settings.user["target-lang"]);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load language settings");
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!form.content.trim() || !form.title.trim()) {
        toast.error("Please fill in required fields");
        return;
      }

      if (!targetLang) {
        toast.error("Language settings not loaded");
        return;
      }

      await db.articles.add({
        name: form.title,
        source: form.source,
        original: form.content,
        word_ids: "",
        language: targetLang,
        date_created: Date.now(),
        last_opened: Date.now(),
        current_page: 0,
      });

      toast.success("Text created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error creating article:", error);
      toast.error("Error creating text");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
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
              <div className="col-span-2 md:col-span-1">
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
                />
              </div>

              <div className="col-span-2 md:col-span-1">
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

              <div className="col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {charCount.toLocaleString()} characters
                  </span>
                </div>
                <textarea
                  value={form.content}
                  onChange={(e) => {
                    setForm({ ...form, content: e.target.value });
                    setCharCount(e.target.value.length);
                  }}
                  rows={10}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                           dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all placeholder-gray-400 dark:placeholder-gray-500 resize-y
                           font-mono text-sm leading-relaxed"
                  placeholder="Paste or type your content here..."
                  required
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Pro Tip: Start with shorter texts (300-500 characters) for better learning retention
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 
                         text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                         transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.content.trim() || !form.title.trim()}
                className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 
                         hover:from-purple-700 hover:to-fuchsia-700 text-white font-medium 
                         disabled:opacity-50 disabled:cursor-not-allowed relative transition-all 
                         shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <span className="invisible">Submit Text</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Submit Text"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}