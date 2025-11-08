import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// --- (NEW) React Query Imports from @tanstack/react-query ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- (NEW) Create a client ---
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* --- (NEW) Wrap App in provider --- */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)