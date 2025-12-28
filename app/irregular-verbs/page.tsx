"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useDrag } from "react-use-gesture";
import { useIrregularVerbStore } from "@/lib/irregularVerbsStore";
import { IrregularVerb } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Layout } from "@/components/Layout";
import { Loader } from "@/components/ui/Loader";
import { tts } from "@/lib/tts";
import { sounds } from "@/lib/sounds";

export default function IrregularVerbsPage() {
  const router = useRouter();
  const { verbs, loadVerbs, updateVerb } = useIrregularVerbStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionVerbs, setSessionVerbs] = useState<IrregularVerb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState<"infinitive" | "pastSimple" | "pastParticiple">("infinitive");
  const [isProcessing, setIsProcessing] = useState(false);

  // Свайп-жесты для карточки
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleAnswer = useCallback(
    async (know: boolean) => {
      if (sessionVerbs.length === 0 || isProcessing) return;

      const currentVerb = sessionVerbs[currentIndex];
      if (!currentVerb || !currentVerb.id) return;

      // Блокируем кнопки сразу
      setIsProcessing(true);

      // Воспроизводим звук
      if (know) {
        sounds.playSuccess();
      } else {
        sounds.playError();
      }

      const now = Date.now();
      let newBox = currentVerb.box;
      let nextReview: number;

      if (know) {
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

      if (currentIndex < sessionVerbs.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setShowForm("infinitive");
        setIsProcessing(false);
      } else {
        router.push("/welcome");
      }
    },
    [currentIndex, sessionVerbs, updateVerb, router, isProcessing]
  );

  const bind = useDrag(
    ({ movement: [mx], direction: [xDir], velocity, cancel }) => {
      const velocityX = Array.isArray(velocity) ? velocity[0] : (typeof velocity === 'number' ? velocity : 0);
      const trigger = Math.abs(mx) > 100 || Math.abs(velocityX) > 500;

      if (trigger) {
        cancel();
        if (xDir > 0) {
          handleAnswer(true);
        } else {
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
    loadVerbs().then(() => setIsLoading(false));
  }, [loadVerbs]);

  useEffect(() => {
    if (verbs.length === 0 && !isLoading) {
      return;
    }
    const now = Date.now();
    let verbsToReview = verbs.filter((v) => v.nextReviewDate <= now);
    if (verbsToReview.length === 0) {
      verbsToReview = verbs;
    }
    
    setSessionVerbs(verbsToReview);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowForm("infinitive");
    setIsProcessing(false);
  }, [verbs, isLoading]);

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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    sounds.playFlip();
  };

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
              Нет неправильных глаголов для изучения
            </h2>
            <p className="text-gray-400">
              Добавьте неправильные глаголы, чтобы начать обучение
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-4 sm:py-8 px-4 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          {/* Progress Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-2">
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

          {/* Flashcard */}
          <div className="relative mb-4 sm:mb-6 flex-1 flex items-center justify-center" style={{ perspective: "1000px", minHeight: "min(450px, 50vh)" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: 90 }}
                transition={{ duration: 0.3 }}
                className="relative w-full"
                style={{ height: "min(450px, 50vh)", transformStyle: "preserve-3d" }}
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
                      <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                        {showForm === "infinitive" ? "Инфинитив" : showForm === "pastSimple" ? "Past Simple" : "Past Participle"}
                      </p>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">
                          {showForm === "infinitive" 
                            ? currentVerb.infinitive 
                            : showForm === "pastSimple" 
                            ? currentVerb.pastSimple 
                            : currentVerb.pastParticiple}
                        </h2>
                        {tts.isAvailable() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeak();
                            }}
                            className="p-2 rounded-full bg-indigo-900 hover:bg-indigo-800 transition-colors"
                            aria-label="Озвучить"
                          >
                            🔊
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 justify-center mt-4 sm:mt-6 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowForm("infinitive");
                          }}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                            showForm === "infinitive" 
                              ? "bg-indigo-600 text-white" 
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          Infinitive
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowForm("pastSimple");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            showForm === "pastSimple" 
                              ? "bg-indigo-600 text-white" 
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          Past Simple
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowForm("pastParticiple");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            showForm === "pastParticiple" 
                              ? "bg-indigo-600 text-white" 
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          Past Participle
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Нажмите, чтобы перевернуть
                      </p>
                    </div>
                  </div>

                  {/* Обратная сторона */}
                  <div
                    className="absolute inset-0 bg-indigo-700 rounded-lg shadow-xl flex items-center justify-center p-8 backface-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="text-center w-full">
                      <p className="text-sm text-indigo-200 mb-4">Перевод и все формы</p>
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-xs text-indigo-300 mb-1">Infinitive</p>
                          <p className="text-2xl font-bold text-white">{currentVerb.infinitive}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-300 mb-1">Past Simple</p>
                          <p className="text-2xl font-bold text-white">{currentVerb.pastSimple}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-300 mb-1">Past Participle</p>
                          <p className="text-2xl font-bold text-white">{currentVerb.pastParticiple}</p>
                        </div>
                        <div className="pt-2 border-t border-indigo-600">
                          <p className="text-xs text-indigo-300 mb-1">Перевод</p>
                          <p className="text-xl font-semibold text-white">{currentVerb.translation}</p>
                        </div>
                      </div>
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

