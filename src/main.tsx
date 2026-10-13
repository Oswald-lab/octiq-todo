import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getRouterBasename } from './lib/router-basename';
import App from './App';
import './index.css';
import { recipeChrome } from './recipes';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={getRouterBasename()}>
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <App />
          {recipeChrome}
        </AppErrorBoundary>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
