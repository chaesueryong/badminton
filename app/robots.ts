import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/onboarding',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://badmate.club/sitemap.xml',
    host: 'https://badmate.club',
  }
}
