import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/l/", "/i/", "/api/", "/share-target"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
