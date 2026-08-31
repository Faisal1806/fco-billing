'use client';

import {
  getDocuments,
  saveDocument,
} from '@/lib/actions';

type DataItem = Record<string, any>;

type DataStore = {
  data: DataItem[];
  loaded: boolean;
  loading: boolean;
  listeners: Set<() => void>;
};

const store: DataStore = {
  data: [],
  loaded: false,
  loading: false,
  listeners: new Set(),
};


/**
 * LOAD EVERYTHING FROM MONGODB
 */
export async function loadDataStore(
  force = false
): Promise<void> {
  if (store.loading) {
    return;
  }

  if (store.loaded && !force) {
    return;
  }

  store.loading = true;

  try {
    const result = await getDocuments();

    if (result.success) {
      store.data = result.data || [];
      store.loaded = true;
    }
  } catch (error) {
    console.error(
      'Failed to load central MongoDB data:',
      error
    );
  } finally {
    store.loading = false;

    store.listeners.forEach(listener => {
      listener();
    });
  }
}


/**
 * GET ALL CENTRAL DATA
 */
export function getAllData(): DataItem[] {
  return store.data;
}


/**
 * GET DOCUMENTS BY PREFIX
 */
export function getByPrefix(
  prefix: string
): DataItem[] {
  return store.data.filter(item =>
    String(item.key || '').startsWith(prefix)
  );
}


/**
 * GET ONE DOCUMENT
 */
export function getByKey(
  key: string
): DataItem | undefined {
  return store.data.find(
    item => item.key === key
  );
}


/**
 * CHECK WHETHER DATA HAS LOADED
 */
export function isStoreLoaded(): boolean {
  return store.loaded;
}


/**
 * SUBSCRIBE TO DATA CHANGES
 */
export function onStoreLoaded(
  listener: () => void
) {
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
  };
}


/**
 * FORCE REFRESH FROM MONGODB
 */
export async function refreshDataStore() {
  store.loaded = false;

  await loadDataStore(true);
}


/**
 * SAVE TO MONGODB
 */
export async function saveToCentralStore(
  key: string,
  data: Record<string, any>
) {
  const result = await saveDocument(key, data);

  if (!result.success) {
    return result;
  }

  const newItem = {
    key,
    ...data,
  };

  const existingIndex = store.data.findIndex(
    item => item.key === key
  );

  if (existingIndex >= 0) {
    store.data[existingIndex] = newItem;
  } else {
    store.data.push(newItem);
  }

  store.listeners.forEach(listener => {
    listener();
  });

  return result;
}
