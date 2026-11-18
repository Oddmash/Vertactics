import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import LocaleProvider from './ui/locale';
import './theme';
import './theme/editor.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing');

createRoot(root).render(
  <StrictMode>
    <LocaleProvider><App /></LocaleProvider>
  </StrictMode>,
);
