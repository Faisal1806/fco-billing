import { getDocumentDateYear, unwrapSharedStorageValue } from '@/lib/document-utils';

const API_BASE = '/api/documents';
const STORAGE_PREFIX = 'fco-document:';

type DocumentData = Record<string, any>;

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  deleted?: boolean;
  cloudSynced?: boolean;
  cloudError?: string;
};

function normalizeStorageKey(documentKey: string): string {
  const trimmed = documentKey.trim();

  if (!trimmed) {
    return STORAGE_PREFIX;
  }

  let withoutPrefix = trimmed;
  while (withoutPrefix.startsWith(STORAGE_PREFIX)) {
    withoutPrefix = withoutPrefix.slice(STORAGE_PREFIX.length);
  }

  return `${STORAGE_PREFIX}${withoutPrefix}`;
}

function getNativeStorageMethods() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storage = window.localStorage;
  const storageProto = Object.getPrototypeOf(storage) as Storage & {
    __fcoOriginalSetItem?: Storage['setItem'];
    __fcoOriginalGetItem?: Storage['getItem'];
    __fcoOriginalRemoveItem?: Storage['removeItem'];
  };

  return {
    storage,
    setItem: (storageProto.__fcoOriginalSetItem || Storage.prototype.setItem).bind(storage),
    getItem: (storageProto.__fcoOriginalGetItem || Storage.prototype.getItem).bind(storage),
    removeItem: (storageProto.__fcoOriginalRemoveItem || Storage.prototype.removeItem).bind(storage),
    key: Storage.prototype.key.bind(storage),
    get length(): number {
      return storage.length;
    },
  };
}

async function parseResponse(
  res: Response,
  fallbackError: string
): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {
      success: false,
      error: `${fallbackError} (${res.status})`,
    };
  }
}

/**
 * Save/update one document.
 *
 * Supports both:
 * saveDocument(key, data)
 * saveDocument(collection, id, data)
 */
export async function saveDocument(
  key: string,
  dataOrId: DocumentData | string,
  legacyData?: DocumentData,
  _useFirestore = false
): Promise<ActionResult> {
  let cloudSaved = false;

  try {
    const documentKey =
      legacyData !== undefined
        ? `${key}/${String(dataOrId)}`
        : key;

    const documentData =
      legacyData !== undefined
        ? legacyData
        : (dataOrId as DocumentData);

    if (!documentKey.trim()) {
      return {
        success: false,
        error: 'Document key is required',
      };
    }

    const canonicalDocumentKey = normalizeStorageKey(documentKey);

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: documentKey,
        value: documentData,
      }),
      cache: 'no-store',
    });

    const result = await parseResponse(
      res,
      'Save failed'
    );

    if (!res.ok || !result.success) {
      return {
        success: false,
        data: documentData,
        cloudSynced: false,
        error: result.error || `Save failed (${res.status})`,
        cloudError: result.error || `Save failed (${res.status})`,
      };
    }

    cloudSaved = true;

    if (typeof window !== 'undefined') {
      const native = getNativeStorageMethods();
      if (native) {
        try {
          native.setItem(
            canonicalDocumentKey,
            JSON.stringify(result.data ?? documentData)
          );
        } catch (cacheError) {
          console.warn("[F.CO] Cache write skipped; MongoDB save succeeded:", cacheError);
        }
      }
    }

    return {
      success: true,
      data: result.data ?? documentData,
      cloudSynced: true,
    };
  } catch (error) {
    return {
      success: false,
      cloudSynced: cloudSaved,
      error: cloudSaved
        ? undefined
        : error instanceof Error
          ? error.message
          : 'Cloud sync is unavailable',
      data:
        legacyData !== undefined
          ? legacyData
          : (dataOrId as DocumentData),
      cloudError: cloudSaved
        ? undefined
        : error instanceof Error
          ? error.message
          : 'Cloud sync is unavailable',
    };
  }
}

/**
 * Get one document.
 *
 * Supports both:
 * getDocument(key)
 * getDocument(collection, id)
 */
