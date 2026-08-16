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
 * shared-storage.ts may patch localStorage.setItem().
 * We intentionally bypass that patch here.
 */
function getNativeStorageMethods() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storage = window.localStorage;

  const proto = Object.getPrototypeOf(storage);

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
 * Browser-local persistence only.
 */
export async function saveDocument(
  key: string,
  data: DocumentValue
): Promise<ApiResult> {
  try {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'Browser storage is unavailable.',
      };
    }

    const native = getNativeStorageMethods();

    if (!native) {
      return {
        success: false,
        error: 'Browser storage is unavailable.',
      };
    }

    native.setItem(
      storageKey(key),
      JSON.stringify(data)
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      `Failed to save document: ${key}`,
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to save document',
    };
  }
}

/**
 * GET ONE DOCUMENT
 */
export async function getDocument(
  key: string
): Promise<ApiResult> {
  try {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'Browser storage is unavailable.',
      };
    }

    const native = getNativeStorageMethods();

    if (!native) {
      return {
        success: false,
        error: 'Browser storage is unavailable.',
      };
    }

    const raw = native.getItem(
      storageKey(key)
    );

    if (!raw) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    return {
      success: true,
      data: JSON.parse(raw),
    };
  } catch (error) {
    console.error(
      `Failed to get document: ${key}`,
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to load document',
    };
  }
}

/**
 * GET ALL DOCUMENTS
 */
export async function getDocuments(
  prefix?: string
): Promise<ApiResult<any[]>> {
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

    const documents: Array<{
      key: string;
      value: any;
    }> = [];

    for (
      let index = 0;
      index < native.length;
      index++
    ) {
      const fullKey = native.key(index);

      if (!fullKey) {
        continue;
      }

      if (
        !fullKey.startsWith(
          STORAGE_PREFIX
        )
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
          key: documentKey,
          value,
        });
      } catch (error) {
        console.warn(
          `Skipping invalid document: ${documentKey}`,
          error
        );
      }
    }

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    console.error(
      `Failed to get documents with prefix: ${
        prefix || 'all'
      }`,
      error
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

/**
 * DELETE ONE DOCUMENT
 */
export async function deleteDocument(
  key: string
): Promise<ApiResult> {
  try {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'Browser storage is unavailable.',
      };
    }

    const native = getNativeStorageMethods();

    if (!native) {
      return {
        success: false,
        error: 'Browser storage is unavailable.',
      };
    }

    native.removeItem(
      storageKey(key)
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      `Failed to delete document: ${key}`,
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete document',
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
    'sendPushNotification is not implemented.'
  );

  return {
    success: false,
    error:
      'sendPushNotification is not implemented',
  };
}