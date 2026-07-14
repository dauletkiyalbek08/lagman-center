import { MenuCatalog } from "@/components/menu/menu-catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Меню",
  description:
    "Полное меню Lagman Center: лагман, плов, шашлык на углях, выпечка из тандыра, салаты и напитки. Халяль. Доставка по Щучинску.",
};

export default function MenuPage() {
  return <MenuCatalog />;
}
