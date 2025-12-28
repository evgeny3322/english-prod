import { IrregularVerb } from "./db";

export interface ParsedIrregularVerb {
  infinitive: string;
  pastSimple: string;
  pastParticiple: string;
  translation: string;
}

/**
 * Парсит строку в формате "infinitive - pastSimple - pastParticiple - translation"
 * или "infinitive;pastSimple;pastParticiple;translation"
 */
export function parseIrregularVerbLine(line: string): ParsedIrregularVerb | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Пробуем разделитель " - "
  let parts = trimmed.split(/\s*-\s*/);
  if (parts.length >= 4) {
    return {
      infinitive: parts[0].trim(),
      pastSimple: parts[1].trim(),
      pastParticiple: parts[2].trim(),
      translation: parts[3].trim(),
    };
  }

  // Пробуем разделитель ";"
  parts = trimmed.split(";");
  if (parts.length >= 4) {
    return {
      infinitive: parts[0].trim(),
      pastSimple: parts[1].trim(),
      pastParticiple: parts[2].trim(),
      translation: parts[3].trim(),
    };
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

