import { deleteDocument, saveDocument } from '@/lib/actions';

export const PARTY_STORAGE_PREFIX = 'party-';

export type PartyLike = Record<string, any> & {
  id?: string;
  name?: string;
};

const PARTY_NAME_FIELDS = [
  'name',
  'customerName',
  'growerName',
  'partyName',
  'market',
  'toMs',
  'fromMs',
  'sellerName',
  'buyerName',
  'party',
  'accountName',
  'customer',
  'grower',
] as const;

export function getCanonicalPartyName(name?: string | null): string {
  return typeof name === 'string' ? name.trim() : '';
}

export function getPartyStorageKey(name?: string | null): string {
  const canonical = getCanonicalPartyName(name);
  return canonical ? `${PARTY_STORAGE_PREFIX}${canonical}` : PARTY_STORAGE_PREFIX;
}

function updateRecentPartyNames(previousName: string, nextName: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const recentKey = 'fco_recent_parties';
  const raw = window.localStorage.getItem(recentKey);

  try {
    const list = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(list)) {
      return;
    }

    const updated = list
      .map((item) => {
        if (typeof item !== 'string') {
          return item;
        }

        return getCanonicalPartyName(item) === previousName ? nextName : item;
      })
      .filter((item) => typeof item === 'string' && item.trim().length > 0);

    const unique = [nextName, ...updated.filter((item) => item !== nextName)];
    window.localStorage.setItem(recentKey, JSON.stringify(unique.slice(0, 5)));
  } catch {
    // Ignore malformed recent-party cache entries.
  }
}

async function persistPartyDocument(documentKey: string, value: Record<string, any>): Promise<void> {
  if (!documentKey || typeof documentKey !== 'string') {
    return;
  }

  try {
    await saveDocument(documentKey, value);
  } catch {
    // Ignore cloud persistence issues in offline mode.
  }
}

function replacePartyNameInValue(value: any, previousName: string, nextName: string): any {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const clone = Array.isArray(value) ? [...value] : { ...value };
  let changed = false;

  PARTY_NAME_FIELDS.forEach((field) => {
    if (!(field in clone)) {
      return;
    }

    const fieldValue = clone[field];
    if (typeof fieldValue === 'string' && getCanonicalPartyName(fieldValue) === previousName) {
      clone[field] = nextName;
      changed = true;
    }
  });

  if (Array.isArray(clone)) {
    clone.forEach((item, index) => {
      const transformed = replacePartyNameInValue(item, previousName, nextName);
      if (transformed !== item) {
        clone[index] = transformed;
        changed = true;
      }
    });
  } else {
    Object.entries(clone).forEach(([key, nestedValue]) => {
      if (key === 'id' || key === 'updatedAt') {
        return;
      }

      const transformed = replacePartyNameInValue(nestedValue, previousName, nextName);
      if (transformed !== nestedValue) {
        clone[key] = transformed;
        changed = true;
      }
    });
  }

  return changed ? clone : value;
}

export function syncPartyNameAcrossStorage(
  previousName: string,
  nextName: string,
  partyRecord?: PartyLike
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const storage = window.localStorage;
  const canonicalPrevious = getCanonicalPartyName(previousName);
  const canonicalNext = getCanonicalPartyName(nextName);

  if (!canonicalPrevious || !canonicalNext || canonicalPrevious === canonicalNext) {
    if (partyRecord && canonicalNext) {
      const partyKey = getPartyStorageKey(canonicalNext);
      const updatedParty = { ...partyRecord, name: canonicalNext, id: partyRecord.id || partyKey };
      storage.setItem(partyKey, JSON.stringify(updatedParty));
      void persistPartyDocument(partyKey, updatedParty);
    }
    return;
  }

  const previousKey = getPartyStorageKey(canonicalPrevious);
  const nextKey = getPartyStorageKey(canonicalNext);

  if (partyRecord) {
    const updatedParty = { ...partyRecord, id: partyRecord.id || nextKey, name: canonicalNext };
    storage.setItem(nextKey, JSON.stringify(updatedParty));
    void persistPartyDocument(nextKey, updatedParty);
  }

  storage.removeItem(previousKey);
  void deleteDocument(previousKey).catch(() => undefined);

  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key || key === previousKey || key === nextKey) {
      continue;
    }

    const rawValue = storage.getItem(key);
    if (!rawValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawValue);
      const migrated = replacePartyNameInValue(parsed, canonicalPrevious, canonicalNext);

      if (migrated !== parsed) {
        storage.setItem(key, JSON.stringify(migrated));
        void persistPartyDocument(key, migrated);
      }
    } catch {
      // Ignore non-JSON localStorage entries.
    }
  }

  updateRecentPartyNames(canonicalPrevious, canonicalNext);
}

export function savePartyRecord(party: PartyLike, previousName?: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  const storage = window.localStorage;
  const nextName = getCanonicalPartyName(party.name);
  const previous = previousName ? getCanonicalPartyName(previousName) : '';

  if (previous && previous !== nextName) {
    syncPartyNameAcrossStorage(previous, nextName, party);
    return;
  }

  if (!nextName) {
    return;
  }

  const partyKey = getPartyStorageKey(nextName);
  const payload = { ...party, id: party.id || partyKey, name: nextName };
  storage.setItem(partyKey, JSON.stringify(payload));
  void persistPartyDocument(partyKey, payload);
}
