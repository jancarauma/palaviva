'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/schema';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface IWord {
  id?: number;
  name: string;
  slug: string;
  comfort: number;
  translation?: string;
  language: string;
  is_not_a_word: boolean;
  count: number;
}

const COLORS = ['#ff4444', '#ffbb33', '#00C851', '#33b5e5', '#2BBBAD'];
const PAGE_SIZE = 20;

export default function WordsPage() {
  const [words, setWords] = useState<IWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof IWord; direction: 'asc' | 'desc' }>({
    key: 'count',
    direction: 'desc'
  });
  const [selectedWord, setSelectedWord] = useState<IWord | null>(null);
  const [editTranslation, setEditTranslation] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [comfortFilter, setComfortFilter] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const loadWords = async () => {
      try {
        const words = await db.words.where('language').equals('fr').toArray();
        setWords(words);
      } catch (error) {
        console.error('Error loading words:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWords();
  }, []);

  const sortedWords = [...words].sort((a, b) => {
    if (a[sortConfig.key]! < b[sortConfig.key]!) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key]! > b[sortConfig.key]!) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredWords = sortedWords.filter(word => {
    const matchesSearch = word.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.translation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComfort = comfortFilter ? word.comfort === comfortFilter : true;
    return matchesSearch && matchesComfort;
  });

  const paginatedWords = filteredWords.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const stats = {
    totalWords: words.length,
    knownWords: words.filter(w => w.comfort === 5).length,
    avgComfort: (words.reduce((acc, w) => acc + w.comfort, 0) / words.length).toFixed(1),
    mostFrequent: [...words].sort((a, b) => b.count - a.count)[0]?.name || '-'
  };

  const comfortData = [1, 2, 3, 4, 5].map(level => ({
    name: getComfortLevelName(level),
    value: words.filter(w => w.comfort === level).length
  }));

  const handleSort = (key: keyof IWord) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const updateComfort = async (wordId: number, newComfort: number) => {
    setUpdating(wordId);
    try {
      await db.words.update(wordId, { comfort: newComfort });
      setWords(prev => prev.map(word => 
        word.id === wordId ? { ...word, comfort: newComfort } : word
      ));
    } catch (error) {
      console.error('Error updating comfort level:', error);
    } finally {
      setUpdating(null);
    }
  };

  const updateTranslation = async (wordId: number) => {
    if (!editTranslation.trim()) return;
    
    try {
      await db.words.update(wordId, { translation: editTranslation });
      setWords(prev => prev.map(word => 
        word.id === wordId ? { ...word, translation: editTranslation } : word
      ));
      setSelectedWord(null);
    } catch (error) {
      console.error('Error updating translation:', error);
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Words Dashboard</h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
            &larr; Back to texts
          </Link>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">Total Words</div>
            <div className="text-2xl font-bold dark:text-white">{stats.totalWords}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">Known Words</div>
            <div className="text-2xl font-bold dark:text-white">{stats.knownWords}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">Avg Comfort</div>
            <div className="text-2xl font-bold dark:text-white">{stats.avgComfort}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">Most Frequent</div>
            <div className="text-2xl font-bold truncate dark:text-white">{stats.mostFrequent}</div>
          </div>
        </div>

        {/* Comfort Distribution Chart */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Comfort Level Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={comfortData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {comfortData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search words..."
            className="p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={comfortFilter || ''}
            onChange={(e) => setComfortFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Comfort Levels</option>
            {[1, 2, 3, 4, 5].map(level => (
              <option key={level} value={level}>
                {getComfortLevelName(level)}
              </option>
            ))}
          </select>
        </div>

        {/* Words Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {(['name', 'translation', 'comfort', 'count'] as const).map((key) => (
                    <th 
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        <SortIndicator 
                          isActive={sortConfig.key === key}
                          direction={sortConfig.key === key ? sortConfig.direction : undefined}
                        />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedWords.map(word => (
                  <tr 
                    key={word.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {word.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {selectedWord?.id === word.id ? (
                        <input
                          type="text"
                          value={editTranslation}
                          onChange={(e) => setEditTranslation(e.target.value)}
                          className="border rounded px-2 py-1 dark:bg-gray-600 dark:text-white w-32 md:w-full"
                          onBlur={() => updateTranslation(word.id!)}
                          onKeyPress={(e) => e.key === 'Enter' && updateTranslation(word.id!)}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                          onClick={() => {
                            setSelectedWord(word);
                            setEditTranslation(word.translation || '');
                          }}
                        >
                          {word.translation || 'Add translation'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <select
                        value={word.comfort}
                        onChange={(e) => updateComfort(word.id!, Number(e.target.value))}
                        className="border rounded px-2 py-1 dark:bg-gray-600 dark:text-white"
                        disabled={updating === word.id}
                      >
                        {updating === word.id ? (
                          <option>Updating...</option>
                        ) : (
                          [1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>
                              {num} ({getComfortLevelName(num)})
                            </option>
                          ))
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {word.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <button
                        className="text-red-500 hover:text-red-700 dark:text-red-400 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this word?')) {
                            db.words.delete(word.id!);
                            setWords(prev => prev.filter(w => w.id !== word.id));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-600 rounded-md disabled:opacity-50 dark:text-white"
            >
              Previous
            </button>
            <span className="dark:text-gray-300">
              Page {currentPage + 1} of {Math.ceil(filteredWords.length / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setCurrentPage(p => 
                Math.min(p + 1, Math.ceil(filteredWords.length / PAGE_SIZE) - 1)
              )}
              disabled={currentPage === Math.ceil(filteredWords.length / PAGE_SIZE) - 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-600 rounded-md disabled:opacity-50 dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para indicadores de ordenação
const SortIndicator = ({ 
  isActive,
  direction
}: {
  isActive: boolean;
  direction?: 'asc' | 'desc';
}) => (
  <span className="ml-2">
    {!isActive && '↕'}
    {isActive && (direction === 'asc' ? '↑' : '↓')}
  </span>
);

// Função auxiliar para obter nome do nível de conforto
function getComfortLevelName(comfort: number): string {
  switch(comfort) {
    case 1: return 'Unknown';
    case 2: return 'Hard';
    case 3: return 'Medium';
    case 4: return 'Easy';
    case 5: return 'Known';
    default: return 'Unknown';
  }
}