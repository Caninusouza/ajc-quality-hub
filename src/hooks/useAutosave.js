import { useEffect, useRef } from 'react';

/**
 * Hook that automatically saves form data every 5 seconds in the background
 * Does not refresh the UI or interrupt user workflow
 * 
 * @param {Object} data - Current form data to autosave
 * @param {Function} onSave - Async function that persists the data (e.g., to API)
 * @param {Number} interval - Interval in milliseconds (default: 5000)
 */
export function useAutosave(data, onSave, interval = 5000) {
  const lastSavedRef = useRef(null);
  const timeoutRef = useRef(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    const performAutosave = async () => {
      // Skip if no data changed since last save
      if (JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
        return;
      }

      // Skip if already saving (prevent race conditions)
      if (isSavingRef.current) {
        return;
      }

      try {
        isSavingRef.current = true;
        await onSave(data);
        lastSavedRef.current = JSON.parse(JSON.stringify(data));
        // Silent success - no toast, no UI change
      } catch (error) {
        // Silently log error, don't interrupt user
        console.warn('Autosave failed:', error.message);
      } finally {
        isSavingRef.current = false;
      }
    };

    // Schedule next autosave
    timeoutRef.current = setTimeout(performAutosave, interval);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, onSave, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}