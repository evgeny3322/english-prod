"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useIrregularVerbStore } from "@/lib/irregularVerbsStore";
import { IrregularVerb } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Layout } from "@/components/Layout";
import { Loader } from "@/components/ui/Loader";
import { tts } from "@/lib/tts";
import { sounds } from "@/lib/sounds";

type QuestionType = "pastSimple" | "pastParticiple";

export default function TestIrregularVerbsPage() {
  const router = useRouter();
  const { verbs, loadVerbs, updateVerb } = useIrregularVerbStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionVerbs, setSessionVerbs] = useState<IrregularVerb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [questionType, setQuestionType] = useState<QuestionType>("pastSimple");
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const isTestActiveRef = useRef(false);
  const sessionInitializedRef = useRef(false);

  useEffect(() => {
    loadVerbs().then(() => setIsLoading(false));
  }, [loadVerbs]);

  useEffect(() => {
    if (verbs.length === 0 && !isLoading) {
      setSessionVerbs([]);
      setCurrentIndex(0);
      isTestActiveRef.current = false;
      sessionInitializedRef.current = false;
      return;
    }

    // Если тест уже начался, обновляем только глаголы в сессии, не пересоздавая её
    if (isTestActiveRef.current && sessionInitializedRef.current) {
      setSessionVerbs((prevSessionVerbs) => {
        return prevSessionVerbs.map((sessionVerb) => {
          const updatedVerb = verbs.find((v) => v.id === sessionVerb.id);
          return updatedVerb || sessionVerb;
        });
      });
      return;
    }

    // Инициализация сессии только при первой загрузке или когда тест не активен
    const now = Date.now();
    const verbsToReview = verbs.filter((v) => v.nextReviewDate <= now);
    const verbsForSession = verbsToReview.length > 0 ? verbsToReview : verbs;
    
    // Перемешиваем глаголы для теста
    const shuffled = [...verbsForSession].sort(() => Math.random() - 0.5);
    setSessionVerbs(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    // Случайно выбираем тип вопроса
    setQuestionType(Math.random() > 0.5 ? "pastSimple" : "pastParticiple");
    sessionInitializedRef.current = true;
  }, [verbs, isLoading]);

  // Генерируем варианты ответов для текущего глагола
  useEffect(() => {
    if (sessionVerbs.length === 0) return;

    const currentVerb = sessionVerbs[currentIndex];
    if (!currentVerb) return;

    // Определяем правильный ответ в зависимости от типа вопроса
    const correctAnswer = questionType === "pastSimple" 
      ? currentVerb.pastSimple 
      : currentVerb.pastParticiple;

    // Собираем все формы кроме текущего глагола
    const otherForms: string[] = [];
    verbs.forEach((v) => {
      if (v.id !== currentVerb.id) {
        if (questionType === "pastSimple") {
          otherForms.push(v.pastSimple);
        } else {
          otherForms.push(v.pastParticiple);
        }
      }
    });

    // Выбираем 3 случайных неправильных ответа
    const wrongAnswers: string[] = [];
    const shuffled = [...otherForms].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      if (shuffled[i] && shuffled[i] !== correctAnswer) {
        wrongAnswers.push(shuffled[i]);
      }
    }

    // Если недостаточно неправильных ответов, добавляем заглушки
    while (wrongAnswers.length < 3) {
      wrongAnswers.push("Неизвестно");
    }

    // Смешиваем правильный и неправильные ответы
    const allOptions = [correctAnswer, ...wrongAnswers].sort(
      () => Math.random() - 0.5
    );
    setOptions(allOptions);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResult(false);
  }, [currentIndex, sessionVerbs, verbs, questionType]);

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (sessionVerbs.length === 0) return;

      const currentVerb = sessionVerbs[currentIndex];
      if (!currentVerb || !currentVerb.id) return;

      // Отмечаем, что тест активен при первом ответе
      if (!isTestActiveRef.current) {
        isTestActiveRef.current = true;
      }

      const correctAnswer = questionType === "pastSimple" 
        ? currentVerb.pastSimple 
        : currentVerb.pastParticiple;

      const correct = answer === correctAnswer;
      setSelectedAnswer(answer);
      setIsCorrect(correct);
      setShowResult(true);

      // Воспроизводим звук
      if (correct) {
        sounds.playSuccess();
      } else {
        sounds.playError();
      }

      const now = Date.now();
      let newBox = currentVerb.box;
      let nextReview: number;

      if (correct) {
        newBox = Math.min(currentVerb.box + 1, 5);
        const intervals = [3600000, 86400000, 259200000, 604800000, 2592000000];
        nextReview = now + intervals[newBox - 1];
      } else {
        newBox = 1;
        nextReview = now + 3600000;
      }

      await updateVerb(currentVerb.id, {
        box: newBox,
        nextReviewDate: nextReview,
      });

      // Переходим к следующему вопросу через 1.5 секунды
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < sessionVerbs.length) {
            setQuestionType(Math.random() > 0.5 ? "pastSimple" : "pastParticiple");
            return nextIndex;
          } else {
            // Тест завершён, сбрасываем флаги
            isTestActiveRef.current = false;
            sessionInitializedRef.current = false;
            router.push("/welcome");
            return prevIndex;
          }
        });
      }, 1500);
    },
    [currentIndex, sessionVerbs, questionType, updateVerb, router]
  );

  const handleSpeak = () => {
    if (sessionVerbs.length === 0) return;
    const currentVerb = sessionVerbs[currentIndex];
    if (currentVerb) {
      tts.speak(currentVerb.infinitive, "en-US");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" text="Загрузка глаголов..." />
        </div>
      </Layout>
    );
  }

  if (sessionVerbs.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Нет глаголов для теста
            </h2>
            <p className="text-gray-400">
              Добавьте неправильные глаголы, чтобы начать тестирование
            </p>
            <Link href="/add-irregular-verbs">
              <Button variant="primary">Добавить глаголы</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const currentVerb = sessionVerbs[currentIndex];
  const progress = ((currentIndex + 1) / sessionVerbs.length) * 100;

  // Проверка на существование currentVerb
  if (!currentVerb) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" text="Подготовка теста..." />
        </div>
      </Layout>
    );
  }

  const questionLabel = questionType === "pastSimple" ? "Past Simple" : "Past Participle";
  const correctAnswer = questionType === "pastSimple" 
    ? currentVerb.pastSimple 
    : currentVerb.pastParticiple;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>
                {currentIndex + 1} / {sessionVerbs.length}
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
              transition={{ duration: 0.3 }}
              className="bg-gray-800 rounded-lg shadow-xl p-8 mb-6"
            >
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Infinitive</p>
                  <div className="flex items-center justify-center gap-4">
                    <h2 className="text-4xl font-bold text-white">
                      {currentVerb.infinitive}
                    </h2>
                    {tts.isAvailable() && (
                      <button
                        onClick={handleSpeak}
                        className="p-2 rounded-full bg-indigo-900 hover:bg-indigo-800 transition-colors"
                        aria-label="Озвучить"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-lg text-indigo-300 mb-4">
                    Выберите правильную форму: <span className="font-semibold">{questionLabel}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Answer Options */}
          <div className="space-y-3">
            <AnimatePresence>
              {options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isRightAnswer = option === correctAnswer;
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
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant={buttonVariant}
                      size="lg"
                      onClick={() => !showResult && handleAnswer(option)}
                      disabled={showResult}
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
              className="mt-6 text-center"
            >
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
                  Правильный ответ: <span className="font-semibold">{correctAnswer}</span>
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

