"use client";

import Link from "next/link";
import { ChevronLeftIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";

export default function PrivacyPage() {
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
            <LockClosedIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
              Privacy Policy
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-8">
          <p className="text-gray-600 dark:text-gray-400">
            At Palaviva, we take your privacy seriously. This policy explains how we handle your information 
            in our language learning application.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
              <li>
                <span className="font-medium">Usage Data:</span> Anonymous interaction metrics to improve the app.
              </li>
              <li>
                <span className="font-medium">Technical Information:</span> Browser type, OS version, and device information
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Data Usage
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>We use collected data to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our service</li>
                <li>Improve language learning algorithms</li>
                <li>Develop new features</li>
                <li>Ensure application security</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Data Storage & Security
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>
                Your data is stored locally in your browser using IndexedDB.
              </p>
              <div className="flex items-center gap-2 mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <LockClosedIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <span className="text-sm">
                  We implement industry-standard security measures to protect your data
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Third-party Services
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>
                We use these trusted third-party services:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vercel (Hosting)</li>
                <li>GitHub (Code Repository)</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Policy Changes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We may update this policy periodically. Significant changes will be notified 
              through the application interface. Continued use after changes constitutes 
              acceptance of the revised policy.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Contact Us
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                For privacy-related inquiries, please contact us at:<br />
                <a 
                  href="mailto:privacy@palaviva.app" 
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  privacy@palaviva.app
                </a>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Last updated: 2025 April, 12.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}