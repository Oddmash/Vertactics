import type { MetadataRoute } from 'next';
import { siteUrl } from './site';

export const dynamic = 'force-static';

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: '*', allow: siteUrl.pathname },
  sitemap: new URL('sitemap.xml', siteUrl).href,
});

export default robots;
