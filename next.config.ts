import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Разрешаем внешние фото блюд (Unsplash, Supabase Storage и т.п.) —
    // админ может вставлять ссылки на изображения при добавлении блюда.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
