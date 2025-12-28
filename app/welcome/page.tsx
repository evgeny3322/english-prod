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
import { Spinner } from "@/components/ui/Spinner";

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

        <div className="space-y-6 pt-8">
          {!hasWords && (
            <Button
              onClick={handleLoadDefaults}
              disabled={isLoadingDefaults}
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoadingDefaults && <Spinner size="sm" />}
              {isLoadingDefaults ? "Загрузка..." : "Загрузить предустановленные слова"}
            </Button>
          )}

          {/* Раздел: Изучение слов */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white mb-3">Изучение слов</h2>
            <Link
              href="/add"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              Добавить слова
            </Link>

            {hasWords && (
              <Link
                href="/study"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
              >
                Изучать слова
              </Link>
            )}
          </div>

          {/* Раздел: Изучение неправильных глаголов */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white mb-3">Изучение неправильных глаголов</h2>
            {!hasVerbs && (
              <Button
                onClick={handleLoadDefaultVerbs}
                disabled={isLoadingDefaults}
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
              >
                {isLoadingDefaults && <Spinner size="sm" />}
                {isLoadingDefaults ? "Загрузка..." : "Загрузить предустановленные глаголы"}
              </Button>
            )}
            <Link
              href="/add-irregular-verbs"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              Добавить глаголы
            </Link>

            {hasVerbs && (
              <Link
                href="/irregular-verbs"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
              >
                Изучать глаголы
              </Link>
            )}
          </div>

          {/* Общие разделы */}
          <div className="space-y-3 pt-2">
            {hasWords && (
              <Link
                href="/test"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
              >
                Тест (слова)
              </Link>
            )}
            {hasVerbs && (
              <Link
                href="/test-irregular-verbs"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
              >
                Тест (глаголы)
              </Link>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-400 pt-4">
          Ваши данные хранятся только на этом устройстве
        </p>
      </div>
    </div>
  );
}

