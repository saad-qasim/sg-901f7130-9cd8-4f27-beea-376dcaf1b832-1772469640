
import Link from "next/link";
import { Home } from "lucide-react";

export default function HomeButton() {
  return (
    <Link
      href="/"
      className="no-print inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 text-blue-700 dark:text-blue-300 font-medium text-sm border border-blue-200 dark:border-blue-800 transition-all duration-200 hover:shadow-md hover:scale-105"
    >
      <Home size={18} />
      <span>الرئيسية</span>
    </Link>
  );
}
