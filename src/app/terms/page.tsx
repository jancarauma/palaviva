"use client";

import Link from "next/link";
import { ChevronLeftIcon, ScaleIcon } from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";

export default function TermsPage() {
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
            {/*<ScaleIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />*/}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-fuchsia-400">
              Terms of Service
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-8">
          <p className="text-gray-600 dark:text-gray-400">
            By using Palaviva ("the Service"), you agree to be bound by these Terms of Service.
            Please read them carefully before using our language learning platform.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              1. Acceptance of Terms
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
              <li>You must be at least 13 years old to use the Service</li>
              <li>You agree to comply with all applicable laws and regulations</li>
              <li>You are responsible for maintaining the security of your account</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              2. User Responsibilities
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload illegal or harmful content</li>
                <li>Reverse engineer or attempt to hack the Service</li>
                <li>Use the Service for any commercial purposes without authorization</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              3. Intellectual Property
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>
                Palaviva and its original content, features, and functionality are owned by 
                the Palaviva team and are protected by international copyright, trademark, 
                and other intellectual property laws.
              </p>
              <p>
                You retain ownership of the content you create, but grant us a worldwide,
                non-exclusive license to store and display it through the Service.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              4. Termination
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We reserve the right to terminate or suspend access to our Service immediately, 
              without prior notice, for any breach of these Terms. All provisions of the Terms 
              which by their nature should survive termination shall survive.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              5. Disclaimer of Warranty
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>The Service is provided "AS IS" without any warranties. We do not guarantee:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Uninterrupted or error-free service</li>
                <li>Accuracy of language learning content</li>
                <li>Results from using the Service</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              6. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              In no event shall Palaviva be liable for any indirect, incidental, special, 
              or consequential damages arising out of or in connection with your use of the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              7. Governing Law
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              These Terms shall be governed by and construed in accordance with the laws of 
              Canada, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Contact Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                For questions about these Terms, please contact us at:<br />
                <a 
                  href="mailto:legal@palaviva.app" 
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  legal@palaviva.app
                </a>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Effective Date: 2025, April 12.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}