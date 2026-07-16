import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './src/App.jsx';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30 * 1000, // 30 seconds
            refetchOnWindowFocus: false,
        },
    },
});

createRoot(document.getElementById('app')).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,.25)',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
                    error:   { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
                }}
            />
        </QueryClientProvider>
    </StrictMode>
);
