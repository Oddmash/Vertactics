const editorBase = (process.env.VERTACTICS_BASE ?? '/').replace(/\/$/, '');

export default {
  output: 'export',
  trailingSlash: true,
  basePath: `${editorBase}/about`,
  devIndicators: false,
  reactStrictMode: true,
};
