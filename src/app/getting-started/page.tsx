"use client";

import Link from "next/link";
import { ChevronLeftIcon, RocketLaunchIcon, BookOpenIcon, ChartBarIcon, UserGroupIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";

export default function GettingStartedPage() {
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
            <RocketLaunchIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
              Get Started with Palaviva
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-8">
          {/* Welcome Section */}
          <section className="space-y-4 text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Start your language learning journey in 4 simple steps
            </p>
            <div className="flex justify-center gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">1</div>
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center">2</div>
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center">3</div>
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center">4</div>
            </div>
          </section>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: BookOpenIcon,
                title: "1. Create Your First Text",
                description: "Start by adding content in your target language",
                action: (
                  <Link
                    href="/create"
                    className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
                  >
                    Create New Text →
                  </Link>
                )
              },
              {
                icon: ChartBarIcon,
                title: "2. Practice",
                description: "Choose an article and start practicing",
                action: (
                  <Link
                    href="/"
                    className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
                  >
                    Start Practicing →
                  </Link>
                )
              },
              {
                icon: UserGroupIcon,
                title: "3. Track Your Progress",
                description: "Monitor your learning statistics and milestones",
                action: (
                  <Link
                    href="/words"
                    className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
                  >
                    View Words →
                  </Link>
                )
              },
              {
                icon: Cog6ToothIcon,
                title: "4. Customize Settings",
                description: "Adjust preferences for optimal learning",
                action: (
                  <Link
                    href="/settings"
                    className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
                  >
                    Configure Settings →
                  </Link>
                )
              }
            ].map((step, index) => (
              <div 
                key={index}
                className="p-6 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
              >
                <step.icon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {step.description}
                </p>
                <div className="mt-2">
                  {step.action}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tips Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Pro Tips for Success
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                "Start with short texts (300-500 words)",
                "Review daily for 15-20 minutes",
                "Use the vocabulary tracker",
                "Enable spaced repetition",
                "Participate in community challenges",
                "Adjust reading speed gradually"
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

          {/* Stats Section */}
          <section className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">10k+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Learners</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Languages Supported</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">1M+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Words Processed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">95%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Rate</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}