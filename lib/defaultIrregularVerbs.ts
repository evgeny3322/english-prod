import { parseIrregularVerbsText } from "./irregularVerbsParser";

/**
 * Загружает предустановленные неправильные глаголы из файла
 */
export async function loadDefaultIrregularVerbs(): Promise<string> {
  try {
    const response = await fetch("/default-irregular-verbs.txt");
    if (!response.ok) {
      throw new Error("Не удалось загрузить файл с предустановленными глаголами");
    }
    return await response.text();
  } catch (error) {
    console.error("Ошибка загрузки предустановленных глаголов:", error);
    throw error;
  }
}

/**
 * Парсит и возвращает предустановленные неправильные глаголы
 */
export async function getDefaultIrregularVerbs() {
  const text = await loadDefaultIrregularVerbs();
  return parseIrregularVerbsText(text);
}

