import { ThemeProvider } from '@/components/providers/theme/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './components/providers/auth/auth-provider.tsx';
import { PartisiaProvider } from './components/providers/partisia/partisia-provider.tsx';
import { SettingsProvider } from './components/providers/setting/setting-provider.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import './index.css';
import { LotteryProvider } from './lib/LotteryContext.tsx';
import './polyfill.ts';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
          <PartisiaProvider>
            <AuthProvider>
              <LotteryProvider>
                <App />
                <Toaster position='top-center' richColors />
              </LotteryProvider>
            </AuthProvider>
          </PartisiaProvider>
        </ThemeProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </StrictMode>
);
