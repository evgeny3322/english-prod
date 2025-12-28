import { parseText } from "./parser";

/**
 * Загружает предустановленные слова из файла
 */
export async function loadDefaultWords(): Promise<string> {
  try {
    const response = await fetch("/default-words.txt");
    if (!response.ok) {
      throw new Error("Не удалось загрузить файл с предустановленными словами");
    }
    return await response.text();
  } catch (error) {
    console.error("Ошибка загрузки предустановленных слов:", error);
    throw error;
  }
}

/**
 * Парсит и возвращает предустановленные слова
 */
export async function getDefaultWords() {
  const text = await loadDefaultWords();
  return parseText(text);
}

