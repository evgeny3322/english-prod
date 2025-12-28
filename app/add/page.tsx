"use client";

import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWordStore } from "@/lib/store";
import { parseText, parseCSV, validateWords, ParsedWord } from "@/lib/parser";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function AddPage() {
  const router = useRouter();
  const { words, addWord, addWords } = useWordStore();
  const [mode, setMode] = useState<"manual" | "import">("manual");
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [transcription, setTranscription] = useState("");
  const [tags, setTags] = useState("");
  const [importText, setImportText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!word.trim() || !translation.trim()) {
      setErrors(["Заполните все обязательные поля"]);
      return;
    }

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setIsLoading(true);
    try {
      await addWord({
        word: word.trim(),
        translation: translation.trim(),
        transcription: transcription.trim() || undefined,
        tags: tagArray,
        box: 1,
        nextReviewDate: Date.now(),
      });

      setWord("");
      setTranslation("");
      setTranscription("");
      setTags("");
      router.push("/welcome");
    } catch (error) {
      setErrors(["Ошибка при добавлении слова"]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileRead = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const isCSV = file.name.endsWith(".csv");
      const parsed = isCSV ? parseCSV(text) : parseText(text);
      
      if (parsed.length === 0) {
        setErrors(["Не удалось распарсить файл. Проверьте формат."]);
        return;
      }

      const { valid, duplicates, invalid } = validateWords(parsed, words);

      if (valid.length === 0) {
        setErrors([
          "Нет новых слов для добавления",
          duplicates.length > 0 ? `${duplicates.length} дубликатов` : "",
          invalid.length > 0 ? `${invalid.length} невалидных записей` : "",
        ].filter(Boolean));
        return;
      }

      if (duplicates.length > 0 || invalid.length > 0) {
        const warnings = [
          duplicates.length > 0 ? `Найдено ${duplicates.length} дубликатов` : "",
          invalid.length > 0 ? `Найдено ${invalid.length} невалидных записей` : "",
        ].filter(Boolean);
        setErrors(warnings);
      }

      const wordsToAdd = valid.map((w) => ({
        word: w.word,
        translation: w.translation,
        transcription: w.transcription,
        tags: w.tags,
        box: 1,
        nextReviewDate: Date.now(),
      }));

      await addWords(wordsToAdd);
      setImportText("");
      router.push("/welcome");
    } catch (error) {
      setErrors(["Ошибка при добавлении слов"]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) {
      handleFileRead(file);
    } else {
      setErrors(["Поддерживаются только файлы .csv и .txt"]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImportTextSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!importText.trim()) {
      setErrors(["Введите текст для импорта"]);
      return;
    }

    setIsLoading(true);
    try {
      const parsed = parseText(importText);
      
      if (parsed.length === 0) {
        setErrors(["Не удалось распарсить текст. Используйте формат: слово - перевод"]);
        return;
      }

      const { valid, duplicates, invalid } = validateWords(parsed, words);

      if (valid.length === 0) {
        setErrors([
          "Нет новых слов для добавления",
          duplicates.length > 0 ? `${duplicates.length} дубликатов` : "",
          invalid.length > 0 ? `${invalid.length} невалидных записей` : "",
        ].filter(Boolean));
        return;
      }

      if (duplicates.length > 0 || invalid.length > 0) {
        const warnings = [
          duplicates.length > 0 ? `Найдено ${duplicates.length} дубликатов` : "",
          invalid.length > 0 ? `Найдено ${invalid.length} невалидных записей` : "",
        ].filter(Boolean);
        setErrors(warnings);
      }

      const wordsToAdd = valid.map((w) => ({
        word: w.word,
        translation: w.translation,
        transcription: w.transcription,
        tags: w.tags,
        box: 1,
        nextReviewDate: Date.now(),
      }));

      await addWords(wordsToAdd);
      setImportText("");
      router.push("/welcome");
    } catch (error) {
      setErrors(["Ошибка при добавлении слов"]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-4 sm:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/welcome"
            className="text-sm sm:text-base text-indigo-400 hover:text-indigo-300"
          >
            ← Назад
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">
            Добавить слова
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Button
              variant={mode === "manual" ? "primary" : "secondary"}
              onClick={() => setMode("manual")}
            >
              Ручной ввод
            </Button>
            <Button
              variant={mode === "import" ? "primary" : "secondary"}
              onClick={() => setMode("import")}
            >
              Импорт
            </Button>
          </div>

          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
              {errors.map((error, i) => (
                <p key={i} className="text-yellow-200 text-sm">
                  {error}
                </p>
              ))}
            </div>
          )}

          {mode === "manual" ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Слово (EN)
                </label>
                <Input
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="hello"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Перевод (RU)
                </label>
                <Input
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="привет"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Транскрипция (RU, опционально)
                </label>
                <Input
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  placeholder="хэллоу"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Произношение на русском языке (например: &quot;хэллоу&quot; для &quot;hello&quot;)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Теги (через запятую)
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="базовые, приветствие"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Добавить слово
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Вставьте текст (формат: слово - транскрипция - перевод или слово - перевод [транскрипция])
                </label>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="hello - привет&#10;world - мир&#10;good - хорошо"
                  rows={8}
                />
                <Button
                  onClick={handleImportTextSubmit}
                  variant="primary"
                  className="w-full mt-4"
                  isLoading={isLoading}
                >
                  Импортировать
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">
                    или
                  </span>
                </div>
              </div>

              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-900/20"
                    : isLoading
                    ? "border-gray-700 bg-gray-800/50"
                    : "border-gray-600"
                }`}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Spinner size="md" />
                    <p className="text-gray-400">Обработка файла...</p>
                  </div>
                ) : (
                  <p className="text-gray-400 mb-4">
                    Перетащите файл .csv или .txt сюда
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Выбрать файл
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

