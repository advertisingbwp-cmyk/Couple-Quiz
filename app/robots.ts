import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/quiz/sharing";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/quiz", "/quiz/create"],
        disallow: [
          "/api/",
          "/quiz/share/",
          "/quiz/result/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
