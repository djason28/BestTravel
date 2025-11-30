import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const el = document.getElementById('root')!;
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>
);

