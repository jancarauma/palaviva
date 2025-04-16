import Link from "next/link";

export default function NavLink({
  href,
  currentView,
  targetView,
  children,
  className,
}: {
  href: string;
  currentView: string;
  targetView: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = currentView === targetView;

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive
          ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
          : "text-gray-600 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100 hover:bg-purple-50 dark:hover:bg-purple-700/20"
      } transition-colors duration-200 ${className ? className : ''}`}
    >
      {children}
    </Link>
  );
}
