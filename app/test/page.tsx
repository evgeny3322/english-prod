"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWordStore } from "@/lib/store";
import { Word } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Layout } from "@/components/Layout";
import { Loader } from "@/components/ui/Loader";
import { tts } from "@/lib/tts";
import { sounds } from "@/lib/sounds";

export default function TestPage() {
  const router = useRouter();
  const { words, loadWords, updateWord } = useWordStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isTestActiveRef = useRef(false);
  const sessionInitializedRef = useRef(false);

  useEffect(() => {
    loadWords().then(() => setIsLoading(false));
  }, [loadWords]);

  useEffect(() => {
    if (words.length === 0 && !isLoading) {
      setSessionWords([]);
      setCurrentIndex(0);
      isTestActiveRef.current = false;
      sessionInitializedRef.current = false;
      return;
    }

    // Если тест уже начался, обновляем только слова в сессии, не пересоздавая её
    if (isTestActiveRef.current && sessionInitializedRef.current) {
      setSessionWords((prevSessionWords) => {
        return prevSessionWords.map((sessionWord) => {
          const updatedWord = words.find((w) => w.id === sessionWord.id);
          return updatedWord || sessionWord;
        });
      });
      return;
    }

    // Инициализация сессии только при первой загрузке или когда тест не активен
    const now = Date.now();
    const wordsToReview = words.filter((w) => w.nextReviewDate <= now);
    const wordsForSession = wordsToReview.length > 0 ? wordsToReview : words;
    
    // Перемешиваем слова для теста
    const shuffled = [...wordsForSession].sort(() => Math.random() - 0.5);
    setSessionWords(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    sessionInitializedRef.current = true;
  }, [words, isLoading]);

  // Генерируем варианты ответов для текущего слова
  useEffect(() => {
    if (sessionWords.length === 0) return;

    const currentWord = sessionWords[currentIndex];
    if (!currentWord) return;

    // Не пересоздаём варианты ответов, если уже показан результат
    if (showResult) return;

    // Собираем все переводы кроме текущего
    const otherTranslations = words
      .filter((w) => w.id !== currentWord.id && w.translation !== currentWord.translation)
      .map((w) => w.translation);

    // Выбираем 3 случайных неправильных ответа
    const wrongAnswers: string[] = [];
    const shuffled = [...otherTranslations].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      wrongAnswers.push(shuffled[i]);
    }

    // Если недостаточно неправильных ответов, добавляем заглушки
    while (wrongAnswers.length < 3) {
      wrongAnswers.push("Неизвестно");
    }

    // Смешиваем правильный и неправильные ответы
    const allOptions = [currentWord.translation, ...wrongAnswers].sort(
      () => Math.random() - 0.5
    );
    setOptions(allOptions);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setIsProcessing(false);
  }, [currentIndex, sessionWords, words, showResult]);

  // Отмечаем, что тест начался, когда пользователь отвечает на первый вопрос
  // Это происходит в handleAnswer, поэтому этот эффект не нужен

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (sessionWords.length === 0 || isProcessing) return;

      const currentWord = sessionWords[currentIndex];
      if (!currentWord || !currentWord.id) return;

      // Блокируем кнопки сразу
      setIsProcessing(true);
      setSelectedAnswer(answer);

      // Отмечаем, что тест активен при первом ответе
      if (!isTestActiveRef.current) {
        isTestActiveRef.current = true;
      }

      const correct = answer === currentWord.translation;
      setIsCorrect(correct);
      setShowResult(true);

      // Воспроизводим звук
      if (correct) {
        sounds.playSuccess();
      } else {
        sounds.playError();
      }

      const now = Date.now();
      let newBox = currentWord.box;
      let nextReview: number;

      if (correct) {
        newBox = Math.min(currentWord.box + 1, 5);
        const intervals = [3600000, 86400000, 259200000, 604800000, 2592000000];
        nextReview = now + intervals[newBox - 1];
      } else {
        newBox = 1;
        nextReview = now + 3600000;
      }

      await updateWord(currentWord.id, {
        box: newBox,
        nextReviewDate: nextReview,
      });
    },
    [currentIndex, sessionWords, updateWord, isProcessing]
  );

  const handleNext = useCallback(() => {
    // Сбрасываем состояния перед переходом
    setShowResult(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < sessionWords.length) {
        setIsProcessing(false);
        return nextIndex;
      } else {
        // Тест завершён, сбрасываем флаги
        isTestActiveRef.current = false;
        sessionInitializedRef.current = false;
        router.push("/welcome");
        return prevIndex;
      }
    });
  }, [sessionWords.length, router]);

  // Обработка клавиатуры для перехода к следующему вопросу
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showResult && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showResult, handleNext]);

  const handleSpeak = () => {
    if (sessionWords.length === 0) return;
    const currentWord = sessionWords[currentIndex];
    if (currentWord) {
      tts.speak(currentWord.word, "en-US");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" text="Загрузка слов..." />
        </div>
      </Layout>
    );
  }

  if (sessionWords.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Нет слов для теста
            </h2>
            <p className="text-gray-400">
              Добавьте слова, чтобы начать тестирование
            </p>
            <Link href="/add">
              <Button variant="primary">Добавить слова</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const currentWord = sessionWords[currentIndex];
  const progress = ((currentIndex + 1) / sessionWords.length) * 100;

  // Проверка на существование currentWord
  if (!currentWord) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" text="Подготовка теста..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-4 sm:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-2">
              <span>
                {currentIndex + 1} / {sessionWords.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">
                    {currentWord.word}
                  </h2>
                  {tts.isAvailable() && (
                    <button
                      onClick={handleSpeak}
                      className="p-2 rounded-full bg-indigo-900 hover:bg-indigo-800 transition-colors"
                      aria-label="Озвучить слово"
                    >
                      🔊
                    </button>
                  )}
                </div>
                {currentWord.transcription && (
                  <p className="text-sm sm:text-base md:text-lg text-indigo-300 mb-3 sm:mb-4">
                    [{currentWord.transcription}]
                  </p>
                )}
                {currentWord.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-3 sm:mb-4">
                    {currentWord.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs sm:text-sm text-gray-400">
                  Выберите правильный перевод
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Answer Options */}
          <div className="space-y-3">
            <AnimatePresence>
              {options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isRightAnswer = option === currentWord.translation;
                let buttonVariant: "primary" | "secondary" | "danger" | "success" = "secondary";

                if (showResult) {
                  if (isRightAnswer) {
                    buttonVariant = "success";
                  } else if (isSelected && !isRightAnswer) {
                    buttonVariant = "danger";
                  }
                }

                return (
                  <motion.div
                    key={`${currentIndex}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: 0.3 + index * 0.05,
                      ease: "easeInOut"
                    }}
                  >
                    <Button
                      variant={buttonVariant}
                      size="lg"
                      onClick={() => !showResult && !isProcessing && handleAnswer(option)}
                      disabled={showResult || isProcessing}
                      className={`w-full text-left justify-start ${
                        showResult && isRightAnswer
                          ? "ring-4 ring-green-700"
                          : showResult && isSelected && !isRightAnswer
                          ? "ring-4 ring-red-700"
                          : ""
                      }`}
                    >
                      <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              <div className="text-center">
                <p
                  className={`text-lg font-semibold ${
                    isCorrect
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {isCorrect ? "✓ Правильно!" : "✗ Неправильно"}
                </p>
                {!isCorrect && (
                  <p className="text-gray-400 mt-2">
                    Правильный ответ: {currentWord.translation}
                  </p>
                )}
              </div>
              
              <div className="flex justify-center items-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {currentIndex < sessionWords.length - 1 ? "Далее →" : "Завершить"}
                </Button>
              </div>
              
              <p className="text-center text-xs sm:text-sm text-gray-500">
                <span className="hidden sm:inline">Нажмите Enter или Пробел для продолжения</span>
                <span className="sm:hidden">Нажмите Enter для продолжения</span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

