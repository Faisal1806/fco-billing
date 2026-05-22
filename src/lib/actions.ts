'use client';

const STORAGE_PREFIX = 'fco:';

type StoredValue = Record<string, any> | null;

function buildStorageKey(collectionName: string, id: string): string {
  return `${STORAGE_PREFIX}${collectionName}:${id}`;
}

function parseStoredValue(value: string | null): StoredValue {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function sendPushNotification(notification: {
  title: string;
  body: string;
  tokens: string[];
  url?: string;
}) {
  console.warn('sendPushNotification is disabled because Firebase has been removed.', notification);
  return { success: true };
}

export async function saveDocument(collectionName: string, id: string, data: any) {
  const key = buildStorageKey(collectionName, id);
  const cleanData = JSON.parse(JSON.stringify(data));
  localStorage.setItem(key, JSON.stringify(cleanData));
  return { success: true, id };
}

export async function deleteDocument(collectionName: string, id: string) {
  const key = buildStorageKey(collectionName, id);
  localStorage.removeItem(key);
  return { success: true };
}

export async function getDocument(collectionName: string, id: string) {
  const key = buildStorageKey(collectionName, id);
  const item = localStorage.getItem(key);
  const data = parseStoredValue(item);

  if (data === null) {
    return { success: false, error: 'Document not found.' };
  }

  return { success: true, data: { id, ...data } };
}

export async function getDocuments(collectionName: string, silent: boolean = false) {
  const prefix = `${STORAGE_PREFIX}${collectionName}:`;
  const data: any[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const item = localStorage.getItem(key);
      const value = parseStoredValue(item);
      if (value !== null) {
        data.push({ id: key.slice(prefix.length), ...value });
      }
    }
  }

  return { success: true, data };
}

