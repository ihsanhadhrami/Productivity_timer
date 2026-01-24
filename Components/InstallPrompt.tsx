import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import type { BeforeInstallPromptEvent, InstallPromptProps } from '../pwa-types';

/**
 * InstallPrompt Component
 * 
 * Provides a custom install UI for PWA installation using the beforeinstallprompt event.
 * Falls back gracefully on browsers that don't support the install prompt (Safari, Firefox).
 * 
 * Key features:
 * - Captures beforeinstallprompt event to enable custom install button
 * - Shows installation instructions for iOS/Safari users
 * - Remembers dismissal preference using localStorage
 * - Detects if already running as installed PWA
 */

// Storage key for tracking if user has dismissed the prompt
const INSTALL_PROMPT_DISMISSED_KEY = 'ihsan_pwa_install_dismissed';
const DISMISS_DURATION_DAYS = 7; // Re-show after 7 days

// Detect if running in standalone mode (already installed)
const isRunningStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Detect iOS device
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
};

// Check if the user has recently dismissed the prompt
const hasRecentlyDismissed = (): boolean => {
  try {
    const dismissedAt = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    if (!dismissedAt) return false;
    
    const dismissDate = new Date(dismissedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysDiff < DISMISS_DURATION_DAYS;
  } catch {
    return false;
  }
};

// Save dismissal timestamp
const saveDismissal = (): void => {
  try {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, new Date().toISOString());
  } catch {
    // localStorage not available, fail silently
  }
};

const InstallPrompt: React.FC<InstallPromptProps> = ({ onDismiss, onInstall }) => {
  // Store the deferred prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // UI state
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // Handle the beforeinstallprompt event
  const handleBeforeInstallPrompt = useCallback((e: BeforeInstallPromptEvent) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Store the event for later use
    setDeferredPrompt(e);
    
    // Only show our custom prompt if not recently dismissed
    if (!hasRecentlyDismissed()) {
      setShowPrompt(true);
    }
  }, []);

  // Handle successful installation
  const handleAppInstalled = useCallback(() => {
    setJustInstalled(true);
    setShowPrompt(false);
    setDeferredPrompt(null);
    onInstall?.();
    
    // Hide success message after 3 seconds
    setTimeout(() => setJustInstalled(false), 3000);
  }, [onInstall]);

  // Set up event listeners
  useEffect(() => {
    // Don't show if already installed or on iOS (iOS doesn't fire beforeinstallprompt)
    if (isRunningStandalone()) {
      return;
    }

    // For iOS, show instructions instead of install prompt
    if (isIOS() && !hasRecentlyDismissed()) {
      setShowIOSInstructions(true);
      setShowPrompt(true);
      return;
    }

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled]);

  // Handle install button click
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // Installation was accepted - appinstalled event will fire
        console.log('PWA installation accepted');
      } else {
        // User dismissed the prompt
        console.log('PWA installation dismissed');
        handleDismiss();
      }
    } catch (error) {
      console.error('PWA installation error:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    saveDismissal();
    setShowPrompt(false);
    setShowIOSInstructions(false);
    onDismiss?.();
  };

  // Show success toast after installation
  if (justInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="bg-slate-800/95 backdrop-blur-sm border border-accent/30 rounded-xl p-4 shadow-lg shadow-accent/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-white font-medium">App Installed!</p>
            <p className="text-slate-400 text-sm">Focus Timer is ready to use</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not showing
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-accent/30 flex items-center justify-center shadow-lg shadow-accent/10">
              <span className="text-accent font-bold text-xl">I</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Install Focus Timer</h3>
              <p className="text-slate-400 text-sm">Get the full app experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Standalone app</span>
          </div>
        </div>

        {/* iOS Instructions */}
        {showIOSInstructions ? (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">
              To install on iOS:
            </p>
            <ol className="text-slate-400 text-sm space-y-2 list-decimal list-inside">
              <li>Tap the <span className="text-white">Share</span> button in Safari</li>
              <li>Scroll and tap <span className="text-white">"Add to Home Screen"</span></li>
              <li>Tap <span className="text-white">"Add"</span> to confirm</li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Got it
            </button>
          </div>
        ) : (
          /* Install Button for Android/Desktop */
          <button
            onClick={handleInstallClick}
            disabled={isInstalling || !deferredPrompt}
            className="w-full py-2.5 px-4 bg-accent hover:bg-accent/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isInstalling ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Install App
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
