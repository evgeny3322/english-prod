"use client";

import { Word } from "@/lib/db";
import { Button } from "./ui/Button";
import { clsx } from "clsx";

interface TagFilterProps {
  words: Word[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagFilter({ words, selectedTags, onTagsChange }: TagFilterProps) {
  // Собираем все уникальные теги из слов
  const allTags = Array.from(
    new Set(words.flatMap((word) => word.tags).filter(Boolean))
  ).sort();

  if (allTags.length === 0) {
    return null;
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const selectAll = () => {
    onTagsChange(allTags);
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  return (
    <div className="mb-6 bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">
          Фильтр по тегам:
        </h3>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-indigo-400 hover:underline"
          >
            Все
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={clearAll}
            className="text-xs text-indigo-400 hover:underline"
          >
            Очистить
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={clsx(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors",
              selectedTags.includes(tag)
                ? "bg-indigo-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      {selectedTags.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Выбрано: {selectedTags.length} из {allTags.length}
        </p>
      )}
    </div>
  );
}

