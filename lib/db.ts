import Dexie, { Table } from "dexie";

export interface Word {
  id?: number;
  word: string;
  translation: string;
  tags: string[];
  box: number; // 1-5 для системы Leitner
  nextReviewDate: number; // timestamp
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export class LexiFlowDB extends Dexie {
  words!: Table<Word, number>;

  constructor() {
    super("LexiFlowDB");
    this.version(1).stores({
      words: "++id, word, translation, box, nextReviewDate, createdAt",
    });
  }
}

export const db = new LexiFlowDB();

