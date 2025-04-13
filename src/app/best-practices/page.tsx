"use client";

import Link from "next/link";
import { ChevronLeftIcon, LightBulbIcon, BookmarkIcon, ClockIcon, ArrowsPointingOutIcon, SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";

export default function BestPracticesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
      
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

          <div className="flex items-center gap-3 mb-6">
            <LightBulbIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
              Language Learning Best Practices
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-8">
          {/* Key Principles */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Core Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: ClockIcon,
                  title: "Consistency",
                  text: "15-20 minutes daily > 3 hours weekly"
                },
                {
                  icon: ArrowsPointingOutIcon,
                  title: "Context",
                  text: "Learn words in meaningful phrases"
                },
                {
                  icon: SpeakerWaveIcon,
                  title: "Immersion",
                  text: "Combine reading with listening"
                }
              ].map((principle, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-start gap-3"
                >
                  <principle.icon className="w-6 h-6 mt-1 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">{principle.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{principle.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reading Strategies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Effective Reading Strategies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: BookmarkIcon,
                  title: "The 90/10 Rule",
                  content: "Focus 90% on comprehension, 10% on lookups",
                  tips: [
                    "Read entire paragraphs before checking words",
                    "Highlight only key unknown vocabulary",
                    "Use context clues first"
                  ]
                },
                {
                  icon: ClockIcon,
                  title: "Spaced Repetition",
                  content: "Optimize review timing for retention",
                  tips: [
                    "Review new words after 1 day, 3 days, 1 week",
                    "Use built-in SRS system",
                    "Focus on troublesome items"
                  ]
                }
              ].map((strategy, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <strategy.icon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {strategy.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {strategy.content}
                  </p>
                  <ul className="space-y-2">
                    {strategy.tips.map((tip, tipIndex) => (
                      <li 
                        key={tipIndex}
                        className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                      >
                        <div className="w-2 h-2 mt-2 rounded-full bg-purple-600" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Vocabulary Building */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Vocabulary Acquisition Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                "Focus on high-frequency words first",
                "Learn word families (run, runner, running)",
                "Create personal examples",
                "Use mnemonics for tough words",
                "Practice active recall",
                "Group related vocabulary"
              ].map((tip, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-start gap-3"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-purple-600" />
                  <span className="text-gray-600 dark:text-gray-400">{tip}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Pro Tips Section */}
          <section className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <LightBulbIcon className="w-6 h-6 mt-1 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Expert Recommendation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                &quot;Aim for 98% comprehension in chosen texts. Use the 
                  <Link href="/difficulty-selector" className="text-purple-600 dark:text-purple-400 hover:underline mx-1">
                    difficulty selector
                  </Link> 
                  to find appropriate material. Gradually increase complexity as your skills improve.&quot;
                </p>
              </div>
            </div>
          </section>

          {/* Resources Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Next Steps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/community/tips"
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <h3 className="text-purple-600 dark:text-purple-400 font-medium mb-2">
                  Community Tips →
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Learn from successful language learners
                </p>
              </Link>
              <Link
                href="/settings#learning-preferences"
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <h3 className="text-purple-600 dark:text-purple-400 font-medium mb-2">
                  Optimize Settings →
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure your learning preferences
                </p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}