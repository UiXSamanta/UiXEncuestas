import '../init'; // MUST be first import - runs error protection
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './components/ThemeProvider';

// INJECT IMMEDIATELY - Create dummy elements that Figma's share-modal.js is looking for
if (typeof window !== 'undefined') {
  // Create dummy share button if it doesn't exist
  if (!document.getElementById('figma-share-button')) {
    const dummyBtn = document.createElement('div');
    dummyBtn.id = 'figma-share-button';
    dummyBtn.style.display = 'none';
    document.body?.appendChild(dummyBtn);
  }
  
  // Override addEventListener to catch and suppress the error
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type: string, listener: any, options?: any) {
    try {
      return originalAddEventListener.call(this, type, listener, options);
    } catch (e) {
      console.warn('⚠️ addEventListener error suppressed:', e);
    }
  };
}

export default function App() {
  useEffect(() => {
    console.log('🚀 App mounting...');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Path:', window.location.pathname);
    
    // Prevent Figma's share-modal.js from crashing the app
    const handleError = (event: ErrorEvent) => {
      console.error('⚠️ Global error captured:', event.message);
      
      if (event.message && event.message.includes('share-modal')) {
        console.warn('⚠️ Figma share-modal error suppressed');
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
      
      // Also catch null/undefined errors from external scripts
      if (event.message && event.message.includes("Cannot read properties of null")) {
        console.warn('⚠️ External script error suppressed:', event.message);
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('⚠️ Unhandled promise rejection:', event.reason);
    };
    
    window.addEventListener('error', handleError, true); // Use capture phase
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    console.log('✅ Error handlers installed');
    
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ThemeProvider>
  );
}