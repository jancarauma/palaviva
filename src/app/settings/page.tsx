// app/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/schema';
//import { ISettings } from '@/lib/types/models';

// lib/types/models.ts
export interface ISettings {
    settings_id?: number;
    user: {
      "native-lang": string;
      "target-lang": string;
      "trunk-version": string;
      "page-size": number;
    };
  }

export default function SettingsPage() {
  const [settings, setSettings] = useState<ISettings['user']>({
    'native-lang': 'en',
    'target-lang': 'fr',
    'trunk-version': '0.0.4',
    'page-size': 1000
  });
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar configurações
        const savedSettings = await db.settings.get(1);        

        // Carregar idiomas disponíveis
        let langs = await db.languages.toArray();

        // se não houver idiomas, cria padrão
        if (langs.length === 0) {
          await db.seed(); // Garantir que o seed seja chamado
          langs = await db.languages.toArray();
        }

        // atualiza estados
        if (savedSettings?.user) {
          setSettings(savedSettings.user);
        }
        setLanguages(langs.map(l => l.iso_639_1));

      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (field: keyof ISettings['user'], value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    if (settings['native-lang'] === settings['target-lang']) {
      alert('Native and target languages must be different!');
      return;
    }
    
    try {
      await db.settings.update(1, { user: settings });
      alert('Settings saved successfully!');
      window.location.reload(); // Força atualização global
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Application Settings</h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
            &larr; Back to texts
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Native Language */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Native Language
              </label>
              <select
                value={settings['native-lang']}
                onChange={(e) => handleChange('native-lang', e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                {languages.map(lang => (
                    <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                    </option>
                ))}
                </select>
            </div>

            {/* Target Language */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Language
              </label>
              <select
                value={settings['target-lang']}
                onChange={(e) => handleChange('target-lang', e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Size */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Words per Page
              </label>
              <input
                type="number"
                min="100"
                max="5000"
                value={settings['page-size']}
                onChange={(e) => handleChange('page-size', Number(e.target.value))}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Version Info */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Application Version
              </label>
              <input
                type="text"
                value={settings['trunk-version']}
                disabled
                className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}