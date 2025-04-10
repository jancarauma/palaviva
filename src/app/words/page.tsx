"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { db } from "@/lib/db/schema";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";
import { IWord } from "@/lib/db/types";
import { getComfortColor, getComfortLevelName } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 20;

export default function WordsPage() {
  const [words, setWords] = useState<IWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof IWord;
    direction: "asc" | "desc";
  }>({ key: "count", direction: "desc" });
  const [selectedWord, setSelectedWord] = useState<IWord | null>(null);
  const [editTranslation, setEditTranslation] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [comfortFilter, setComfortFilter] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    const loadWords = async () => {
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

        const targetLang = settings?.user?.["target-lang"] || "en";

        const words = await db.words
          .where("language")
          .equals(targetLang)
          .toArray();

        setWords(words);
      } catch (error) {
        console.error("Error loading words:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWords();
  }, []);

  function safeStat(value: number, formatter?: (n: number) => string) {
    return isNaN(value) || !isFinite(value)
      ? "-"
      : formatter
      ? formatter(value)
      : value;
  }

  const timelineData = Array.from({ length: 12 }, (_, i) => {
    const currentDate = new Date();
    const targetMonth = currentDate.getMonth() - i;
    const targetYear = currentDate.getFullYear();

    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 1);

    const monthWords = words.filter(
      (w) =>
        w.date_created >= monthStart.getTime() &&
        w.date_created < monthEnd.getTime()
    );

    return {
      month: monthStart.toLocaleString("default", { month: "short" }),
      year: monthStart.getFullYear(),
      total: monthWords.length,
      ...Object.fromEntries(
        [/*1,*/ 2, 3, 4, 5].map((level) => [
          `level_${level}`,
          monthWords.filter((w) => w.comfort === level).length,
        ])
      ),
    };
  }).reverse();

  const sortedWords = [...words].sort((a, b) => {
    if (a[sortConfig.key]! < b[sortConfig.key]!)
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key]! > b[sortConfig.key]!)
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredWords = sortedWords.filter((word) => {
    const matchesSearch =
      word.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.translation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComfort = comfortFilter
      ? word.comfort === comfortFilter
      : true;
    return matchesSearch && matchesComfort;
  });

  const paginatedWords = filteredWords.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const comfortData = [1, 2, 3, 4, 5].map((level) => ({
    name: getComfortLevelName(level),
    value: words.filter((w) => w.comfort === level).length,
  }));

  const COMFORT_LEVELS = [
    {
      level: 1,
      name: "Unknown",
      color: "#f3f4f6", // bg-gray-100
      hoverColor: "#e5e7eb", // bg-gray-200
    },
    {
      level: 2,
      name: "Hard",
      color: "#fee2e2", // bg-red-100
      hoverColor: "#fca5a5", // bg-red-300
    },
    {
      level: 3,
      name: "Medium",
      color: "#fef9c3", // bg-yellow-100
      hoverColor: "#fde047", // bg-yellow-300
    },
    {
      level: 4,
      name: "Easy",
      color: "#dbeafe", // bg-blue-100
      hoverColor: "#93c5fd", // bg-blue-300
    },
    {
      level: 5,
      name: "Known",
      color: "#dcfce7", // bg-green-100
      hoverColor: "#86efac", // bg-green-300
    },
  ];

  const avgComfortValue =
    words.length > 0
      ? words.reduce((acc, w) => acc + w.comfort, 0) / words.length
      : null;

  const getAvgComfortLevel = (avg: number) => {
    const rounded = Math.round(avg);
    return (
      COMFORT_LEVELS.find((level) => level.level === rounded) ||
      COMFORT_LEVELS[0]
    );
  };

  const stats = {
    totalWords: words.length,

    knownWords: words.filter((w) => w.comfort === 5).length,

    avgComfort: {
      value: avgComfortValue?.toFixed(1) || "0.0",
      level: avgComfortValue ? getAvgComfortLevel(avgComfortValue) : null,
    },

    mostFrequent: [...words].sort((a, b) => b.count - a.count)[0]?.name || "-",

    newThisWeek: words.filter((w) => {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return w.comfort === 5 && w.date_created > oneWeekAgo;
    }).length,

    newThisMonth: words.filter((w) => {
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return w.comfort === 5 && w.date_created > oneMonthAgo;
    }).length,

    newThisYear: words.filter((w) => {
      const oneMonthAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      return w.comfort === 5 && w.date_created > oneMonthAgo;
    }).length,

    growthRate: (() => {
      const now = Date.now();

      // last 30 days
      const currentPeriodStart = now - 30 * 24 * 60 * 60 * 1000;
      const currentKnown = words.filter(
        (w) => w.comfort === 5 && w.date_created >= currentPeriodStart
      ).length;

      // 30-60 days ago
      const previousPeriodStart = now - 60 * 24 * 60 * 60 * 1000;
      const previousKnown = words.filter(
        (w) =>
          w.comfort === 5 &&
          w.date_created >= previousPeriodStart &&
          w.date_created < currentPeriodStart
      ).length;

      // Avoid division by zero
      if (previousKnown === 0) {
        return currentKnown > 0 ? 100 : 0; // 100% if there is new learned words, 0% otherwise
      }

      return ((currentKnown - previousKnown) / previousKnown) * 100;
    })(),
  };

  const handleSort = useCallback((key: keyof IWord) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const updateComfort = useCallback(
    async (wordId: number, newComfort: number) => {
      setUpdating(wordId);
      try {
        await db.words.update(wordId, { comfort: newComfort });
        setWords((prev) =>
          prev.map((word) =>
            word.id === wordId ? { ...word, comfort: newComfort } : word
          )
        );
      } catch (error) {
        console.error("Failed to update comfort level:", error);
        toast.error("Failed to update comfort level");
      } finally {
        setUpdating(null);
      }
    },
    []
  );

  const updateTranslation = useCallback(
    async (wordId: number) => {
      if (!editTranslation.trim()) return;
      try {
        await db.words.update(wordId, { translation: editTranslation });
        setWords((prev) =>
          prev.map((word) =>
            word.id === wordId
              ? { ...word, translation: editTranslation }
              : word
          )
        );
        setSelectedWord(null);
        toast.success("Translation updated");
      } catch (error) {
        console.error("Failed to update translation:", error);
        toast.error("Failed to update translation");
      }
    },
    [editTranslation]
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Header />

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-2 capitalize">
              Total Words
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {safeStat(stats.totalWords, (n) => n.toFixed(0))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-2 capitalize">
              Known Words
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {safeStat(stats.knownWords, (n) => n.toFixed(0))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-2 capitalize">
              Avg Comfort
            </div>
            <div className="flex items-center gap-2">
              {stats.avgComfort.level ? (
                <>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: stats.avgComfort.level.hoverColor,
                      boxShadow: `0 0 8px ${stats.avgComfort.level.hoverColor}80`,
                    }}
                  ></div>
                  <div className="text-2xl font-bold dark:text-white">
                    <span className="mr-2">{stats.avgComfort.value}</span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: stats.avgComfort.level.hoverColor }}
                    >
                      ({stats.avgComfort.level.name})
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold dark:text-white">-</div>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-2 capitalize">
              Most Frequent
            </div>
            <div className="text-2xl font-bold truncate dark:text-white">
              {stats.mostFrequent}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-2 capitalize">
              Last 7 days
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {stats.newThisWeek}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-2 capitalize">
              Last Month
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {stats.newThisMonth}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-2 capitalize">
              Last Year
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {stats.newThisYear}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-300 text-sm mb-2 capitalize">
              Growth Rate
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {safeStat(stats.growthRate, (n) => n.toFixed(1))}
              {" %"}
            </div>
          </div>
        </div>

        {/* Timeline Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Comfort Level Evolution
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value, index) => {
                    const year = timelineData[index].year.toString().slice(2);
                    return `${value} '${year}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    COMFORT_LEVELS.find((cl) => `level_${cl.level}` === name)
                      ?.name || name,
                  ]}
                />
                <Legend
                  formatter={(value: string) =>
                    COMFORT_LEVELS.find((cl) => `level_${cl.level}` === value)
                      ?.name || value
                  }
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                {COMFORT_LEVELS.map(({ level, hoverColor }) => (
                  <Bar
                    key={level}
                    dataKey={`level_${level}`}
                    name={`level_${level}`}
                    fill={hoverColor}
                    stackId="a"
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comfort Distribution Chart */}
          <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Comfort Level Distribution
            </h3>
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
                  {comfortData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COMFORT_LEVELS[index].hoverColor} // Usando as cores do seu padrão
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    COMFORT_LEVELS.find((cl) => cl.name === name)?.name || name,
                  ]}
                />
                <Legend
                  formatter={(value: string) =>
                    COMFORT_LEVELS.find((cl) => cl.name === value)?.name ||
                    value
                  }
                  wrapperStyle={{ paddingTop: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Search words..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
               dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
          </div>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
             dark:bg-gray-700/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={comfortFilter || ""}
            onChange={(e) =>
              setComfortFilter(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">All Comfort Levels</option>
            {[/*1, */ 2, 3, 4, 5].map((level) => (
              <option
                key={level}
                value={level}
                className="flex items-center gap-2"
              >
                <span
                  className={`w-3 h-3 rounded-full ${getComfortColor(level)}`}
                />
                {getComfortLevelName(level)}
              </option>
            ))}
          </select>
        </div>

        {/* Words Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto relative max-h-[600px]">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  {(["name", "translation", "comfort", "count"] as const).map(
                    (key) => (
                      <th
                        key={key}
                        className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort(key)}
                      >
                        <div className="flex items-center gap-2">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                          <SortIndicator
                            isActive={sortConfig.key === key}
                            direction={
                              sortConfig.key === key
                                ? sortConfig.direction
                                : undefined
                            }
                          />
                        </div>
                      </th>
                    )
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedWords.map((word) => (
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
                          onKeyPress={(e) =>
                            e.key === "Enter" && updateTranslation(word.id!)
                          }
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                          onClick={() => {
                            setSelectedWord(word);
                            setEditTranslation(word.translation || "");
                          }}
                        >
                          {word.translation || "Add translation"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${getComfortColor(
                            word.comfort
                          )}`}
                        />
                        <select
                          value={word.comfort}
                          onChange={(e) =>
                            updateComfort(word.id!, Number(e.target.value))
                          }
                          className="border rounded px-2 py-1 dark:bg-gray-600 dark:text-white"
                          disabled={updating === word.id}
                        >
                          {updating === word.id ? (
                            <option>Updating...</option>
                          ) : (
                            [1, 2, 3, 4, 5].map((num) => (
                              <option key={num} value={num}>
                                {num} ({getComfortLevelName(num)})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {word.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      <button
                        className="text-red-500 hover:text-red-700 dark:text-red-400 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this word?"
                            )
                          ) {
                            db.words.delete(word.id!);
                            setWords((prev) =>
                              prev.filter((w) => w.id !== word.id)
                            );
                            toast.success("Word deleted");
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
            {filteredWords.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <h3 className="text-xl font-medium dark:text-white">No words found</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or add new words through articles
                  </p>
                </div>
              )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-600 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-300">
              Page {currentPage + 1} of{" "}
              {Math.ceil(filteredWords.length / PAGE_SIZE)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(
                    p + 1,
                    Math.ceil(filteredWords.length / PAGE_SIZE) - 1
                  )
                )
              }
              disabled={
                currentPage === Math.ceil(filteredWords.length / PAGE_SIZE) - 1
              }
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-600 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SortIndicator = ({
  isActive,
  direction,
}: {
  isActive: boolean;
  direction?: "asc" | "desc";
}) => (
  <span className="ml-2">
    {!isActive && "↕"}
    {isActive && (direction === "asc" ? "↑" : "↓")}
  </span>
);

// Sub-components for better organization

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
    </div>
  </div>
);

const Header = () => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-6">
      <Link
        href="/"
        className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700"
      >
        <ChevronLeftIcon className="w-5 h-5 mr-2" />
        Back to Texts
      </Link>
    </div>
    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
      Words
    </h1>
  </div>
);
