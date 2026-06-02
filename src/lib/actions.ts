const API_BASE = '/api/documents';

export async function saveDocument(key: string, data: Record<string, unknown>, _useFirestore = false) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: data }),
    });
    const result = await res.json();
    return { success: result.success };
  } catch {
    try { localStorage.setItem(key, JSON.stringify(data)); return { success: true }; }
    catch { return { success: false, error: 'Save failed' }; }
  }
}

export async function getDocument(key: string, _useFirestore = false) {
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`);
    if (res.status === 404) return { success: false, error: 'Not found' };
    const result = await res.json();
    return { success: result.success, data: result.data };
  } catch {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { success: false, error: 'Not found' };
      return { success: true, data: JSON.parse(raw) };
    } catch { return { success: false, error: 'Fetch failed' }; }
  }
}

export async function getDocuments(prefix: string, _useFirestore = false) {
  try {
    const res = await fetch(`${API_BASE}?prefix=${encodeURIComponent(prefix)}`);
    const result = await res.json();
    return { success: result.success, data: result.data };
  } catch {
    try {
      const items: Record<string, unknown>[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          const raw = localStorage.getItem(k);
          if (raw) items.push(JSON.parse(raw));
        }
      }
      return { success: true, data: items };
    } catch { return { success: false, error: 'Fetch failed' }; }
  }
}

export async function deleteDocument(key: string, _useFirestore = false) {
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
    const result = await res.json();
    localStorage.removeItem(key);
    return { success: result.success };
  } catch {
    try { localStorage.removeItem(key); return { success: true }; }
    catch { return { success: false, error: 'Delete failed' }; }
  }
}

