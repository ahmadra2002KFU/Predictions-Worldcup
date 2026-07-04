import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مفيد | توقعات كأس العالم",
    short_name: "توقعات مفيد",
    description: "توقع نتائج مباريات كأس العالم مع مفيد وتنافس في لوحة الصدارة",
    start_url: "/matches",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#14101a",
    theme_color: "#a23b9d",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
