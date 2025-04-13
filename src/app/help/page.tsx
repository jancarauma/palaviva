"use client";

import Link from "next/link";
import { ChevronLeftIcon, LifebuoyIcon, DocumentTextIcon, PhoneIcon, BugAntIcon, BookOpenIcon, UserGroupIcon, PlayCircleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";

export default function HelpCenterPage() {
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
            <LifebuoyIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
              Help Center
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-8">
          {/* Quick Help Grid */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Popular Topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: DocumentTextIcon,
                  title: "Creating & Managing Texts",
                  link: "/help/articles/text-management"
                },
                {
                  icon: BugAntIcon,
                  title: "Troubleshooting Common Issues",
                  link: "/help/articles/troubleshooting"
                },
                {
                  icon: BookOpenIcon,
                  title: "Using Learning Features",
                  link: "/help/articles/learning-features"
                },
                {
                  icon: Cog6ToothIcon,
                  title: "Account & Settings",
                  link: "/help/articles/account-settings"
                }
              ].map((topic, index) => (
                <Link
                  key={index}
                  href={topic.link}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 flex items-start gap-3"
                >
                  <topic.icon className="w-6 h-6 mt-1 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-400">{topic.title}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  question: "How do I change my target language?",
                  answer: "Navigate to Settings > Language Preferences to update your learning language."
                },
                {
                  question: "Where are my texts stored?",
                  answer: "All content is stored locally in your browser. We don't store your texts on our servers."
                },
                {
                  question: "Can I export my learning data?",
                  answer: "Yes! Use the Export feature in Settings to download your progress."
                }
              ].map((faq, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Need More Help?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-4">
                  <PhoneIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    Contact Support
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our team typically responds within 24 hours
                </p>
                <a
                  href="mailto:support@palaviva.app"
                  className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-500 transition-colors"
                >
                  Email Support →
                </a>
              </div>

              <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-4">
                  <BugAntIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    Troubleshooting Checklist
                  </h3>
                </div>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Clear browser cache</li>
                  <li>Check for updates</li>
                  <li>Try incognito mode</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Resources Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Additional Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "Documentation",
                  icon: DocumentTextIcon,
                  link: "/docs"
                },
                {
                  title: "Community Forum",
                  icon: UserGroupIcon,
                  link: "/community"
                },
                {
                  title: "Video Guides",
                  icon: PlayCircleIcon,
                  link: "/tutorials"
                }
              ].map((resource, index) => (
                <Link
                  key={index}
                  href={resource.link}
                  className="p-4 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 text-center"
                >
                  <resource.icon className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <span className="text-gray-600 dark:text-gray-400">{resource.title}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Footer */}
          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Palaviva Help Center • Updated {new Date().toLocaleDateString()}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}