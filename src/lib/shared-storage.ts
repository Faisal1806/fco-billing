import { deleteDocument, getDocument, getDocuments, saveDocument } from '@/lib/actions';

type SharedStorageEnvelope = {
  __fcoSharedStorage: true;
  type: 'string';
  value: string;
};

const STORAGE_SYNC_MARKER = '__fcoSharedStorage';
let initialized = false;
let hydrationPromise: Promise<void> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getStorage(): Storage | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage;
}

function createEnvelope(value: string): SharedStorageEnvelope {
  return {
    __fcoSharedStorage: true,
    type: 'string',
    value,
  };
}

function unwrapValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__fcoSharedStorage === true &&
    typeof (value as Record<string, unknown>).value === 'string'
  ) {
    return (value as Record<string, unknown>).value as string;
  }

  return null;
}

async function persistRemoteValue(key: string, value: string): Promise<void> {
  if (!key) {
    return;
  }

  try {
    await saveDocument(key, createEnvelope(value));
  } catch (error) {
    console.warn('Shared storage sync save failed:', error);
  }
}

async function removeRemoteValue(key: string): Promise<void> {
  if (!key) {
    return;
  }

  try {
    await deleteDocument(key);
  } catch (error) {
    console.warn('Shared storage sync delete failed:', error);
  }
}

async function hydrateFromServer(): Promise<void> {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    const result = await getDocuments();

    if (!result.success || !Array.isArray(result.data)) {
      return;
    }

    for (const item of result.data) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const key = typeof (item as Record<string, unknown>).key === 'string'
        ? (item as Record<string, unknown>).key as string
        : null;

      if (!key) {
        continue;
      }

      const remoteValue = unwrapValue(
      (item as Record<string, unknown>).value ?? item
    );

      if (remoteValue !== null && storage.getItem(key) !== remoteValue) {
        storage.setItem(key, remoteValue);
      }
    }
  } catch (error) {
    console.warn('Shared storage hydration failed:', error);
  }
}

async function hydrateSingleValue(key: string): Promise<void> {
  const storage = getStorage();

  if (!storage || !key) {
    return;
  }

  try {
    const result = await getDocument(key);

    if (!result.success) {
      return;
    }

    const remoteValue = unwrapValue(result.data);

    if (remoteValue !== null && storage.getItem(key) !== remoteValue) {
      storage.setItem(key, remoteValue);
    }
  } catch (error) {
    console.warn('Shared storage hydration failed for key:', key, error);
  }
}

export function initializeSharedStorage(): void {
  if (!isBrowser() || initialized) {
    return;
  }

  initialized = true;

  const storage = getStorage();

  if (!storage) {
    return;
  }

  const storageProto = Object.getPrototypeOf(storage) as Storage & {
    __fcoSharedStoragePatched?: boolean;
  };

  if (storageProto.__fcoSharedStoragePatched) {
    return;
  }

  const originalSetItem = storageProto.setItem;
  const originalGetItem = storageProto.getItem;
  const originalRemoveItem = storageProto.removeItem;
  const originalClear = storageProto.clear;

  storageProto.setItem = function (this: Storage, key: string, value: string): void {
    originalSetItem.call(this, key, value);

    if (key) {
      void persistRemoteValue(key, value);
    }
  };

  storageProto.getItem = function (this: Storage, key: string): string | null {
    const localValue = originalGetItem.call(this, key);

    if (localValue !== null) {
      return localValue;
    }

    if (key) {
      void hydrateSingleValue(key);
    }

    return null;
  };

  storageProto.removeItem = function (this: Storage, key: string): void {
    originalRemoveItem.call(this, key);

    if (key) {
      void removeRemoteValue(key);
    }
  };

  storageProto.clear = function (this: Storage): void {
    const keys: string[] = [];

    for (let index = 0; index < this.length; index += 1) {
      const key = this.key(index);

      if (key) {
        keys.push(key);
      }
    }

    originalClear.call(this);

    for (const key of keys) {
      void removeRemoteValue(key);
    }
  };

  storageProto.__fcoSharedStoragePatched = true;

  hydrationPromise = hydrateFromServer();

  window.setInterval(() => {
    void ensureSharedStorageHydrated();
  }, 15000);

  window.addEventListener('focus', () => {
    void ensureSharedStorageHydrated();
  });
}

export function ensureSharedStorageHydrated(): Promise<void> {
  if (!isBrowser()) {
    return Promise.resolve();
  }

  if (!hydrationPromise) {
    hydrationPromise = hydrateFromServer();
  }

  return hydrationPromise;
}
