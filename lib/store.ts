import { create } from "zustand";
import { Word, db } from "./db";

interface WordStore {
  words: Word[];
  isLoading: boolean;
  loadWords: () => Promise<void>;
  addWord: (word: Omit<Word, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  addWords: (words: Omit<Word, "id" | "createdAt" | "updatedAt">[]) => Promise<void>;
  updateWord: (id: number, updates: Partial<Word>) => Promise<void>;
  deleteWord: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useWordStore = create<WordStore>((set, get) => ({
  words: [],
  isLoading: false,

  loadWords: async () => {
    set({ isLoading: true });
    try {
      const words = await db.words.toArray();
      set({ words, isLoading: false });
    } catch (error) {
      console.error("Ошибка загрузки слов:", error);
      set({ isLoading: false });
    }
  },

  addWord: async (wordData) => {
    try {
      const now = Date.now();
      const newWord: Omit<Word, "id"> = {
        ...wordData,
        createdAt: now,
        updatedAt: now,
      };
      const id = await db.words.add(newWord as Word);
      const word = { ...newWord, id } as Word;
      set({ words: [...get().words, word] });
    } catch (error) {
      console.error("Ошибка добавления слова:", error);
      throw error;
    }
  },

  addWords: async (wordsData) => {
    try {
      const now = Date.now();
      const newWords = wordsData.map((word) => ({
        ...word,
        createdAt: now,
        updatedAt: now,
      })) as Word[];
      const ids = await db.words.bulkAdd(newWords);
      const wordsWithIds = newWords.map((word, index) => ({
        ...word,
        id: ids[index],
      }));
      set({ words: [...get().words, ...wordsWithIds] });
    } catch (error) {
      console.error("Ошибка массового добавления слов:", error);
      throw error;
    }
  },

  updateWord: async (id, updates) => {
    try {
      const updatedAt = Date.now();
      await db.words.update(id, { ...updates, updatedAt });
      set({
        words: get().words.map((word) =>
          word.id === id ? { ...word, ...updates, updatedAt } : word
        ),
      });
    } catch (error) {
      console.error("Ошибка обновления слова:", error);
      throw error;
    }
  },

  deleteWord: async (id) => {
    try {
      await db.words.delete(id);
      set({ words: get().words.filter((word) => word.id !== id) });
    } catch (error) {
      console.error("Ошибка удаления слова:", error);
      throw error;
    }
  },

  clearAll: async () => {
    try {
      await db.words.clear();
      set({ words: [] });
    } catch (error) {
      console.error("Ошибка очистки базы:", error);
      throw error;
    }
  },
}));