export async function getDocument(
  key: string,
  id?: string,
  _useFirestore = false
): Promise<ActionResult> {
  try {
    const documentKey =
      id !== undefined
        ? `${key}/${String(id)}`
        : key;

    if (!documentKey.trim()) {
      return {
        success: false,
        error: 'Document key is required',
      };
    }

    const res = await fetch(
      `${API_BASE}?key=${encodeURIComponent(documentKey)}`,
      {
        cache: 'no-store',
      }
    );

    if (res.status === 404) {
      return {
        success: false,
        error: 'Not found',
      };
    }

    const result = await parseResponse(
      res,
      'Fetch failed'
    );

    if (!res.ok || !result.success) {
      return {
        success: false,
        error:
          result.error ||
          `Fetch failed (${res.status})`,
      };
    }

    if (typeof window !== 'undefined') {
      const native = getNativeStorageMethods();
      if (native) {
        try {
          native.setItem(
            normalizeStorageKey(documentKey),
            JSON.stringify(result.data)
          );
        } catch (cacheError) {
          console.warn("[F.CO] Cache write skipped; MongoDB read succeeded:", cacheError);
        }
      }
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Fetch failed',
    };
  }
}

/**
 * Get documents by prefix.
 */
export async function getDocuments(
  prefix?: string | string[],
  _legacyMode?: boolean,
  _useFirestore = false
): Promise<ActionResult<unknown[]>> {
  try {
    const prefixes = (Array.isArray(prefix) ? prefix : prefix ? [prefix] : [])
      .map(item => String(item).trim())
      .filter(Boolean);

    const params = new URLSearchParams();
    prefixes.forEach(item => params.append('prefix', item));

    const url = prefixes.length
      ? `${API_BASE}?${params.toString()}`
      : API_BASE;

    const res = await fetch(url, {
      cache: 'no-store',
    });

    const result = await parseResponse(
      res,
      'Fetch failed'
    );

    if (!res.ok || !result.success) {
      throw new Error(
        result.error ||
          `Fetch failed (${res.status})`
      );
    }

    if (!Array.isArray(result.data)) {
      throw new Error('Invalid document list response from MongoDB');
    }

    // Do not mirror every cloud document into a second localStorage namespace.
    // Business lists merge cloud records with the original local keys below;
    // duplicating the complete cloud dataset here caused quota exhaustion.
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : 'Fetch failed',
    };
  }
}

/**
 * Load business documents from MongoDB and the original browser records.
 *
 * Local records are read first so a newer local 2026 business record is not
 * hidden by an older cloud value stored under the same key. Cloud records
 * remain preferred when they are also 2026, unless the local record carries
 * a later explicit updatedAt timestamp. No data is written or deleted here.
 */
