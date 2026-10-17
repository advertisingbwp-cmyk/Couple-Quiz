import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/quiz/sharing";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/quiz",
          "/quiz/create",
          "/api/og/quiz/",
          "/api/og/quiz",
        ],
        disallow: [
          "/api/",
          "/quiz/share/",
          "/quiz/result/",
          "/design-preview/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
