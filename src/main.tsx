import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from './editor/editor';
import './theme';
import './theme/editor.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing');

createRoot(root).render(
  <StrictMode>
    <Editor />
  </StrictMode>,
);