export async function getBusinessDocuments(
  prefixes?: string | string[]
): Promise<ActionResult<Array<Record<string, any>>>> {
  const acceptedPrefixes = prefixes
    ? Array.isArray(prefixes)
      ? prefixes
      : [prefixes]
    : null;
  const documentsByKey = new Map<string, Record<string, any>>();

  const matchesPrefix = (key: string) =>
    !acceptedPrefixes ||
    acceptedPrefixes.some(prefix => key.startsWith(prefix));

  const normalize = (
    raw: unknown,
    keyHint?: string
  ): Record<string, any> | null => {
    let value = raw;

    for (let depth = 0; depth < 8; depth += 1) {
      try {
        value = unwrapSharedStorageValue(value);
      } catch {
        return null;
      }

      if (typeof value === 'string') {
        try {
          value = JSON.parse(value) as unknown;
          continue;
        } catch {
          return null;
        }
      }
      break;
    }

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'key' in value &&
      'value' in value
    ) {
      value = (value as Record<string, unknown>).value;
      try {
        value = unwrapSharedStorageValue(value);
      } catch {
        return null;
      }
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value) as unknown;
        } catch {
          return null;
        }
      }
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, any>;
    const key = String(keyHint || record.key || record.id || '').trim();

    if (!key || !matchesPrefix(key)) {
      return null;
    }

    return {
      ...record,
      id: record.id ?? key,
      key,
    };
  };

  const businessYear = (record: Record<string, any>): number | null => {
    const businessDate =
      record.date ??
      record.receiptDate ??
      record.invoiceDate ??
      record.challanDate ??
      record.purchaseDate ??
      record.statementDate ??
      record.dateIn ??
      record.transactionDate ??
      record.expenseDate ??
      record.paymentDate ??
      record.saleDate;
    return getDocumentDateYear(businessDate);
  };

  const timestamp = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const mergeRecord = (
    candidate: Record<string, any>,
    source: 'local' | 'cloud'
  ) => {
    const key = String(candidate.key || '').trim();
    if (!key) return;

    const existing = documentsByKey.get(key);
    if (!existing) {
      documentsByKey.set(key, candidate);
      return;
    }

    const existingYear = businessYear(existing);
    const candidateYear = businessYear(candidate);

    // Preserve the user's local 2026 copy when MongoDB has an older-year
    // record with the same document key (the exact conflict found in audit).
    if (existingYear === 2026 && candidateYear !== 2026) return;
    if (candidateYear === 2026 && existingYear !== 2026) {
      documentsByKey.set(key, candidate);
      return;
    }

    // For same-year conflicts, use an explicit newer business-record update
    // timestamp when present. Otherwise cloud remains the canonical copy.
    const existingUpdated = timestamp(existing.updatedAt);
    const candidateUpdated = timestamp(candidate.updatedAt);
    if (candidateUpdated > existingUpdated || (source === 'cloud' && candidateUpdated === existingUpdated)) {
      documentsByKey.set(key, candidate);
    }
  };

  let localCount = 0;
  if (typeof window !== 'undefined') {
    const native = getNativeStorageMethods();
    if (native) {
      for (let index = 0; index < native.length; index += 1) {
        const storageKey = native.key(index);
        if (!storageKey || storageKey.startsWith(STORAGE_PREFIX)) continue;
        if (!matchesPrefix(storageKey)) continue;

        try {
          const stored = native.getItem(storageKey);
          if (!stored) continue;
          const record = normalize(stored, storageKey);
          if (record) {
            mergeRecord(record, 'local');
            localCount += 1;
          }
        } catch (error) {
          console.warn('Could not normalize local business document:', storageKey, error);
        }
      }
    }
  }

  const cloudResult = await getDocuments(
    acceptedPrefixes || undefined
  );

  if (cloudResult.success && Array.isArray(cloudResult.data)) {
    for (const item of cloudResult.data) {
      if (!item || typeof item !== 'object') continue;
      const document = item as Record<string, unknown>;
      const key = String(document.key ?? document.id ?? '').trim();
      if (!key) continue;

      // The documents API exposes the stored value on `value`; normalize that
      // payload directly rather than treating the API wrapper as the record.
      const rawValue = 'value' in document ? document.value : document;
      const record = normalize(rawValue, key);
      if (record) mergeRecord(record, 'cloud');
    }
  } else if (localCount === 0) {
    return {
      success: false,
      data: [],
      error: cloudResult.error || 'Could not load business documents.',
    };
  } else {
    console.warn(
      'Cloud business-document load failed; showing preserved local records only.'
    );
  }

  return {
    success: true,
    data: Array.from(documentsByKey.values()),
    ...(cloudResult.success ? {} : { cloudError: cloudResult.error }),
  };
}

/**
 * Delete one document.
 *
 * Supports both:
 * deleteDocument(key)
 * deleteDocument(collection, id)
 */
export async function deleteDocument(
  key: string,
  id?: string,
  _useFirestore = false
): Promise<ActionResult> {
  try {
    const documentKey =
      id !== undefined
        ? `${key}/${String(id)}`
        : key;

    if (!documentKey.trim()) {
      return {
        success: false,
        error: 'Document key is required',
      };
    }

    const res = await fetch(
      `${API_BASE}?key=${encodeURIComponent(documentKey)}`,
      {
        method: 'DELETE',
        cache: 'no-store',
      }
    );

    const result = await parseResponse(
      res,
      'Delete failed'
    );

    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || `Delete failed (${res.status})`,
        deleted: false,
      };
    }

    if (typeof window !== 'undefined') {
      const native = getNativeStorageMethods();
      if (native) {
        const localKeys = new Set([
          documentKey,
          normalizeStorageKey(documentKey),
        ]);
        for (const currentKey of localKeys) {
          native.removeItem(currentKey);
        }
      }
    }

    return {
      success: true,
      data: result.deleted,
      deleted: !!result.deleted,
    };
  } catch (error) {
    return {
      success: false,
      deleted: false,
      error:
        error instanceof Error
          ? error.message
          : 'Delete failed',
    };
  }
}

export async function sendPushNotification(
  _payload: Record<string, unknown>
): Promise<ActionResult> {
  return {
    success: false,
    error: 'Push notifications are not configured',
  };
}
