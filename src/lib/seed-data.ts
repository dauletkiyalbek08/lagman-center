import type { MenuItem } from "./types";

export const MENU_CATEGORIES = [
  "Основные блюда",
  "Шашлык",
  "Выпечка",
  "Салаты",
  "Гарниры",
  "Напитки",
] as const;

/**
 * Стартовое меню. Используется как сид для Supabase и как
 * фолбэк, когда Supabase не подключён (демо-режим).
 */
export const SEED_MENU_ITEMS: MenuItem[] = [
  // Основные блюда
  {
    id: "lagman",
    name: "Лагман",
    description: "Классический лагман по-узбекски",
    price: 2490,
    category: "Основные блюда",
    image_url: "/images/lagman.jpg",
    is_available: true,
  },
  {
    id: "plov",
    name: "Плов",
    description: "Сочный плов с бараниной",
    price: 2190,
    category: "Основные блюда",
    image_url: "/images/plov.jpg",
    is_available: true,
  },
  {
    id: "manty",
    name: "Манты",
    description: "Домашние манты с сочной бараниной и луком, 5 шт.",
    price: 1890,
    category: "Основные блюда",
    image_url: "/images/manty.jpg",
    is_available: true,
  },
  {
    id: "shorpa",
    name: "Шорпа",
    description: "Наваристый бульон с бараниной и овощами",
    price: 1690,
    category: "Основные блюда",
    image_url: "/images/shorpa.jpg",
    is_available: true,
  },
  {
    id: "guiru-lagman",
    name: "Гуйру-лагман",
    description: "Жареный лагман с говядиной и овощами",
    price: 2690,
    category: "Основные блюда",
    image_url: "/images/guiru-lagman.jpg",
    is_available: true,
  },
  // Шашлык
  {
    id: "shashlik-lamb",
    name: "Шашлык из баранины",
    description: "Сочный шашлык из отборной баранины",
    price: 2990,
    category: "Шашлык",
    image_url: "/images/shashlik-lamb.jpg",
    is_available: true,
  },
  {
    id: "shashlik-chicken",
    name: "Шашлык из курицы",
    description: "Нежное куриное филе в фирменном маринаде",
    price: 1990,
    category: "Шашлык",
    image_url: "/images/shashlik-chicken.jpg",
    is_available: true,
  },
  {
    id: "shashlik-beef",
    name: "Шашлык из говядины",
    description: "Мраморная говядина на углях",
    price: 2790,
    category: "Шашлык",
    image_url: "/images/shashlik-beef.jpg",
    is_available: true,
  },
  {
    id: "lyulya-kebab",
    name: "Люля-кебаб",
    description: "Рубленая баранина с зеленью на мангале",
    price: 2490,
    category: "Шашлык",
    image_url: "/images/lyulya-kebab.jpg",
    is_available: true,
  },
  // Выпечка
  {
    id: "samsa",
    name: "Самса",
    description: "Хрустящая самса с мясной начинкой",
    price: 690,
    category: "Выпечка",
    image_url: "/images/samsa.jpg",
    is_available: true,
  },
  {
    id: "lepyoshka",
    name: "Лепёшка тандырная",
    description: "Горячая лепёшка из тандыра",
    price: 350,
    category: "Выпечка",
    image_url: "/images/lepyoshka.jpg",
    is_available: true,
  },
  {
    id: "baursak",
    name: "Баурсаки",
    description: "Воздушные баурсаки к чаю, 10 шт.",
    price: 590,
    category: "Выпечка",
    image_url: null,
    is_available: true,
  },
  // Гарниры
  {
    id: "fries",
    name: "Картофель фри",
    description: "Хрустящий картофель со специями",
    price: 890,
    category: "Гарниры",
    image_url: "/images/fries.jpg",
    is_available: true,
  },
  // Салаты
  {
    id: "achichuk",
    name: "Ачичук",
    description: "Свежие помидоры, лук и зелень",
    price: 990,
    category: "Салаты",
    image_url: "/images/achichuk.jpg",
    is_available: true,
  },
  {
    id: "fresh-salad",
    name: "Овощной салат",
    description: "Огурцы, помидоры, зелень и масло",
    price: 1190,
    category: "Салаты",
    image_url: "/images/fresh-salad.jpg",
    is_available: true,
  },
  // Напитки
  {
    id: "tea-pot",
    name: "Чай в чайнике",
    description: "Чёрный или зелёный чай, 1 л",
    price: 690,
    category: "Напитки",
    image_url: "/images/tea-pot.jpg",
    is_available: true,
  },
  {
    id: "morse",
    name: "Морс ягодный",
    description: "Домашний морс из свежих ягод, 0.5 л",
    price: 590,
    category: "Напитки",
    image_url: "/images/morse.jpg",
    is_available: true,
  },
  {
    id: "cola",
    name: "Газированные напитки",
    description: "Coca-Cola, Fanta, Sprite, 0.5 л",
    price: 490,
    category: "Напитки",
    image_url: "/images/cola.jpg",
    is_available: true,
  },
];

/**
 * Популярные блюда для главной (порядок важен). Ищем по НАЗВАНИЮ, а не по id:
 * в Supabase у блюд свои uuid, и совпадения по id не будет никогда.
 */
export const POPULAR_ITEM_NAMES = [
  "Лагман",
  "Плов",
  "Шашлык из баранины",
  "Самса",
];
