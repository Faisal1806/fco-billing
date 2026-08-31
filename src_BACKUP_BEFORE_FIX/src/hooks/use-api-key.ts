
'use client';

import { useState, useEffect, useCallback } from 'react';

const API_KEY_STORAGE_ITEM = 'gemini_api_key';

export const useApiKey = () => {
  const [apiKey, setApiKeyState] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_ITEM);
      if (storedKey) {
        setApiKeyState(storedKey);
        setIsApiKeySet(true);
      }
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem(API_KEY_STORAGE_ITEM, key);
        setApiKeyState(key);
        setIsApiKeySet(true);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_ITEM);
        setApiKeyState('');
        setIsApiKeySet(false);
      }
    }
  }, []);

  return { apiKey, setApiKey, isApiKeySet };
};



