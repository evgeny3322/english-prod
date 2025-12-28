import { IrregularVerb } from "./db";

export interface ParsedIrregularVerb {
  infinitive: string;
  pastSimple: string;
  pastParticiple: string;
  translation: string;
  transcription?: string;
}

/**
 * Парсит строку в формате:
 * - "infinitive - pastSimple - pastParticiple - translation [transcription]"
 * - "infinitive - transcription - pastSimple - pastParticiple - translation"
 * - "infinitive;pastSimple;pastParticiple;translation;transcription"
 * - "infinitive;transcription;pastSimple;pastParticiple;translation"
 */
export function parseIrregularVerbLine(line: string): ParsedIrregularVerb | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Пробуем формат с транскрипцией в квадратных скобках: "infinitive - pastSimple - pastParticiple - translation [transcription]"
  const bracketMatch = trimmed.match(/^(.+?)\s*-\s*(.+?)\s*-\s*(.+?)\s*-\s*(.+?)\s*\[(.+?)\]$/);
  if (bracketMatch) {
    return {
      infinitive: bracketMatch[1].trim(),
      pastSimple: bracketMatch[2].trim(),
      pastParticiple: bracketMatch[3].trim(),
      translation: bracketMatch[4].trim(),
      transcription: bracketMatch[5].trim(),
    };
  }

  // Пробуем разделитель " - " (4 или 5 частей)
  let parts = trimmed.split(/\s*-\s*/);
  if (parts.length === 4) {
    // Стандартный формат без транскрипции
    return {
      infinitive: parts[0].trim(),
      pastSimple: parts[1].trim(),
      pastParticiple: parts[2].trim(),
      translation: parts[3].trim(),
    };
  } else if (parts.length === 5) {
    // Формат с транскрипцией: проверяем, где она находится
    // Если вторая часть похожа на транскрипцию (содержит только русские буквы/символы), то это формат: infinitive - transcription - pastSimple - pastParticiple - translation
    const secondPart = parts[1].trim();
    const isTranscription = /^[а-яё\s\-]+$/i.test(secondPart);
    
    if (isTranscription) {
      return {
        infinitive: parts[0].trim(),
        transcription: secondPart,
        pastSimple: parts[2].trim(),
        pastParticiple: parts[3].trim(),
        translation: parts[4].trim(),
      };
    } else {
      // Иначе транскрипция в конце: infinitive - pastSimple - pastParticiple - translation - transcription
      return {
        infinitive: parts[0].trim(),
        pastSimple: parts[1].trim(),
        pastParticiple: parts[2].trim(),
        translation: parts[3].trim(),
        transcription: parts[4].trim(),
      };
    }
  }

  // Пробуем разделитель ";" (4 или 5 частей)
  parts = trimmed.split(";");
  if (parts.length === 4) {
    return {
      infinitive: parts[0].trim(),
      pastSimple: parts[1].trim(),
      pastParticiple: parts[2].trim(),
      translation: parts[3].trim(),
    };
  } else if (parts.length === 5) {
    // Аналогично проверяем формат
    const secondPart = parts[1].trim();
    const isTranscription = /^[а-яё\s\-]+$/i.test(secondPart);
    
    if (isTranscription) {
      return {
        infinitive: parts[0].trim(),
        transcription: secondPart,
        pastSimple: parts[2].trim(),
        pastParticiple: parts[3].trim(),
        translation: parts[4].trim(),
      };
    } else {
      return {
        infinitive: parts[0].trim(),
        pastSimple: parts[1].trim(),
        pastParticiple: parts[2].trim(),
        translation: parts[3].trim(),
        transcription: parts[4].trim(),
      };
    }
  }

  return null;
}

/**
 * Парсит многострочный текст в массив неправильных глаголов
 */
export function parseIrregularVerbsText(text: string): ParsedIrregularVerb[] {
  const lines = text.split(/\r?\n/);
  const verbs: ParsedIrregularVerb[] = [];

  for (const line of lines) {
    const parsed = parseIrregularVerbLine(line);
    if (parsed && parsed.infinitive && parsed.pastSimple && parsed.pastParticiple && parsed.translation) {
      verbs.push(parsed);
    }
  }

  return verbs;
}

/**
 * Валидирует массив неправильных глаголов на дубликаты и пустые поля
 */
export function validateIrregularVerbs(
  verbs: ParsedIrregularVerb[],
  existingVerbs: IrregularVerb[] = []
): { valid: ParsedIrregularVerb[]; duplicates: ParsedIrregularVerb[]; invalid: ParsedIrregularVerb[] } {
  const valid: ParsedIrregularVerb[] = [];
  const duplicates: ParsedIrregularVerb[] = [];
  const invalid: ParsedIrregularVerb[] = [];

  const existingSet = new Set(
    existingVerbs.map((v) => v.infinitive.toLowerCase())
  );

  for (const verb of verbs) {
    if (!verb.infinitive.trim() || !verb.pastSimple.trim() || !verb.pastParticiple.trim() || !verb.translation.trim()) {
      invalid.push(verb);
      continue;
    }

    const key = verb.infinitive.toLowerCase();
    if (existingSet.has(key)) {
      duplicates.push(verb);
      continue;
    }

    existingSet.add(key);
    valid.push(verb);
  }

  return { valid, duplicates, invalid };
}

