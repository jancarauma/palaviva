// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/schema";
import { toast, Toaster } from "react-hot-toast";
import { ILanguage, ISettings } from "@/lib/db/types";
import {
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ISettings["user"]>({
    "native-lang": "pt",
    "target-lang": "en",
    version: "0.0.1",
    "page-size": 1000,
  });
  const [languages, setLanguages] = useState<ILanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSettings = await db.settings.get(1);
        let langs = await db.languages.toArray();

        if (langs.length === 0) {
          await db.seed();
          langs = await db.languages.toArray();
        }

        if (savedSettings?.user) {
          setSettings(savedSettings.user);
        }
        setLanguages(langs);
      } catch (error) {
        toast.error("Failed to load settings");
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (
    field: keyof ISettings["user"],
    value: string | number
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [field]: value };
      setIsDirty(JSON.stringify(newSettings) !== JSON.stringify(settings));
      return newSettings;
    });
  };

  const saveSettings = async () => {
    if (settings["native-lang"] === settings["target-lang"]) {
      toast.error("Native and target languages must be different!");
      return;
    }

    try {
      await db.settings.update(1, { user: settings });
      toast.success("Settings saved successfully!");
      setIsDirty(false);
      router.refresh(); // Soft refresh instead of full reload
    } catch (error) {
      toast.error("Failed to save settings");
      console.error("Error saving settings:", error);
    }
  };

  const exportDatabase = async () => {
    try {
      const data = {
        settings: await db.settings.toArray(),
        languages: await db.languages.toArray(),
        articles: await db.articles.toArray(),
        words: await db.words.toArray(),
        phrases: await db.phrases.toArray(),
      };

      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `palaviva-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Database exported successfully!");
    } catch (error) {
      toast.error("Failed to export database");
      console.error("Export error:", error);
    }
  };

  const importDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = JSON.parse(e.target?.result as string);

        // Clear existing data
        await Promise.all([
          db.settings.clear(),
          db.languages.clear(),
          db.articles.clear(),
          db.words.clear(),
          db.phrases.clear(),
        ]);

        // Import new data
        await Promise.all([
          db.settings.bulkAdd(data.settings),
          db.languages.bulkAdd(data.languages),
          db.articles.bulkAdd(data.articles),
          db.words.bulkAdd(data.words),
          db.phrases.bulkAdd(data.phrases),
        ]);

        toast.success("Database imported successfully!");
        window.location.reload();
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error("Invalid backup file");
      console.error("Import error:", error);
    }
  };

  const resetDatabase = async () => {
    if (
      confirm("Are you sure you want to reset all data? This cannot be undone!") &&
      confirm("This will permanently delete your progress. Continue?")
    ) {
      try {
        await db.close();
        await db.delete();
        await db.open();
        await db.seed();
        await setTimeout(() => {
          window.location.reload();
        }, 1000);
        toast.success("Database reseted");
      } catch (error) {
        toast.error("Failed to reset database");
        console.error("Reset error:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl mx-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
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

        {/* Header Section */}
        <div className="mb-12 relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-600/10 dark:bg-purple-400/10 rounded-xl">
              <AdjustmentsHorizontalIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
              Application Settings
            </h1>
          </div>
          <div className="absolute -top-24 -right-32 w-96 h-96 bg-purple-100/50 dark:bg-purple-900/20 rounded-full blur-3xl animate-float -z-10"></div>
        </div>
        {/* Language Settings */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold dark:text-white border-b pb-2 border-gray-100/50 dark:border-gray-700/30">
            Language Preferences
          </h2>

          {/* Language Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Native Language Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Native Language
              </label>
              <select
                value={settings["native-lang"]}
                onChange={(e) => handleChange("native-lang", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {languages.map((lang) => (
                  <option key={lang.iso_639_1} value={lang.iso_639_1}>
                    {lang.name} ({lang.iso_639_1.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Language Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Language
              </label>
              <select
                value={settings["target-lang"]}
                onChange={(e) => handleChange("target-lang", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {languages.map((lang) => (
                  <option key={lang.iso_639_1} value={lang.iso_639_1}>
                    {lang.name} ({lang.iso_639_1.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div className="space-y-6 mt-8">
          <h2 className="text-xl font-semibold dark:text-white border-b pb-2 border-gray-100/50 dark:border-gray-700/30">
            Application Settings
          </h2>

          {/* Page Size Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Words per Page
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                max="5000"
                step="50"
                value={settings["page-size"]}
                onChange={(e) =>
                  handleChange("page-size", Number(e.target.value))
                }
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-16"
              />
              <span className="absolute right-4 top-3.5 text-gray-500 dark:text-gray-400 text-sm">
                words
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Pro Tip: 300 words for optimal learning
            </p>
          </div>

          {/* Version Info */}
          <div className="space-y-2 mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Application Version
            </label>
            <input
              type="text"
              value={settings.version}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-gray-50/70 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/30 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100/50 dark:border-gray-700/30 shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Data Management Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold dark:text-white border-b pb-2 border-gray-100/50 dark:border-gray-700/30">
                Data Management
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-6 bg-white/70 dark:bg-gray-700/30 rounded-xl border border-gray-200/50 dark:border-gray-600/30 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
                      <ArrowDownTrayIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white mb-1">
                        Export Data
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Download a backup of your entire database
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={exportDatabase}
                    className="mt-4 w-full cursor-pointer px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    Export Now
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-6 bg-white/70 dark:bg-gray-700/30 rounded-xl border border-gray-200/50 dark:border-gray-600/30 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                      <ArrowUpTrayIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white mb-1">
                        Import Data
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Restore from a previous backup file
                      </p>
                    </div>
                  </div>
                  <label className="mt-4 w-full cursor-pointer px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer block text-center">
                    Import Backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={importDatabase}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Dangerous Zone */}
              <div className="mt-8 p-6 bg-red-50/50 dark:bg-red-900/20 rounded-xl border border-red-200/50 dark:border-red-700/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100/50 dark:bg-red-900/20 rounded-lg">
                    <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-medium dark:text-white mb-1">
                      Reset Data
                    </h3>
                    <p className="text-sm text-red-500 dark:text-red-400">
                      This will permanently delete all your data.
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetDatabase}
                  className="mt-4 w-full px-4 py-2 cursor-pointer text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  Reset All Data
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-100/50 dark:border-gray-700/30">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg border border-gray-200/50 dark:border-gray-600/30 
                         text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 
                         transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                disabled={!isDirty}
                className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 
                         hover:from-purple-700 hover:to-fuchsia-700 text-white font-medium 
                         disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden
                         before:absolute before:inset-0 before:bg-white/10 before:opacity-0 hover:before:opacity-100
                         transition-all shadow-md hover:shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
