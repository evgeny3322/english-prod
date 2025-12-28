"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWordStore } from "@/lib/store";
import { useIrregularVerbStore } from "@/lib/irregularVerbsStore";
import { getDefaultWords } from "@/lib/defaultWords";
import { getDefaultIrregularVerbs } from "@/lib/defaultIrregularVerbs";
import { validateWords } from "@/lib/parser";
import { validateIrregularVerbs } from "@/lib/irregularVerbsParser";

export default function WelcomePage() {
  const router = useRouter();
  const { words, loadWords, addWords } = useWordStore();
  const { verbs, loadVerbs, addVerbs } = useIrregularVerbStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      await loadWords();
      await loadVerbs();
      
      // Получаем актуальные данные после загрузки
      const currentWords = useWordStore.getState().words;
      const currentVerbs = useIrregularVerbStore.getState().verbs;
      
      // Автоматически загружаем слова, если их нет
      if (currentWords.length === 0) {
        try {
          const defaultWords = await getDefaultWords();
          const { valid } = validateWords(defaultWords, currentWords);
          
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
        }
      }
      
      // Автоматически загружаем глаголы, если их нет
      if (currentVerbs.length === 0) {
        try {
          const defaultVerbs = await getDefaultIrregularVerbs();
          const { valid } = validateIrregularVerbs(defaultVerbs, currentVerbs);
          
          if (valid.length > 0) {
            const verbsToAdd = valid.map((v) => ({
              infinitive: v.infinitive,
              pastSimple: v.pastSimple,
              pastParticiple: v.pastParticiple,
              translation: v.translation,
              transcription: v.transcription,
              box: 1,
              nextReviewDate: Date.now(),
            }));
            
            await addVerbs(verbsToAdd);
            await loadVerbs();
          }
        } catch (error) {
          console.error("Ошибка загрузки предустановленных глаголов:", error);
        }
      }
      
      setIsInitializing(false);
    };
    
    initializeData();
  }, [loadWords, loadVerbs, addWords, addVerbs]);

  const hasWords = words.length > 0;
  const hasVerbs = verbs.length > 0;

  const handleNavigation = (href: string) => {
    if (isNavigating || isInitializing) return;
    setIsNavigating(true);
    router.push(href);
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
              {isInitializing ? (
                <div className="w-full bg-gray-700/50 text-white font-medium py-3 px-4 rounded-lg text-center text-sm">
                  Загрузка...
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation("/study")}
                    disabled={isNavigating || isInitializing}
                    className={`block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg text-center ${
                      isNavigating || isInitializing
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    ✨ Изучать
                  </button>
                  <button
                    onClick={() => handleNavigation("/add")}
                    disabled={isNavigating || isInitializing}
                    className={`block w-full bg-indigo-600/80 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm ${
                      isNavigating || isInitializing
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    + Добавить слова
                  </button>
                  <button
                    onClick={() => handleNavigation("/test")}
                    disabled={isNavigating || isInitializing}
                    className={`block w-full bg-purple-600/80 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm ${
                      isNavigating || isInitializing
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    🧪 Тест
                  </button>
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
              {isInitializing ? (
                <div className="w-full bg-gray-700/50 text-white font-medium py-3 px-4 rounded-lg text-center text-sm">
                  Загрузка...
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation("/irregular-verbs")}
                    disabled={isNavigating || isInitializing}
                    className={`block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg text-center ${
                      isNavigating || isInitializing
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    ✨ Изучать
                  </button>
                  <button
                    onClick={() => handleNavigation("/add-irregular-verbs")}
                    disabled={isNavigating || isInitializing}
                    className={`block w-full bg-indigo-600/80 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm ${
                      isNavigating || isInitializing
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    + Добавить глаголы
                  </button>
                  <button
                    onClick={() => handleNavigation("/test-irregular-verbs")}
                    disabled={isNavigating || isInitializing}
                    className={`block w-full bg-purple-600/80 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm ${
                      isNavigating || isInitializing
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    🧪 Тест
                  </button>
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
              <button
                onClick={() => handleNavigation("/stats")}
                disabled={isNavigating || isInitializing}
                className={`block w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg text-center ${
                  isNavigating || isInitializing
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
              >
                📈 Просмотр статистики
              </button>
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

