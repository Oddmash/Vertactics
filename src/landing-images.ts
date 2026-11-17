for (const image of document.querySelectorAll<HTMLImageElement>('.hero-map img, .workflow-list img')) {
  const settle = () => delete image.dataset.loading;
  if (!image.complete) {
    image.dataset.loading = 'true';
    image.addEventListener('load', settle, { once: true });
    image.addEventListener('error', settle, { once: true });
  }
}
