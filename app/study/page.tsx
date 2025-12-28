"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useDrag } from "react-use-gesture";
import { useWordStore } from "@/lib/store";
import { Word } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Layout } from "@/components/Layout";
import { TagFilter } from "@/components/TagFilter";
import { Loader } from "@/components/ui/Loader";
import { tts } from "@/lib/tts";
import { sounds } from "@/lib/sounds";

export default function StudyPage() {
  const router = useRouter();
  const { words, loadWords, updateWord } = useWordStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Свайп-жесты для карточки - должны быть объявлены до любых условных return
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleAnswer = useCallback(
    async (know: boolean) => {
      if (sessionWords.length === 0 || isProcessing) return;

      const currentWord = sessionWords[currentIndex];
      if (!currentWord || !currentWord.id) return;

      // Блокируем кнопки сразу
      setIsProcessing(true);

      // Воспроизводим звук
      if (know) {
        sounds.playSuccess();
      } else {
        sounds.playError();
      }

      const now = Date.now();
      let newBox = currentWord.box;
      let nextReview: number;

      if (know) {
        // Правильный ответ: увеличиваем box
        newBox = Math.min(currentWord.box + 1, 5);
        // Интервалы: 1ч -> 1 день -> 3 дня -> 7 дней -> 30 дней
        const intervals = [3600000, 86400000, 259200000, 604800000, 2592000000];
        nextReview = now + intervals[newBox - 1];
      } else {
        // Неправильный ответ: сбрасываем в box 1
        newBox = 1;
        nextReview = now + 3600000; // 1 час
      }

      await updateWord(currentWord.id, {
        box: newBox,
        nextReviewDate: nextReview,
      });

      // Переходим к следующей карточке
      if (currentIndex < sessionWords.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setIsProcessing(false);
      } else {
        // Сессия завершена
        router.push("/welcome");
      }
    },
    [currentIndex, sessionWords, updateWord, router, isProcessing]
  );

  const bind = useDrag(
    ({ movement: [mx], direction: [xDir], velocity, cancel }) => {
      const velocityX = Array.isArray(velocity) ? velocity[0] : (typeof velocity === 'number' ? velocity : 0);
      const trigger = Math.abs(mx) > 100 || Math.abs(velocityX) > 500;

      if (trigger) {
        cancel();
        if (xDir > 0) {
          // Свайп вправо - знаю
          handleAnswer(true);
        } else {
          // Свайп влево - не знаю
          handleAnswer(false);
        }
        x.set(0);
      } else {
        x.set(mx);
      }
    },
    {
      axis: "x",
      bounds: { left: -200, right: 200 },
      rubberband: true,
    }
  );

  useEffect(() => {
    loadWords().then(() => setIsLoading(false));
  }, [loadWords]);

  useEffect(() => {
    if (words.length === 0 && !isLoading) {
      return;
    }
    // Фильтруем слова, которые нужно повторить (nextReviewDate <= сейчас)
    const now = Date.now();
    let wordsToReview = words.filter((w) => w.nextReviewDate <= now);
    // Если нет слов для повторения, показываем все
    if (wordsToReview.length === 0) {
      wordsToReview = words;
    }
    
    // Применяем фильтр по тегам
    let filteredWords = wordsToReview;
    if (selectedTags.length > 0) {
      filteredWords = wordsToReview.filter((word) =>
        word.tags.some((tag) => selectedTags.includes(tag))
      );
    }
    
    setSessionWords(filteredWords);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsProcessing(false);
  }, [words, isLoading, selectedTags]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      } else if (e.key === "ArrowLeft" || e.key === "1") {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.key === "ArrowRight" || e.key === "2") {
        e.preventDefault();
        handleAnswer(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isFlipped, handleAnswer]);

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
              Нет слов для изучения
            </h2>
            <p className="text-gray-400">
              Добавьте слова, чтобы начать обучение
            </p>
            <Link href="/add">
              <Button variant="primary">Добавить слова</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSpeak = () => {
    if (sessionWords.length === 0) return;
    const currentWord = sessionWords[currentIndex];
    if (currentWord) {
      tts.speak(currentWord.word, "en-US");
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    sounds.playFlip();
  };

  const currentWord = sessionWords[currentIndex];
  const progress = ((currentIndex + 1) / sessionWords.length) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-4 sm:py-8 px-4 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          {/* Tag Filter */}
          <TagFilter
            words={words}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />

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

          {/* Flashcard */}
          <div className="relative mb-4 sm:mb-6 flex-1 flex items-center justify-center" style={{ perspective: "1000px", minHeight: "min(400px, 50vh)" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: 90 }}
                transition={{ duration: 0.3 }}
                className="relative w-full"
                style={{ height: "min(400px, 50vh)", transformStyle: "preserve-3d" }}
              >
                <motion.div
                  ref={cardRef}
                  {...bind()}
                  className="absolute inset-0 cursor-pointer touch-none"
                  style={{
                    x,
                    rotate,
                    opacity,
                    rotateY: isFlipped ? 180 : 0,
                    transformStyle: "preserve-3d",
                    transition: isFlipped ? "rotateY 0.6s" : "none",
                  }}
                  onClick={handleFlip}
                >
                  {/* Лицевая сторона */}
                  <div
                    className="absolute inset-0 bg-gray-800 rounded-lg shadow-xl flex items-center justify-center p-4 sm:p-6 md:p-8 backface-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <div className="text-center w-full px-2">
                      <p className="text-xs sm:text-sm text-gray-400 mb-2">
                        Слово
                      </p>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">
                          {currentWord.word}
                        </h2>
                        {tts.isAvailable() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeak();
                            }}
                            className="p-2 rounded-full bg-indigo-900 hover:bg-indigo-800 transition-colors"
                            aria-label="Озвучить слово"
                          >
                            🔊
                          </button>
                        )}
                      </div>
                      {currentWord.transcription && (
                        <p className="text-sm sm:text-base md:text-lg text-indigo-300 mb-2">
                          [{currentWord.transcription}]
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-500 mt-4">
                        Нажмите, чтобы перевернуть
                      </p>
                    </div>
                  </div>

                  {/* Обратная сторона */}
                  <div
                    className="absolute inset-0 bg-indigo-700 rounded-lg shadow-xl flex items-center justify-center p-4 sm:p-6 md:p-8 backface-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="text-center w-full px-2">
                      <p className="text-xs sm:text-sm text-indigo-200 mb-2">Перевод</p>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">
                        {currentWord.translation}
                      </h2>
                      {currentWord.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {currentWord.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-indigo-500 text-white text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Buttons - центрированы */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-4">
            <Button
              variant="danger"
              size="lg"
              onClick={() => handleAnswer(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto min-w-[140px] sm:min-w-[160px]"
            >
              Не знаю
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={() => handleAnswer(true)}
              disabled={isProcessing}
              className="w-full sm:w-auto min-w-[140px] sm:min-w-[160px]"
            >
              Знаю
            </Button>
          </div>

          <p className="text-center text-xs sm:text-sm text-gray-400 px-4">
            <span className="hidden sm:inline">Space - перевернуть | ← / 1 - Не знаю | → / 2 - Знаю | </span>Свайп влево/вправо
          </p>
        </div>
      </div>
    </Layout>
  );
}

