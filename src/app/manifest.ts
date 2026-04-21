import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adrian's Muscle Plan",
    short_name: "Muscle Plan",
    description: "Workout tracker for Adrian",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1f2e",
    theme_color: "#1a1f2e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
