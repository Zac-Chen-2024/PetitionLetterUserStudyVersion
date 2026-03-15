import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { StudyProvider } from './context/StudyContext.tsx';
import './i18n/index.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StudyProvider>
        <App />
      </StudyProvider>
    </BrowserRouter>
  </StrictMode>,
);
