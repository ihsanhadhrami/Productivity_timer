import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

/**
 * PWA Service Worker Registration
 * 
 * Using 'prompt' strategy from vite-plugin-pwa config:
 * - Service worker updates are detected but not applied automatically
 * - User is notified and can choose when to update
 * - Prevents disruption during active timer sessions
 */
const updateSW = registerSW({
  // Called when new service worker is available
  onNeedRefresh() {
    // Log for debugging - in production you might show a toast notification
    console.log('[PWA] New content available, please refresh.');
    
    // Optional: You could dispatch a custom event here to show an update notification
    // window.dispatchEvent(new CustomEvent('pwa-update-available'));
  },
  
  // Called when content has been cached for offline use
  onOfflineReady() {
    console.log('[PWA] App ready to work offline.');
  },
  
  // Called if there's an error during registration
  onRegisterError(error) {
    console.error('[PWA] Service worker registration error:', error);
  },
});

// Make updateSW available globally for manual update triggering if needed
if (typeof window !== 'undefined') {
  (window as Window & { __updateSW?: typeof updateSW }).__updateSW = updateSW;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);