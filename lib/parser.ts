import { Word } from "./db";

export interface ParsedWord {
  word: string;
  translation: string;
  transcription?: string;
  tags: string[];
}

/**
 * Парсит строку в формате "word - translation" или "word - translation [transcription]" или "word;translation;transcription"
 */
export function parseWordLine(line: string, defaultTags: string[] = []): ParsedWord | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Пробуем формат с транскрипцией в квадратных скобках: "word - translation [transcription]"
  const bracketMatch = trimmed.match(/^(.+?)\s*-\s*(.+?)\s*\[(.+?)\]$/);
  if (bracketMatch) {
    return {
      word: bracketMatch[1].trim(),
      translation: bracketMatch[2].trim(),
      transcription: bracketMatch[3].trim(),
      tags: [...defaultTags],
    };
  }

  // Пробуем разделитель " - "
  let parts = trimmed.split(/\s*-\s*/);
  if (parts.length >= 2) {
    // Если 3 части: word - transcription - translation
    if (parts.length === 3) {
      return {
        word: parts[0].trim(),
        transcription: parts[1].trim(),
        translation: parts[2].trim(),
        tags: [...defaultTags],
      };
    }
    // Если 2 части: word - translation
    return {
      word: parts[0].trim(),
      translation: parts[1].trim(),
      transcription: undefined,
      tags: [...defaultTags],
    };
  }

  // Пробуем разделитель ";"
  parts = trimmed.split(";");
  if (parts.length >= 2) {
    return {
      word: parts[0].trim(),
      translation: parts[1].trim(),
      transcription: parts[2]?.trim() || undefined,
      tags: [...defaultTags],
    };
  }

  // Пробуем разделитель ","
  parts = trimmed.split(",");
  if (parts.length >= 2) {
    return {
      word: parts[0].trim(),
      translation: parts[1].trim(),
      transcription: parts[2]?.trim() || undefined,
      tags: [...defaultTags],
    };
  }

  // Если один разделитель не сработал, пробуем табуляцию
  parts = trimmed.split(/\t/);
  if (parts.length >= 2) {
    return {
      word: parts[0].trim(),
      translation: parts[1].trim(),
      transcription: parts[2]?.trim() || undefined,
      tags: [...defaultTags],
    };
  }

  return null;
}

/**
 * Парсит многострочный текст в массив слов
 */
export function parseText(text: string, defaultTags: string[] = []): ParsedWord[] {
  const lines = text.split(/\r?\n/);
  const words: ParsedWord[] = [];

  for (const line of lines) {
    const parsed = parseWordLine(line, defaultTags);
    if (parsed && parsed.word && parsed.translation) {
      words.push(parsed);
    }
  }

  return words;
}

/**
 * Парсит CSV файл
 */
export function parseCSV(text: string, defaultTags: string[] = []): ParsedWord[] {
  const lines = text.split(/\r?\n/);
  const words: ParsedWord[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // CSV может быть с запятыми внутри кавычек, упрощенный парсер
    const parts = trimmed.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    
    if (parts.length >= 2) {
      const word = parts[0];
      const translation = parts[1];
      const transcription = parts[2] || undefined;
      const tags = parts.length > 3 ? parts.slice(3).filter(Boolean) : defaultTags;

      if (word && translation) {
        words.push({
          word,
          translation,
          transcription: transcription?.trim() || undefined,
          tags: [...defaultTags, ...tags],
        });
      }
    }
  }

  return words;
}

/**
 * Валидирует массив слов на дубликаты и пустые поля
 */
export function validateWords(
  words: ParsedWord[],
  existingWords: Word[] = []
): { valid: ParsedWord[]; duplicates: ParsedWord[]; invalid: ParsedWord[] } {
  const valid: ParsedWord[] = [];
  const duplicates: ParsedWord[] = [];
  const invalid: ParsedWord[] = [];

  const existingSet = new Set(
    existingWords.map((w) => `${w.word.toLowerCase()}_${w.translation.toLowerCase()}`)
  );

  for (const word of words) {
    if (!word.word.trim() || !word.translation.trim()) {
      invalid.push(word);
      continue;
    }

    const key = `${word.word.toLowerCase()}_${word.translation.toLowerCase()}`;
    if (existingSet.has(key)) {
      duplicates.push(word);
      continue;
    }

    existingSet.add(key);
    valid.push(word);
  }

  return { valid, duplicates, invalid };
}

