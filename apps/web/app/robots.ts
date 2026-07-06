import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/customer', '/driver', '/supervisor', '/accountant', '/workshop'],
    },
    host: 'https://edham.sa',
    sitemap: 'https://edham.sa/sitemap.xml',
  };
}
