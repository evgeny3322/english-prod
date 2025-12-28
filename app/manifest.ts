import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LexiFlow - Изучение слов",
    short_name: "LexiFlow",
    description: "Персональный словарь с системой интервальных повторений",
    start_url: "/",
    display: "standalone",
    background_color: "#1a202c",
    theme_color: "#1a202c",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    categories: ["education", "productivity"],
    lang: "ru",
  };
}

