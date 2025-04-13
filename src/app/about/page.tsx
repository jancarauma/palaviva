"use client";

import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { BookOpenIcon, CodeBracketIcon, HeartIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { Toaster } from "react-hot-toast";

export default function AboutPage() {
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

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
            About Palaviva
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-8">
          {/* Mission Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Our Mission
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Palaviva is an open-source language learning platform designed to help 
              learners immerse themselves in authentic content. We believe in learning 
              through meaningful context rather than isolated vocabulary drills.
            </p>
          </section>

          {/* Features Grid */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: BookOpenIcon,
                  title: "Contextual Learning",
                  description: "Learn vocabulary through authentic texts and real-world content"
                },
                {
                  icon: UserGroupIcon,
                  title: "Community Driven",
                  description: "Share and learn from content contributed by other learners"
                },
                {
                  icon: CodeBracketIcon,
                  title: "Open Source",
                  description: "Transparent development with community contributions"
                },
                {
                  icon: HeartIcon,
                  title: "Free Forever",
                  description: "Commitment to accessible language education for all"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600"
                >
                  <feature.icon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Tech Stack */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Technology Stack
            </h2>
            <div className="flex flex-wrap gap-3">
              {["Next.js", "TypeScript", "Tailwind CSS", "IndexedDB", "React Hook Form", "Vercel"].map((tech, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* Open Source Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Contribute to Palaviva
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We're open source and welcome contributions! Join our community of 
              developers and language enthusiasts to help improve Palaviva.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/jancarauma/palaviva"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 rounded-lg bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <CodeBracketIcon className="w-5 h-5" />
                View on GitHub
              </a>
              <Link
                href="/docs"
                className="px-6 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                Documentation
              </Link>
            </div>
          </section>

          {/* License Section */}
          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Palaviva is licensed under MIT License • Made with ❤️ for language learners worldwide
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}