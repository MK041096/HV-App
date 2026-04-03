import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/mein-bereich/', '/api/'],
    },
    sitemap: 'https://smartcarl.com/sitemap.xml',
  }
}
