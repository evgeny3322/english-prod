import Dexie, { Table } from "dexie";

export interface Word {
  id?: number;
  word: string;
  translation: string;
  transcription?: string; // Транскрипция на русском (например: "хэллоу")
  tags: string[];
  box: number; // 1-5 для системы Leitner
  nextReviewDate: number; // timestamp
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface IrregularVerb {
  id?: number;
  infinitive: string; // Инфинитив (go)
  pastSimple: string; // Past Simple (went)
  pastParticiple: string; // Past Participle (gone)
  translation: string; // Перевод
  box: number; // 1-5 для системы Leitner
  nextReviewDate: number; // timestamp
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export class LexiFlowDB extends Dexie {
  words!: Table<Word, number>;
  irregularVerbs!: Table<IrregularVerb, number>;

  constructor() {
    super("LexiFlowDB");
    this.version(3).stores({
      words: "++id, word, translation, box, nextReviewDate, createdAt",
      irregularVerbs: "++id, infinitive, box, nextReviewDate, createdAt",
    }).upgrade((tx) => {
      // Миграция v2: добавляем поле transcription для существующих записей
      if (tx.table("words")) {
        return tx.table("words").toCollection().modify((word) => {
          if (!word.transcription) {
            word.transcription = "";
          }
        });
      }
    });
  }
}

export const db = new LexiFlowDB();

