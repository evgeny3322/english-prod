"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWordStore } from "@/lib/store";

export default function WelcomePage() {
  const router = useRouter();
  const { words, loadWords } = useWordStore();

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const hasWords = words.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            LexiFlow
          </h1>
          <p className="text-lg text-gray-300">
            Персональный словарь с системой интервальных повторений
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Link
            href="/add"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg"
          >
            Добавить слова
          </Link>

          {hasWords && (
            <>
              <Link
                href="/study"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg"
              >
                Карточки
              </Link>
              <Link
                href="/test"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg"
              >
                Тест
              </Link>
            </>
          )}
        </div>

        <p className="text-sm text-gray-400 pt-4">
          Ваши данные хранятся только на этом устройстве
        </p>
      </div>
    </div>
  );
}

