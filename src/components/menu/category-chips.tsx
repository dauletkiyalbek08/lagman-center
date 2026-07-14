"use client";

/** Устойчивый anchor-id секции категории (кириллица в id допустима). */
export function categoryAnchorId(category: string): string {
  return `category-${category.toLowerCase().replace(/\s+/g, "-")}`;
}

interface CategoryChipsProps {
  categories: string[];
}

/**
 * Горизонтальная лента чипов-категорий. Прилипает под шапкой сайта,
 * на мобильном скроллится по горизонтали. Клик — плавный скролл
 * к секции категории.
 */
export function CategoryChips({ categories }: CategoryChipsProps) {
  const scrollToCategory = (category: string) => {
    document
      .getElementById(categoryAnchorId(category))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-20 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => scrollToCategory(category)}
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:border-primary/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
