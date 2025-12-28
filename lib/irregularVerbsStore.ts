import { create } from "zustand";
import { IrregularVerb, db } from "./db";

interface IrregularVerbStore {
  verbs: IrregularVerb[];
  isLoading: boolean;
  loadVerbs: () => Promise<void>;
  addVerb: (verb: Omit<IrregularVerb, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  addVerbs: (verbs: Omit<IrregularVerb, "id" | "createdAt" | "updatedAt">[]) => Promise<void>;
  updateVerb: (id: number, updates: Partial<IrregularVerb>) => Promise<void>;
  deleteVerb: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useIrregularVerbStore = create<IrregularVerbStore>((set, get) => ({
  verbs: [],
  isLoading: false,

  loadVerbs: async () => {
    set({ isLoading: true });
    try {
      const verbs = await db.irregularVerbs.toArray();
      set({ verbs, isLoading: false });
    } catch (error) {
      console.error("Ошибка загрузки неправильных глаголов:", error);
      set({ isLoading: false });
    }
  },

  addVerb: async (verbData) => {
    try {
      const now = Date.now();
      const newVerb: Omit<IrregularVerb, "id"> = {
        ...verbData,
        createdAt: now,
        updatedAt: now,
      };
      const id = await db.irregularVerbs.add(newVerb as IrregularVerb);
      const verb = { ...newVerb, id } as IrregularVerb;
      set({ verbs: [...get().verbs, verb] });
    } catch (error) {
      console.error("Ошибка добавления глагола:", error);
      throw error;
    }
  },

  addVerbs: async (verbsData) => {
    try {
      const now = Date.now();
      const newVerbs = verbsData.map((verb) => ({
        ...verb,
        createdAt: now,
        updatedAt: now,
      })) as IrregularVerb[];
      const ids = await db.irregularVerbs.bulkAdd(newVerbs);
      const verbsWithIds = newVerbs.map((verb, index) => ({
        ...verb,
        id: ids[index],
      }));
      set({ verbs: [...get().verbs, ...verbsWithIds] });
    } catch (error) {
      console.error("Ошибка массового добавления глаголов:", error);
      throw error;
    }
  },

  updateVerb: async (id, updates) => {
    try {
      const updatedAt = Date.now();
      await db.irregularVerbs.update(id, { ...updates, updatedAt });
      set({
        verbs: get().verbs.map((verb) =>
          verb.id === id ? { ...verb, ...updates, updatedAt } : verb
        ),
      });
    } catch (error) {
      console.error("Ошибка обновления глагола:", error);
      throw error;
    }
  },

  deleteVerb: async (id) => {
    try {
      await db.irregularVerbs.delete(id);
      set({ verbs: get().verbs.filter((verb) => verb.id !== id) });
    } catch (error) {
      console.error("Ошибка удаления глагола:", error);
      throw error;
    }
  },

  clearAll: async () => {
    try {
      await db.irregularVerbs.clear();
      set({ verbs: [] });
    } catch (error) {
      console.error("Ошибка очистки базы:", error);
      throw error;
    }
  },
}));

