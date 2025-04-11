"use client";

import { useEffect, useState } from "react";
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

const COLORS = ["#ff4444", "#ffbb33", "#00C851", "#33b5e5", "#2BBBAD"];
const PAGE_SIZE = 20;

export default function WordsPage() {
  const [words, setWords] = useState<IWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof IWord;
    direction: "asc" | "desc";
  }>({
    key: "count",
    direction: "desc",
  });
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
              "trunk-version": "0.0.1",
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
        [1, 2, 3, 4, 5].map((level) => [
          `level_${level}`,
          monthWords.filter((w) => w.comfort === level).length,
        ])
      ),
    };
  }).reverse();

  const comfortColors = ["#ff4444", "#ffbb33", "#00C851", "#33b5e5", "#2BBBAD"];

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

  const stats = {
    totalWords: words.length,
    knownWords: words.filter((w) => w.comfort === 5).length,
    avgComfort: (
      words.reduce((acc, w) => acc + w.comfort, 0) / words.length
    ).toFixed(1),
    mostFrequent: [...words].sort((a, b) => b.count - a.count)[0]?.name || "-",
    newThisWeek: words.filter((w) => {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return w.date_created > oneWeekAgo;
    }).length,

    newThisMonth: words.filter((w) => {
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return w.date_created > oneMonthAgo;
    }).length,

    newThisYear: words.filter((w) => {
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      return w.date_created > oneYearAgo;
    }).length,

    growthRate:
      (words.filter((w) => {
        const lastMonth = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return w.date_created > lastMonth;
      }).length /
        words.length) *
        100 || 0,
  };

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

  const handleSort = (key: keyof IWord) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const updateComfort = async (wordId: number, newComfort: number) => {
    setUpdating(wordId);
    try {
      await db.words.update(wordId, { comfort: newComfort });
      setWords((prev) =>
        prev.map((word) =>
          word.id === wordId ? { ...word, comfort: newComfort } : word
        )
      );
    } catch (error) {
      console.error("Error updating comfort level:", error);
    } finally {
      setUpdating(null);
    }
  };

  const updateTranslation = async (wordId: number) => {
    if (!editTranslation.trim()) return;

    try {
      await db.words.update(wordId, { translation: editTranslation });
      setWords((prev) =>
        prev.map((word) =>
          word.id === wordId ? { ...word, translation: editTranslation } : word
        )
      );
      setSelectedWord(null);
    } catch (error) {
      console.error("Error updating translation:", error);
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Words Dashboard
          </h1>
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
          >
            &larr; Back to texts
          </Link>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">
              Total Words
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {safeStat(stats.totalWords, (n) => n.toFixed(0))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">
              Known Words
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {safeStat(stats.knownWords, (n) => n.toFixed(0))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">
              Avg Comfort
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {stats.avgComfort ?? "---"}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">
              Most Frequent
            </div>
            <div className="text-2xl font-bold truncate dark:text-white">
              {stats.mostFrequent}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">
              Last 7 days
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {stats.newThisWeek}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">
              Last Month
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {stats.newThisMonth}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">
              Last Year
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {stats.newThisYear}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-gray-500 dark:text-gray-300 text-sm">
              Growth Rate
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {safeStat(stats.growthRate, (n) => n.toFixed(1))}
              {" %"}
            </div>
          </div>
        </div>

        {/* Timeline Distribution Chart */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
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
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
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
                  COMFORT_LEVELS.find((cl) => cl.name === value)?.name || value
                }
                wrapperStyle={{ paddingTop: "10px" }}
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
            value={comfortFilter || ""}
            onChange={(e) =>
              setComfortFilter(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">All Comfort Levels</option>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {getComfortLevelName(level)}
              </option>
            ))}
          </select>
        </div>

        {/* Words Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto relative max-h-[500px]">
            <table className="w-full min-w-[800px] sticky top-0">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {(["name", "translation", "comfort", "count"] as const).map(
                    (key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort(key)}
                      >
                        <div className="flex items-center">
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
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredWords.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-4">📭</div>
                  <h3 className="text-xl font-medium">No words found</h3>
                  <p className="mt-2">
                    Try adjusting your filters or add new words.
                  </p>
                </div>
              )}
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-600 rounded-md disabled:opacity-50 dark:text-white"
            >
              Previous
            </button>
            <span className="dark:text-gray-300">
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

function getComfortLevelName(comfort: number): string {
  switch (comfort) {
    case 1:
      return "Unknown";
    case 2:
      return "Hard";
    case 3:
      return "Medium";
    case 4:
      return "Easy";
    case 5:
      return "Known";
    default:
      return "Unknown";
  }
}

function getComfortColor(level: number): string {
  return [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-300",
    "bg-green-500",
  ][level - 1];
}
