"use client";
import Script from "next/script";

export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://palaviva.vercel.app/#website",
        url: "https://palaviva.vercel.app/",
        name: "Palaviva",
        publisher: { "@id": "https://palaviva.vercel.app/#organization" },
      },
      {
        "@type": "Organization",
        "@id": "https://palaviva.vercel.app/#organization",
        name: "Palaviva",
        logo: {
          "@type": "ImageObject",
          url: "https://palaviva.vercel.app/logo.png",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://palaviva.vercel.app/",
          },
        ],
      },
    ],
  };

  return (
    <Script
      id="ld-json"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
