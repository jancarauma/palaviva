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
} from "recharts";
import { IWord } from "@/lib/db/types";
import { getComfortLevelName } from "@/lib/utils";
import { toast, Toaster } from "react-hot-toast";
import {
  ChevronLeftIcon,
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 20;

export default function WordsPage() {
  const [targetLanguageName, setTargetLanguageName] = useState("");
  const [words, setWords] = useState<IWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig/*, setSortConfig*/] = useState<{
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

        const language = await db.languages
          .where("iso_639_1")
          .equalsIgnoreCase(targetLang)
          .first();
        setTargetLanguageName(language?.name || "Unknown");

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

  /*function safeStat(value: number, formatter?: (n: number) => string) {
    return isNaN(value) || !isFinite(value)
      ? "-"
      : formatter
      ? formatter(value)
      : value;
  }*/

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
        [1, 2, 3, 4, 5].map((level) => [
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

  /*const stats = {
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
  };*/

  const stats = [
    {
      key: "totalWords",
      label: "Total Words",
      value: words.length,
    },
    {
      key: "knownWords",
      label: "Known Words",
      value: words.filter((w) => w.comfort === 5).length,
    },
    {
      key: "avgComfort",
      label: "Avg. Comfort",
      value: avgComfortValue?.toFixed(1) || "0.0",
      level: avgComfortValue ? getAvgComfortLevel(avgComfortValue) : null,
    },
    {
      key: "mostFrequent",
      label: "Most Frequent",
      value: [...words].sort((a, b) => b.count - a.count)[0]?.name || "-",
    },
    {
      key: "newThisWeek",
      label: "Last 7 Days",
      value: words.filter((w) => {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return w.comfort === 5 && w.date_created > oneWeekAgo;
      }).length,
    },
    {
      key: "newThisMonth",
      label: "Last Month",
      value: words.filter((w) => {
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return w.comfort === 5 && w.date_created > oneMonthAgo;
      }).length,
    },
    {
      key: "newThisYear",
      label: "Last Year",
      value: words.filter((w) => {
        const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
        return w.comfort === 5 && w.date_created > oneYearAgo;
      }).length,
    },
    {
      key: "growthRate",
      label: "Growth Rate",
      value: (() => {
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

        return ((currentKnown - previousKnown) / (previousKnown ?? 1)) * 100;
      })(),
      suffix: "%",
    },
  ];

  /*const handleSort = useCallback((key: keyof IWord) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);*/

  const updateComfort = useCallback(
    async (wordId: number, newComfort: number) => {
      setUpdating(wordId);
      console.info("wordId", updating);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <DocumentChartBarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
              Words in {targetLanguageName}
            </h1>
          </div>

          {/* Animated background elements */}
          <div className="absolute -top-24 -right-32 w-96 h-96 bg-purple-100/50 dark:bg-purple-900/20 rounded-full blur-3xl animate-float -z-10"></div>
        </div>

        {/* Enhanced Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/30 hover:shadow-lg transition-all"
            >
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {stat.label}
              </div>
              <div className="text-2xl font-bold dark:text-white">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
                {stat.suffix}

                {stat.key === "avgComfort" && stat.level && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{
                        backgroundColor: stat.level.hoverColor,
                        boxShadow: `0 0 12px ${stat.level.hoverColor}80`,
                      }}
                    ></div>
                    <span
                      className="text-sm"
                      style={{ color: stat.level.hoverColor }}
                    >
                      {stat.level.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/30">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Comfort Evolution
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#6B7280" }}
                    tickFormatter={(value, index) =>
                      `${value} &apos;${timelineData[index].year
                        .toString()
                        .slice(2)}`
                    }
                  />
                  <YAxis tick={{ fill: "#6B7280" }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(4px)",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  {COMFORT_LEVELS.map(({ level, hoverColor }) => (
                    <Bar
                      key={level}
                      dataKey={`level_${level}`}
                      stackId="a"
                      fill={hoverColor}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/30">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Comfort Distribution
            </h3>
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={comfortData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {comfortData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COMFORT_LEVELS[index].hoverColor}
                        className="hover:drop-shadow-xl transition-all"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(4px)",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="mb-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search words..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/70 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" />
            </div>
            <select
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjYgOSAxMiAxNSAxOCA5Ii8+PC9zdmc+')] bg-no-repeat bg-[center_right_1rem]"
              value={comfortFilter || ""}
              onChange={(e) =>
                setComfortFilter(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">All Comfort Levels</option>
              {COMFORT_LEVELS.slice(1).map((level) => (
                <option key={level.level} value={level.level}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enhanced Words Table */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100/50 dark:border-gray-700/30 overflow-hidden">
          <div className="overflow-x-auto relative">
            <div className="min-w-[1000px]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100/50 dark:border-gray-600/30 font-medium text-sm text-gray-500 dark:text-gray-400">
                {["Word", "Translation", "Comfort", "Count", "Actions"].map(
                  (header) => (
                    <div key={header} className="col-span-2 last:col-span-4">
                      {header}
                    </div>
                  )
                )}
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100/50 dark:divide-gray-700/30">
                {paginatedWords.map((word) => (
                  <div
                    key={word.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {/* Word */}
                    <div className="col-span-2 font-medium dark:text-white">
                      {word.name}
                    </div>

                    {/* Translation */}
                    <div className="col-span-2">
                      {selectedWord?.id === word.id ? (
                        <input
                          type="text"
                          value={editTranslation}
                          onChange={(e) => setEditTranslation(e.target.value)}
                          onBlur={() => updateTranslation(word.id!)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && updateTranslation(word.id!)
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-white/70 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedWord(word);
                            setEditTranslation(word.translation || "");
                          }}
                          className="text-left w-full px-3 py-1.5 rounded-lg hover:bg-gray-100/30 dark:hover:bg-gray-600/30 transition-colors"
                        >
                          {word.translation || "Add translation"}
                        </button>
                      )}
                    </div>

                    {/* Comfort Level */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-8 h-8 flex items-center justify-center"
                          style={{
                            color: COMFORT_LEVELS[word.comfort - 1].hoverColor,
                          }}
                        >
                          <svg className="absolute inset-0" viewBox="0 0 32 32">
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              className="stroke-current opacity-20"
                              strokeWidth="4"
                              fill="none"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            {word.comfort}
                          </span>
                        </div>
                        <select
                          value={word.comfort}
                          onChange={(e) =>
                            updateComfort(word.id!, Number(e.target.value))
                          }
                          className="bg-transparent border-none focus:ring-0 cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>
                              {getComfortLevelName(num)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Count */}
                    <div className="col-span-2 dark:text-white">
                      {word.count}
                    </div>

                    {/* Actions */}
                    <div className="col-span-4 flex items-center gap-4">
                      <button
                        onClick={() => {
                          if (confirm("Delete this word?")) {
                            db.words.delete(word.id!);
                            setWords((prev) =>
                              prev.filter((w) => w.id !== word.id)
                            );
                            toast.success("Word deleted");
                          }
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 px-3 py-1 rounded-md hover:bg-red-50/30 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {filteredWords.length === 0 && (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <h3 className="text-xl font-medium dark:text-white mb-2">
                    No words found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your filters or add new words through articles
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Pagination */}
          <div className="flex justify-between items-center p-4 bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-100/50 dark:border-gray-600/30">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 rounded-lg bg-white/70 dark:bg-gray-600/30 shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
              >
                Previous
              </button>
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
                  currentPage ===
                  Math.ceil(filteredWords.length / PAGE_SIZE) - 1
                }
                className="px-4 py-2 rounded-lg bg-white/70 dark:bg-gray-600/30 shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              Page {currentPage + 1} of{" "}
              {Math.ceil(filteredWords.length / PAGE_SIZE)}
            </span>
          </div>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 opacity-20 dark:opacity-30">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-100/50 dark:bg-purple-900/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-pink-100/50 dark:bg-pink-900/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(3deg);
          }
          66% {
            transform: translateY(20px) rotate(-3deg);
          }
        }
        .animate-float {
          animation: float 12s infinite ease-in-out;
        }
        .animate-float-delayed {
          animation: float 14s 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

/*const SortIndicator = ({
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
);*/

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
