const API_BASE = '/api/documents';

type DocumentValue = Record<string, any>;

type ApiResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function parseResponse<T = any>(
  response: Response
): Promise<ApiResult<T>> {
  const text = await response.text();

  if (!text) {
    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error: text || `HTTP ${response.status}`,
    };
  }
}


/**
 * SAVE ONE DOCUMENT
 *
 * Example:
 *
 * saveDocument(
 *   'purchase-123',
 *   {
 *     billNo: '123',
 *     date: '2026-07-27'
 *   }
 * )
 */
export async function saveDocument(
  key: string,
  data: DocumentValue
): Promise<ApiResult> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        value: data,
      }),
    });

    const result = await parseResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to save document');
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error(`Failed to save document: ${key}`, error);

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
    const response = await fetch(
      `${API_BASE}?key=${encodeURIComponent(key)}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    const result = await parseResponse(response);

    if (response.status === 404) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to load document');
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error(`Failed to get document: ${key}`, error);

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
 *
 * Example:
 *
 * getDocuments('purchase-')
 *
 * returns all:
 *
 * purchase-1
 * purchase-2
 * purchase-3
 */
export async function getDocuments(
  prefix?: string
): Promise<ApiResult<any[]>> {
  try {
    const url = prefix
      ? `${API_BASE}?prefix=${encodeURIComponent(prefix)}`
      : API_BASE;

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    const result = await parseResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to load documents');
    }

    return {
      success: true,
      data: Array.isArray(result.data)
        ? result.data
        : [],
    };
  } catch (error) {
    console.error(
      `Failed to get documents with prefix: ${prefix || 'all'}`,
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
    const response = await fetch(
      `${API_BASE}?key=${encodeURIComponent(key)}`,
      {
        method: 'DELETE',
      }
    );

    const result = await parseResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete document');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Failed to delete document: ${key}`, error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete document',
    };
  }
}

export async function sendPushNotification(
  payload: Record<string, any>
): Promise<ApiResult> {
  console.warn('sendPushNotification is not implemented in this app route.');
  return {
    success: false,
    error: 'sendPushNotification is not implemented',
  };
}
