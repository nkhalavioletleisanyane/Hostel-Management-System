/**
 * Local storage utility with fallback to defaults
 */
export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error loading key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key "${key}" to localStorage:`, err);
  }
}

export function clearStoredData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error clearing key "${key}" from localStorage:`, err);
  }
}
