const STORAGE_PREFIX = 'fco-document:';

type DocumentValue = Record<string, any>;

type ApiResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Get the ORIGINAL browser localStorage methods.
 *
 * shared-storage.ts may patch localStorage methods.
 * We intentionally bypass that patch here.
 */
function getNativeStorageMethods() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storage = window.localStorage;

  return {
    storage,
    setItem: Storage.prototype.setItem.bind(storage),
    getItem: Storage.prototype.getItem.bind(storage),
    removeItem: Storage.prototype.removeItem.bind(storage),
    key: Storage.prototype.key.bind(storage),
    get length(): number {
      return storage.length;
    },
  };
}

/**
 * SAVE ONE DOCUMENT
 *
 * Supports:
 *
 * saveDocument(key, data)
 *
 * and legacy:
 *
 * saveDocument(collection, id, data)
 */
export async function saveDocument(
  key: string,
  dataOrId: DocumentValue | string,
  legacyData?: DocumentValue
): Promise<ApiResult> {
  try {
    let documentKey: string;
    let documentData: DocumentValue;

    if (legacyData !== undefined) {
      documentKey = `${key}/${String(dataOrId)}`;
      documentData = legacyData;
    } else {
      documentKey = key;
      documentData = dataOrId as DocumentValue;
    }

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: documentKey,
        value: documentData,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.error ||
          `MongoDB save failed (${response.status})`
      );
    }

    // Keep localStorage as a secondary browser cache.
    if (typeof window !== 'undefined') {
      const native = getNativeStorageMethods();

      if (native) {
        native.setItem(
          storageKey(documentKey),
          JSON.stringify(documentData)
        );

        window.dispatchEvent(
          new CustomEvent('mongodb-synced', {
            detail: {
              key: documentKey,
              data: documentData,
            },
          })
        );
      }
    }

    return {
      success: true,
      data: result?.data ?? documentData,
    };
  } catch (error) {
    console.error(
      `Failed to save document to MongoDB: ${key}`,
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to save document to MongoDB',
    };
  }
}

/**
 * GET ONE DOCUMENT
 *
 * Supports:
 *
 * getDocument(key)
 *
 * and:
 *
 * getDocument(collection, id)
 */
