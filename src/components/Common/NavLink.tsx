import Link from "next/link";

export default function NavLink({
  href,
  currentView,
  targetView,
  children,
}: {
  href: string;
  currentView: string;
  targetView: string;
  children: React.ReactNode;
}) {
  const isActive = currentView === targetView;

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive
          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
          : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/20"
      } transition-colors duration-200`}
    >
      {children}
    </Link>
  );
}
