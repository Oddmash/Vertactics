export const siteUrl = new URL('https://oddmash.github.io/Vertactics/');
export const landingUrl = new URL('about/', siteUrl);
export const socialImage = new URL('social-card.png', siteUrl);
export const title = 'Vertactics — 오버워치 전술 플래너';
export const description = '2D·3D 전술 지도에서 지형과 시야를 확인하고, 영웅 배치와 진입 경로를 만들어 팀과 공유하세요.';
const editorPath = process.env.VERTACTICS_BASE ?? '/';

export const editorUrl = process.env.NODE_ENV === 'development'
  ? new URL(editorPath, 'http://localhost:5173').href : editorPath;
