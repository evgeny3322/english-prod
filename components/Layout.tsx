"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const isWelcome = pathname === "/welcome" || pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gradient-to-br from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href="/welcome"
                className="flex items-center px-2 py-2 text-xl font-bold text-indigo-400"
              >
                LexiFlow
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/welcome"
                className={clsx(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/welcome"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                )}
              >
                Главная
              </Link>
              <Link
                href="/add"
                className={clsx(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/add"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                )}
              >
                Добавить
              </Link>
              <Link
                href="/study"
                className={clsx(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/study"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                )}
              >
                Карточки
              </Link>
              <Link
                href="/test"
                className={clsx(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/test"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                )}
              >
                Тест
              </Link>
              <Link
                href="/stats"
                className={clsx(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/stats"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                )}
              >
                Статистика
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}

