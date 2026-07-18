// Global in-memory data store - shared across all pages
// Populated from MongoDB on app load

type DataStore = {
  data: Record<string, unknown>[];
  loaded: boolean;
  listeners: Set<() => void>;
};

const store: DataStore = {
  data: [],
  loaded: false,
  listeners: new Set(),
};

export async function loadDataStore(): Promise<void> {
  try {
    const res = await fetch('/api/documents');
    const result = await res.json();
    if (result.success && result.data) {
      store.data = result.data;
      store.loaded = true;
      // Write to localStorage as backup
      const userRole = localStorage.getItem('userRole');
      result.data.forEach((item: Record<string, unknown>) => {
        const key = item.key as string;
        if (key) {
          const { key: _, ...value } = item;
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
      if (userRole) localStorage.setItem('userRole', userRole);
      // Notify all listeners
      store.listeners.forEach(fn => fn());
    }
  } catch (error) {
    console.error('Failed to load data store:', error);
    store.loaded = true;
    store.listeners.forEach(fn => fn());
  }
}

export function getByPrefix(prefix: string): Record<string, unknown>[] {
  return store.data.filter(item => (item.key as string)?.startsWith(prefix));
}

export function isStoreLoaded(): boolean {
  return store.loaded;
}

export function onStoreLoaded(fn: () => void): () => void {
  if (store.loaded) {
    fn();
    return () => {};
  }
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
}
