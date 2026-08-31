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

// Prevent our own remote synchronization from triggering another
// localStorage synchronization cycle.
let syncInProgress = false;

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
  if (!key || syncInProgress) {
    return;
  }

  try {
    syncInProgress = true;

    await saveDocument(
      key,
      createEnvelope(value)
    );
  } catch (error) {
    console.warn(
      'Shared storage sync save failed:',
      error
    );
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
  if (!key || syncInProgress) {
    return;
  }

  try {
    syncInProgress = true;

    await deleteDocument(key);
  } catch (error) {
    console.warn(
      'Shared storage sync delete failed:',
      error
    );
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

  try {
    const result = await getDocuments();

    if (
      !result.success ||
      !Array.isArray(result.data)
    ) {
      return;
    }

    const storageProto =
      Object.getPrototypeOf(storage) as Storage & {
        __fcoOriginalSetItem?: Storage['setItem'];
      };

    const originalSetItem =
      storageProto.__fcoOriginalSetItem ||
      Storage.prototype.setItem;

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

      const remoteValue = unwrapValue(record.value);

      if (
        remoteValue !== null &&
        storage.getItem(key) !== remoteValue
      ) {
        try {
          syncInProgress = true;

          originalSetItem.call(
            storage,
            key,
            remoteValue
          );
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
    }
  } catch (error) {
    console.warn(
      'Shared storage hydration failed:',
      error
    );
  }
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
      unwrapValue(result.data);

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
        !syncInProgress
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

      // If it exists locally, return immediately.
      if (
        localValue !== null
      ) {
        return localValue;
      }

      // Otherwise try to hydrate it from the server.
      if (
        key &&
        !syncInProgress
      ) {
        void hydrateSingleValue(key);
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
        !syncInProgress
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
  hydrationPromise =
    hydrateFromServer();

  // Periodically check for remote changes.
  window.setInterval(() => { void ensureSharedStorageHydrated(); }, 2000);

  window.addEventListener(
    'focus',
    () => {
      void ensureSharedStorageHydrated();
    }
  );
}

/**
 * Make sure the browser has received the current
 * remote shared-storage values.
 */
export function ensureSharedStorageHydrated(): Promise<void> {
  if (!isBrowser()) {
    return Promise.resolve();
  }

  hydrationPromise = hydrateFromServer();

  return hydrationPromise;
}
