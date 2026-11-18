import type { MetadataRoute } from 'next';
import { landingUrl, siteUrl } from './site';

export const dynamic = 'force-static';

const sitemap = (): MetadataRoute.Sitemap => [{ url: landingUrl.href }, { url: siteUrl.href }];

export default sitemap;
