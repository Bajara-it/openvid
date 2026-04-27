import type { MetadataRoute } from 'next';
import { locales } from '@/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://openvid.dev';

  const routes = [
    {
      path: '',
      priority: 1.0,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/donate',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/privacy',
      priority: 0.5,
      changeFrequency: 'yearly' as const,
    },
    {
      path: '/terms',
      priority: 0.5,
      changeFrequency: 'yearly' as const,
    },
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  routes.forEach(({ path, priority, changeFrequency }) => {
    locales.forEach((locale) => {
      const url = path 
        ? `${baseUrl}/${locale}${path}` 
        : `${baseUrl}/${locale}`;

      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [
              loc,
              path ? `${baseUrl}/${loc}${path}` : `${baseUrl}/${loc}`,
            ])
          ),
        },
      });
    });
  });

  return sitemap;
}
