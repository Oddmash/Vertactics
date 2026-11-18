import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { description, landingUrl, siteUrl, socialImage, title } from './site';
import './landing.css';

const image = { url: socialImage, width: 1200, height: 630, alt: 'Vertactics 전술 지도 플래너' };

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  applicationName: 'Vertactics',
  alternates: { canonical: landingUrl.href },
  icons: { icon: new URL('favicon.png', siteUrl) },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: 'Vertactics', title, description, url: landingUrl, images: [image] },
  twitter: { card: 'summary_large_image', title, description, images: [image] },
};

export const viewport: Viewport = { themeColor: '#11121c', colorScheme: 'dark' };

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ko">
    <body>{children}</body>
  </html>
);

export default RootLayout;
