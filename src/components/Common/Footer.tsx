import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-t border-gray-100/50 dark:border-gray-700/30 mt-24 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        <div className="absolute -top-32 -left-48 w-96 h-96 bg-purple-100 dark:bg-purple-900/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -top-20 -right-24 w-64 h-64 bg-pink-100 dark:bg-pink-900/30 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Subtle grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 dark:opacity-10" />

      <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                P
              </span>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                Palaviva
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Immerse yourself in language learning through contextual content. 
              Discover the beauty of words in their natural habitat.
            </p>
          </div>

          {/* Links Sections */}
          {['Learn', 'Company', 'Support'].map((section, idx) => (
            <div key={idx} className="space-y-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider border-l-4 border-purple-600 dark:border-purple-400 pl-3">
                {section}
              </h4>
              <ul className="space-y-3">
                {getLinks(section).map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      className="flex items-center group text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-all duration-300"
                    >
                      <span className="w-2 h-2 bg-purple-600/0 rounded-full mr-3 group-hover:bg-purple-600 transition-all duration-300"></span>
                      {link.label}
                      <svg
                        className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright Section */}
        <div className="mt-16 pt-8 border-t border-gray-200/50 dark:border-gray-700/30 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Palaviva. Crafted with ♡ for language lovers.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(3deg); }
          66% { transform: translateY(20px) rotate(-3deg); }
        }
        .animate-float {
          animation: float 12s infinite ease-in-out;
        }
        .animate-float-delayed {
          animation: float 14s 2s infinite ease-in-out;
        }
      `}</style>
    </footer>
  );
}

function getLinks(section: string) {
  switch (section) {
    case 'Learn':
      return [
        { href: "/getting-started", label: "Getting Started" },
        { href: "/best-practices", label: "Best Practices" },
      ];
    case 'Company':
      return [        
        { href: "/about", label: "About Us" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },        
      ];
    case 'Support':
      return [
        { href: "/help", label: "Help Center" },
        { href: "/contact", label: "Contact Us" },
      ];
    default:
      return [];
  }
}