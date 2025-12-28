"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWordStore } from "@/lib/store";
import { useIrregularVerbStore } from "@/lib/irregularVerbsStore";
import { getDefaultWords } from "@/lib/defaultWords";
import { getDefaultIrregularVerbs } from "@/lib/defaultIrregularVerbs";
import { validateWords } from "@/lib/parser";
import { validateIrregularVerbs } from "@/lib/irregularVerbsParser";
import { Button } from "@/components/ui/Button";

export default function WelcomePage() {
  const router = useRouter();
  const { words, loadWords, addWords } = useWordStore();
  const { verbs, loadVerbs, addVerbs } = useIrregularVerbStore();
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);

  useEffect(() => {
    loadWords();
    loadVerbs();
  }, [loadWords, loadVerbs]);

  const hasWords = words.length > 0;
  const hasVerbs = verbs.length > 0;

  const handleLoadDefaults = async () => {
    setIsLoadingDefaults(true);
    try {
      const defaultWords = await getDefaultWords();
      const { valid } = validateWords(defaultWords, words);
      
      if (valid.length > 0) {
        const wordsToAdd = valid.map((w) => ({
          word: w.word,
          translation: w.translation,
          transcription: w.transcription,
          tags: w.tags,
          box: 1,
          nextReviewDate: Date.now(),
        }));
        
        await addWords(wordsToAdd);
        await loadWords();
      }
    } catch (error) {
      console.error("Ошибка загрузки предустановленных слов:", error);
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  const handleLoadDefaultVerbs = async () => {
    setIsLoadingDefaults(true);
    try {
      const defaultVerbs = await getDefaultIrregularVerbs();
      const { valid } = validateIrregularVerbs(defaultVerbs, verbs);
      
      if (valid.length > 0) {
        const verbsToAdd = valid.map((v) => ({
          infinitive: v.infinitive,
          pastSimple: v.pastSimple,
          pastParticiple: v.pastParticiple,
          translation: v.translation,
          box: 1,
          nextReviewDate: Date.now(),
        }));
        
        await addVerbs(verbsToAdd);
        await loadVerbs();
      }
    } catch (error) {
      console.error("Ошибка загрузки предустановленных глаголов:", error);
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-4xl w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            LexiFlow
          </h1>
          <p className="text-base sm:text-lg text-gray-300 px-2">
            Персональный словарь с системой интервальных повторений
          </p>
        </div>

        {/* Statistics Cards */}
        {(hasWords || hasVerbs) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hasWords && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Слов в словаре</p>
                    <p className="text-2xl sm:text-3xl font-bold text-indigo-400">{words.length}</p>
                  </div>
                  <div className="text-3xl sm:text-4xl">📚</div>
                </div>
              </div>
            )}
            {hasVerbs && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Глаголов в словаре</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-400">{verbs.length}</p>
                  </div>
                  <div className="text-3xl sm:text-4xl">🔤</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Изучение слов */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700 hover:border-indigo-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl">📖</div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Слова</h2>
            </div>
            <div className="space-y-2">
              {!hasWords ? (
                <Button
                  onClick={handleLoadDefaults}
                  disabled={isLoadingDefaults}
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoadingDefaults}
                >
                  Загрузить слова
                </Button>
              ) : (
                <>
                  <Link
                    href="/study"
                    className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg text-center"
                  >
                    ✨ Изучать
                  </Link>
                  <Link
                    href="/add"
                    className="block w-full bg-indigo-600/80 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                  >
                    + Добавить слова
                  </Link>
                  {hasWords && (
                    <Link
                      href="/test"
                      className="block w-full bg-purple-600/80 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                    >
                      🧪 Тест
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Изучение глаголов */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700 hover:border-green-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl">🔤</div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Глаголы</h2>
            </div>
            <div className="space-y-2">
              {!hasVerbs ? (
                <Button
                  onClick={handleLoadDefaultVerbs}
                  disabled={isLoadingDefaults}
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoadingDefaults}
                >
                  Загрузить глаголы
                </Button>
              ) : (
                <>
                  <Link
                    href="/irregular-verbs"
                    className="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg text-center"
                  >
                    ✨ Изучать
                  </Link>
                  <Link
                    href="/add-irregular-verbs"
                    className="block w-full bg-indigo-600/80 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                  >
                    + Добавить глаголы
                  </Link>
                  {hasVerbs && (
                    <Link
                      href="/test-irregular-verbs"
                      className="block w-full bg-purple-600/80 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                    >
                      🧪 Тест
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Статистика и настройки */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700 hover:border-purple-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl">📊</div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Статистика</h2>
            </div>
            <div className="space-y-2">
              <Link
                href="/stats"
                className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg text-center"
              >
                📈 Просмотр статистики
              </Link>
              <div className="text-xs text-gray-400 pt-2 text-center">
                Прогресс обучения
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs sm:text-sm text-gray-400">
            🔒 Ваши данные хранятся только на этом устройстве
          </p>
        </div>
      </div>
    </div>
  );
}

