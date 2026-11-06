import { unwrapSharedStorageValue } from '@/lib/document-utils';
import {
  deleteDocument,
  getDocument,
  getDocuments,
  saveDocument,
} from '@/lib/actions';

type SharedStorageEnvelope = {
  __fcoSharedStorage: true;
  type: 'string';
  value: string;
};

let initialized = false;
let hydrationPromise: Promise<void> | null = null;
let lastHydrationCompletedAt = 0;
const HYDRATION_INTERVAL_MS = 60_000;

// Prevent our own remote synchronization from triggering another
// localStorage synchronization cycle.
let syncInProgress = false;

export type SyncStatus = 'online' | 'syncing' | 'offline';

function emitSyncStatus(status: SyncStatus): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('fco-sync-status', {
      detail: status,
    })
  );
}

function setSyncStatusFromState(): void {
  emitSyncStatus(
    typeof navigator !== 'undefined' && navigator.onLine
      ? 'online'
      : 'offline'
  );
}

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  );
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

function normalizeRemoteValue(value: unknown): string | null {
  let current = value;

  // MongoDB contains both current shared-storage envelopes and older plain
  // objects. Normalize both to the business value before writing local cache.
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      current = unwrapSharedStorageValue(current);
    } catch {
      return null;
    }

    if (typeof current === 'string') {
      try {
        current = JSON.parse(current) as unknown;
        continue;
      } catch {
        return typeof current === 'string' ? current : null;
      }
    }

    try {
      const serialized = JSON.stringify(current);
      return typeof serialized === 'string' ? serialized : null;
    } catch {
      return null;
    }
  }

  try {
    const serialized = JSON.stringify(current);
    return typeof serialized === 'string' ? serialized : null;
  } catch {
    return null;
  }
}

/**
 * Save a localStorage value to the remote document API.
 *
 * IMPORTANT:
 * This function does NOT touch localStorage.
 * That prevents recursive saveDocument -> localStorage -> saveDocument loops.
 */
async function persistRemoteValue(
  key: string,
  value: string
): Promise<void> {
  if (
    !key ||
    syncInProgress ||
    key.startsWith('fco-document:')
  ) {
    return;
  }

  try {
    syncInProgress = true;
    emitSyncStatus('syncing');

    const result = await saveDocument(
      key,
      createEnvelope(value)
    );

    if (!result.success) {
      emitSyncStatus('offline');
      console.warn('Shared storage sync save failed.');
      return;
    }

    setSyncStatusFromState();
  } catch {
    console.warn('Shared storage sync save failed.');
    emitSyncStatus('offline');
  } finally {
    syncInProgress = false;
  }
}

/**
 * Delete a remote value.
 *
 * This also does not touch localStorage.
 */
async function removeRemoteValue(
  key: string
): Promise<void> {
  if (
    !key ||
    syncInProgress ||
    key.startsWith('fco-document:')
  ) {
    return;
  }

  try {
    syncInProgress = true;

    const result = await deleteDocument(key);
    if (!result.success) {
      emitSyncStatus('offline');
      console.warn('Shared storage sync delete failed.');
    }
  } catch {
    console.warn('Shared storage sync delete failed.');
  } finally {
    syncInProgress = false;
  }
}

/**
 * Load all remote documents into localStorage.
 *
 * We deliberately use the original localStorage methods here,
 * so hydration itself does not trigger another remote save.
 */
async function hydrateFromServer(): Promise<void> {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  let cloudAvailable = false;

  try {
    emitSyncStatus('syncing');
    const result = await getDocuments();

    if (
      !result.success ||
      !Array.isArray(result.data)
    ) {
      emitSyncStatus('offline');
      return;
    }

    cloudAvailable = true;
    const storageProto =
      Object.getPrototypeOf(storage) as Storage & {
        __fcoOriginalSetItem?: Storage['setItem'];
      };

    const originalSetItem =
      storageProto.__fcoOriginalSetItem ||
      Storage.prototype.setItem;
    const originalGetItem =
      storageProto.__fcoOriginalGetItem ||
      Storage.prototype.getItem;

    for (const item of result.data) {
      if (
        !item ||
        typeof item !== 'object'
      ) {
        continue;
      }

      const record =
        item as Record<string, unknown>;

      const key =
        typeof record.key === 'string'
          ? record.key
          : null;

      if (!key) {
        continue;
      }

      // fco-document:* is a legacy duplicate-cache namespace. Do not hydrate
      // it again; business loaders read MongoDB directly and local raw keys.
      if (key.startsWith('fco-document:')) {
        continue;
      }

      // Never overwrite an existing browser record during cloud hydration.
      // Local 2026 records may be the only newer copy of a transaction.
      const existingLocalValue = originalGetItem.call(storage, key);
      if (existingLocalValue !== null && existingLocalValue !== '') {
        continue;
      }

      const remoteValue = normalizeRemoteValue(record.value);

      if (remoteValue === null) {
        continue;
      }

      try {
        syncInProgress = true;

        // Hydration fills missing local keys only. It must never replace
        // an existing local record with an older cloud copy.
        originalSetItem.call(storage, key, remoteValue);
      } catch (error) {
        console.warn(
          'Failed to hydrate local value:',
          key,
          error
        );
      } finally {
        syncInProgress = false;
      }
    }
  } catch (error) {
    console.warn(
      'Shared storage hydration failed:',
      error
    );
    emitSyncStatus('offline');
  } finally {
    emitSyncStatus(
      cloudAvailable &&
        typeof navigator !== 'undefined' &&
        navigator.onLine
        ? 'online'
        : 'offline'
    );
  }
}

