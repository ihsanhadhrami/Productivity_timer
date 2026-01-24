/**
 * PWA Types for Focus Timer
 * 
 * These types extend the standard browser interfaces to support
 * the beforeinstallprompt event and related PWA functionality.
 */

/**
 * Extended WindowEventMap with beforeinstallprompt event
 * This event fires when the browser determines the app meets PWA install criteria
 */
export interface BeforeInstallPromptEvent extends Event {
  /**
   * Returns an array of DOMString items containing the platforms on which the
   * event was dispatched. This is provided for user agents that want to present
   * a choice of versions to the user such as, for example, "web" or "play"
   * which would allow the user to choose between a web version or an Android version.
   */
  readonly platforms: ReadonlyArray<string>;
  
  /**
   * Returns a Promise that resolves to a DOMString containing either "accepted"
   * or "dismissed", after the user has made a choice.
   */
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  
  /**
   * Shows the install prompt to the user. Returns a Promise that resolves
   * when the user has responded to the prompt.
   */
  prompt(): Promise<void>;
}

/**
 * Extend WindowEventMap to include beforeinstallprompt
 */
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

/**
 * PWA install state for managing the install prompt UI
 */
export interface PWAInstallState {
  /** Whether the app can be installed (install prompt is available) */
  canInstall: boolean;
  /** Whether the app is already installed */
  isInstalled: boolean;
  /** Whether we're currently showing the install prompt */
  isPrompting: boolean;
}

/**
 * Props for the InstallPrompt component
 */
export interface InstallPromptProps {
  /** Callback when the user dismisses the install prompt */
  onDismiss?: () => void;
  /** Callback when the app is successfully installed */
  onInstall?: () => void;
}
