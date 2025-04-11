// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/schema";
import { toast } from "react-hot-toast";
import { ILanguage } from "@/lib/db/types"; // Assuming you have this type
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export interface ISettings {
  settings_id?: number;
  user: {
    "native-lang": string;
    "target-lang": string;
    version: string;
    "page-size": number;
  };
}

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl mx-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

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
            Application Settings
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="space-y-8">
            {/* Language Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Native Language
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={settings["native-lang"]}
                  onChange={(e) => handleChange("native-lang", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                           dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all"
                >
                  {languages.map((lang) => (
                    <option key={lang.iso_639_1} value={lang.iso_639_1}>
                      {lang.name} ({lang.iso_639_1.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Language
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={settings["target-lang"]}
                  onChange={(e) => handleChange("target-lang", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                           dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all"
                >
                  {languages.map((lang) => (
                    <option key={lang.iso_639_1} value={lang.iso_639_1}>
                      {lang.name} ({lang.iso_639_1.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Page Size */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Words per Page
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="5000"
                  step="50"
                  value={settings["page-size"]}
                  onChange={(e) => handleChange("page-size", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                           dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all pr-16"
                />
                <span className="absolute right-4 top-3.5 text-gray-500 dark:text-gray-400 text-sm">
                  words
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Recommended: 300-500 words for optimal learning
              </p>
            </div>

            {/* Version Info */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Application Version
              </label>
              <input
                type="text"
                value={settings.version}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                         bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4 border-t pt-6 border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 
                         text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                         transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                disabled={!isDirty}
                className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 
                         hover:from-purple-700 hover:to-fuchsia-700 text-white font-medium 
                         disabled:opacity-50 disabled:cursor-not-allowed relative transition-all 
                         shadow-md hover:shadow-lg"
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