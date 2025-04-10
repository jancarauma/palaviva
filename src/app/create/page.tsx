// app/create/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/schema';

export default function CreatePage() {
  const [form, setForm] = useState({
    title: '',
    source: '',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.content.trim() || !form.title.trim()) {
      alert('Please fill in required fields');
      return;
    }

    try {
      await db.articles.add({
        name: form.title,
        source: form.source,
        original: form.content,
        word_ids: '', // Será preenchido após processamento
        language: 'fr', // Idioma padrão
        date_created: Date.now(),
        last_opened: Date.now(),
        current_page: 0
      });

      // Limpar formulário após sucesso
      setForm({ title: '', source: '', content: '' });
      alert('Text created successfully!');
      
    } catch (error) {
      console.error('Error creating article:', error);
      alert('Error creating text');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Create a New Text
          </h1>
          <Link 
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            &larr; Back to texts
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Text Title
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 
                         dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter text title"
                required
              />
            </div>

            <div>
              <label 
                htmlFor="source"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Text Source
              </label>
              <input
                id="source"
                type="text"
                value={form.source}
                onChange={(e) => setForm({...form, source: e.target.value})}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 
                         dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter text source (optional)"
              />
            </div>

            <div>
              <label 
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Text Content
              </label>
              <textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({...form, content: e.target.value})}
                rows={12}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 
                         dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste your text here..."
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                         transition-colors disabled:opacity-50"
                disabled={!form.content.trim() || !form.title.trim()}
              >
                Submit Text
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}