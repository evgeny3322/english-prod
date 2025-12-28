"use client";

import { useEffect, useState } from "react";
import { useWordStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Layout } from "@/components/Layout";

export default function StatsPage() {
  const { words, loadWords, clearAll } = useWordStore();
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const boxStats = {
    1: words.filter((w) => w.box === 1).length,
    2: words.filter((w) => w.box === 2).length,
    3: words.filter((w) => w.box === 3).length,
    4: words.filter((w) => w.box === 4).length,
    5: words.filter((w) => w.box === 5).length,
  };

  const newWords = boxStats[1];
  const inProgress = boxStats[2] + boxStats[3] + boxStats[4];
  const learned = boxStats[5];

  const handleClearAll = async () => {
    if (showConfirm) {
      await clearAll();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">
            Статистика
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Всего слов
              </h3>
              <p className="text-3xl font-bold text-white">
                {words.length}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Новые
              </h3>
              <p className="text-3xl font-bold text-blue-400">
                {newWords}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                В процессе
              </h3>
              <p className="text-3xl font-bold text-yellow-400">
                {inProgress}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Выучено
              </h3>
              <p className="text-3xl font-bold text-green-400">
                {learned}
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">
              Распределение по коробкам (Leitner)
            </h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((box) => (
                <div key={box} className="flex items-center">
                  <span className="w-24 text-sm text-gray-400">
                    Коробка {box}:
                  </span>
                  <div className="flex-1 bg-gray-700 rounded-full h-4 mr-4">
                    <div
                      className="bg-indigo-600 h-4 rounded-full transition-all"
                      style={{
                        width: `${words.length > 0 ? (boxStats[box as keyof typeof boxStats] / words.length) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="w-12 text-right text-sm font-medium text-white">
                    {boxStats[box as keyof typeof boxStats]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-white">
              Опасная зона
            </h2>
            {showConfirm ? (
              <div className="space-y-4">
                <p className="text-red-400">
                  Вы уверены? Это действие нельзя отменить. Все ваши слова будут удалены.
                </p>
                <div className="flex gap-4">
                  <Button variant="danger" onClick={handleClearAll}>
                    Да, удалить все
                  </Button>
                  <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" onClick={handleClearAll}>
                Очистить все данные
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