function requestHydration(): Promise<void> {
  if (hydrationPromise) {
    return hydrationPromise;
  }

  if (Date.now() - lastHydrationCompletedAt < HYDRATION_INTERVAL_MS) {
    return Promise.resolve();
  }

  hydrationPromise = hydrateFromServer().finally(() => {
    lastHydrationCompletedAt = Date.now();
    hydrationPromise = null;
  });

  return hydrationPromise;
}

/**
 * Load one remote value into localStorage.
 */
async function hydrateSingleValue(
  key: string
): Promise<void> {
  const storage = getStorage();

  if (!storage || !key) {
    return;
  }

  try {
    const result =
      await getDocument(key);

    if (!result.success) {
      return;
    }

    const remoteValue =
      normalizeRemoteValue(result.data);

    if (
      remoteValue !== null &&
      storage.getItem(key) !== remoteValue
    ) {
      const storageProto =
        Object.getPrototypeOf(storage) as Storage & {
          __fcoOriginalSetItem?: Storage['setItem'];
        };

      const originalSetItem =
        storageProto.__fcoOriginalSetItem ||
        Storage.prototype.setItem;

      try {
        syncInProgress = true;

        originalSetItem.call(
          storage,
          key,
          remoteValue
        );
      } finally {
        syncInProgress = false;
      }
    }
  } catch (error) {
    console.warn(
      'Shared storage hydration failed for key:',
      key,
      error
    );
  }
}

/**
 * Install the shared-storage synchronization once.
 *
 * The important change is that we keep references to the original
 * Storage methods and never accidentally call the patched versions
 * from our synchronization code.
 */
export function initializeSharedStorage(): void {
  if (
    !isBrowser() ||
    initialized
  ) {
    return;
  }

  initialized = true;

  const storage = getStorage();

  if (!storage) {
    return;
  }

  const storageProto =
    Object.getPrototypeOf(storage) as Storage & {
      __fcoSharedStoragePatched?: boolean;
      __fcoOriginalSetItem?: Storage['setItem'];
      __fcoOriginalGetItem?: Storage['getItem'];
      __fcoOriginalRemoveItem?: Storage['removeItem'];
      __fcoOriginalClear?: Storage['clear'];
    };

  if (
    storageProto.__fcoSharedStoragePatched
  ) {
    return;
  }

  const originalSetItem =
    storageProto.setItem.bind(storage);

  const originalGetItem =
    storageProto.getItem.bind(storage);

  const originalRemoveItem =
    storageProto.removeItem.bind(storage);

  const originalClear =
    storageProto.clear.bind(storage);

  // Save original methods on the prototype so hydration can
  // bypass our synchronization hooks.
  storageProto.__fcoOriginalSetItem =
    storageProto.setItem;

  storageProto.__fcoOriginalGetItem =
    storageProto.getItem;

  storageProto.__fcoOriginalRemoveItem =
    storageProto.removeItem;

  storageProto.__fcoOriginalClear =
    storageProto.clear;

  storageProto.setItem =
    function (
      this: Storage,
      key: string,
      value: string
    ): void {
      // Always perform the actual localStorage operation first.
      originalSetItem(
        key,
        value
      );

      // Do not synchronize values that are being
      // written internally during hydration.
      if (
        key &&
        !syncInProgress &&
        !key.startsWith('fco-document:')
      ) {
        void persistRemoteValue(
          key,
          value
        );
      }
    };

  storageProto.getItem =
    function (
      this: Storage,
      key: string
    ): string | null {
      const localValue =
        originalGetItem(key);

      // Only hydrate when a key is missing or empty. This keeps the app fast and
      // avoids firing a cloud refresh on every local read.
      if (
        key &&
        !syncInProgress &&
        (localValue === null || localValue === '')
      ) {
        void hydrateSingleValue(key);
      }

      if (localValue !== null) {
        return localValue;
      }

      return null;
    };

  storageProto.removeItem =
    function (
      this: Storage,
      key: string
    ): void {
      originalRemoveItem(key);

      if (
        key &&
        !syncInProgress &&
        !key.startsWith('fco-document:')
      ) {
        void removeRemoteValue(
          key
        );
      }
    };

  storageProto.clear =
    function (
      this: Storage
    ): void {
      const keys: string[] = [];

      for (
        let index = 0;
        index < this.length;
        index += 1
      ) {
        const key =
          this.key(index);

        if (key) {
          keys.push(key);
        }
      }

      originalClear();

      if (!syncInProgress) {
        for (const key of keys) {
          void removeRemoteValue(
            key
          );
        }
      }
    };

  storageProto.__fcoSharedStoragePatched =
    true;

  // Initial synchronization.
  void requestHydration();

  // Periodically check for remote changes so cloud data stays in sync across
  // laptop/mobile clients without waiting for an explicit page reload.
  window.setInterval(() => {
    void ensureSharedStorageHydrated();
  }, HYDRATION_INTERVAL_MS);

  window.addEventListener(
    'focus',
    () => {
      void ensureSharedStorageHydrated();
    }
  );

  window.addEventListener(
    'online',
    () => {
      setSyncStatusFromState();
      lastHydrationCompletedAt = 0;
      void ensureSharedStorageHydrated();
    }
  );

  window.addEventListener(
    'offline',
    () => {
      emitSyncStatus('offline');
    }
  );

  window.addEventListener(
    'storage',
    () => {
      void ensureSharedStorageHydrated();
    }
  );

  setSyncStatusFromState();
}

/**
 * Make sure the browser has received the current
 * remote shared-storage values.
 */
export function ensureSharedStorageHydrated(): Promise<void> {
  if (!isBrowser()) {
    return Promise.resolve();
  }

  return requestHydration();
}
