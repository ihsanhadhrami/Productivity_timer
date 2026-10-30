import { useEffect, useState } from 'react';

// Local Storage Keys
export const STORAGE_KEYS = {
  stats: 'ihsan_timer_stats',
  focusTask: 'ihsan_focus_task',
  history: 'ihsan_session_history',
  theme: 'ihsan_theme',
  notificationSound: 'ihsan_notification_sound',
  streak: 'ihsan_streak',
  lastActiveDate: 'ihsan_last_active_date',
  chunkProjects: 'ihsan_chunk_projects',
} as const;

// How a value is turned into a stored string and back.
// `parse` may throw or return undefined to fall back to the default.
export interface StorageCodec<T> {
  parse: (raw: string) => T | undefined;
  stringify: (value: T) => string;
}

export const jsonCodec = <T,>(): StorageCodec<T> => ({
  parse: (raw) => JSON.parse(raw) as T,
  stringify: (value) => JSON.stringify(value),
});

export const stringCodec: StorageCodec<string> = {
  parse: (raw) => raw || undefined,
  stringify: (value) => value,
};

// Safe localStorage helpers with error handling
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to read from localStorage: ${key}`, e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to write to localStorage: ${key}`, e);
  }
};

const readStored = <T,>(key: string, fallback: T, codec: StorageCodec<T>): T => {
  const raw = safeGetItem(key);
  if (raw === null) return fallback;
  try {
    const parsed = codec.parse(raw);
    return parsed === undefined ? fallback : parsed;
  } catch (e) {
    console.warn(`Failed to parse stored value: ${key}`, e);
    return fallback;
  }
};

/**
 * useState that loads its initial value from localStorage and writes every
 * change back. Unreadable, missing or corrupt data falls back to `fallback`.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T | (() => T),
  codec: StorageCodec<T> = jsonCodec<T>()
) {
  const [value, setValue] = useState<T>(() => {
    const fallbackValue = typeof fallback === 'function' ? (fallback as () => T)() : fallback;
    return readStored(key, fallbackValue, codec);
  });

  useEffect(() => {
    safeSetItem(key, codec.stringify(value));
    // codec is expected to be stable for the lifetime of the key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue] as const;
}