export async function getDocument(
  key: string,
  id?: string
): Promise<ApiResult> {
  const documentKey =
    id !== undefined
      ? `${key}/${String(id)}`
      : key;

  try {
    const response = await fetch(
      `/api/documents?key=${encodeURIComponent(documentKey)}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    const result = await response.json();

    if (response.ok && result?.success) {
      if (typeof window !== 'undefined') {
        const native = getNativeStorageMethods();

        if (native) {
          native.setItem(
            storageKey(documentKey),
            JSON.stringify(result.data)
          );
        }
      }

      return {
        success: true,
        data: result.data,
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    throw new Error(
      result?.error ||
        `MongoDB request failed (${response.status})`
    );
  } catch (error) {
    try {
      if (typeof window === 'undefined') {
        throw error;
      }

      const native = getNativeStorageMethods();

      if (!native) {
        throw error;
      }

      const raw = native.getItem(
        storageKey(documentKey)
      );

      if (!raw) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Document not found',
        };
      }

      return {
        success: true,
        data: JSON.parse(raw),
      };
    } catch {
      return {
        success: false,
        error: 'Failed to load document',
      };
    }
  }
}

/**
 * GET ALL DOCUMENTS
 *
 * The second parameter is retained for compatibility
 * with older modules.
 *
 * IMPORTANT:
 * The returned data array contains the actual stored
 * document values, not { key, value } wrappers.
 */
export async function getDocuments(
  prefix?: string,
  _legacyMode?: boolean
): Promise<ApiResult<any[]>> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Browser storage is unavailable.');
    }

    const query = prefix
      ? `?prefix=${encodeURIComponent(prefix)}`
      : '';

    const response = await fetch(
      `/api/documents${query}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    const result = await response.json();

    if (
      !response.ok ||
      !result?.success ||
      !Array.isArray(result.data)
    ) {
      throw new Error(
        result?.error ||
          `MongoDB request failed (${response.status})`
      );
    }

    const native = getNativeStorageMethods();

    const documents = result.data
      .filter(
        (item: any) =>
          item &&
          typeof item === 'object'
      )
      .map((item: any) => {
        const key =
          typeof item.key === 'string'
            ? item.key
            : typeof item.id === 'string'
              ? item.id
              : '';

        const value =
          item.value &&
          typeof item.value === 'object'
            ? item.value
            : (() => {
                const copy = { ...item };
                delete copy.key;
                delete copy.id;
                delete copy.value;
                return copy;
              })();

        if (native && key) {
          try {
            native.setItem(
              storageKey(key),
              JSON.stringify(value)
            );
          } catch (error) {
            console.warn(
              'Could not cache MongoDB document:',
              key,
              error
            );
          }
        }

        return {
          ...value,
          id: key,
          key,
          value,
        };
      });

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    try {
      if (typeof window === 'undefined') {
        return {
          success: false,
          data: [],
          error: 'Browser storage is unavailable.',
        };
      }

      const native = getNativeStorageMethods();

      if (!native) {
        return {
          success: false,
          data: [],
          error: 'Browser storage is unavailable.',
        };
      }

      const documents: any[] = [];

      for (
        let index = 0;
        index < native.length;
        index++
      ) {
        const fullKey = native.key(index);

        if (
          !fullKey ||
          !fullKey.startsWith(STORAGE_PREFIX)
        ) {
          continue;
        }

        const documentKey =
          fullKey.substring(
            STORAGE_PREFIX.length
          );

        if (
          prefix &&
          !documentKey.startsWith(prefix)
        ) {
          continue;
        }

        try {
          const raw =
            native.getItem(fullKey);

          if (!raw) {
            continue;
          }

          const value =
            JSON.parse(raw);

          documents.push({
            ...(
              value &&
              typeof value === 'object'
                ? value
                : {}
            ),
            id: documentKey,
            key: documentKey,
            value,
          });
        } catch (cacheError) {
          console.warn(
            `Skipping invalid cached document: ${documentKey}`,
            cacheError
          );
        }
      }

      return {
        success: true,
        data: documents,
      };
    } catch (fallbackError) {
      console.error(
        'Failed to load documents from MongoDB and local cache:',
        fallbackError
      );

      return {
        success: false,
        data: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load documents',
      };
    }
  }
}

/**
 * DELETE ONE DOCUMENT
 *
 * Supports:
 *
 * deleteDocument(key)
 *
 * and legacy:
 *
 * deleteDocument(collection, id)
 */
export async function deleteDocument(
  key: string,
  id?: string
): Promise<ApiResult> {
  try {
    const documentKey =
      id !== undefined
        ? `${key}/${String(id)}`
        : key;

    const response = await fetch(
      `/api/documents?key=${encodeURIComponent(documentKey)}`,
      {
        method: 'DELETE',
        cache: 'no-store',
      }
    );

    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.error ||
          `MongoDB delete failed (${response.status})`
      );
    }

    if (typeof window !== 'undefined') {
      const native = getNativeStorageMethods();

      if (native) {
        native.removeItem(
          storageKey(documentKey)
        );

        window.dispatchEvent(
          new CustomEvent('mongodb-deleted', {
            detail: {
              key: documentKey,
            },
          })
        );
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(
      `Failed to delete document from MongoDB: ${key}`,
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete document from MongoDB',
    };
  }
}

/**
 * Compatibility function.
 */
export async function sendPushNotification(
  payload: Record<string, any>
): Promise<ApiResult> {
  console.warn(
    'sendPushNotification is not implemented.',
    payload
  );

  return {
    success: false,
    error:
      'sendPushNotification is not implemented',
  };
}



