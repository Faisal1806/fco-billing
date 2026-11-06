type SharedStorageEnvelope = Record<string, unknown> & {
  __fcoSharedStorage: true;
  type: 'string';
};

function isSharedStorageEnvelope(
  value: unknown
): value is SharedStorageEnvelope {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__fcoSharedStorage === true &&
    (value as Record<string, unknown>).type === 'string' &&
    'value' in value
  );
}

export function unwrapSharedStorageValue(value: unknown): unknown {
  let unwrapped = value;

  while (isSharedStorageEnvelope(unwrapped)) {
    const storedValue = unwrapped.value;

    if (typeof storedValue !== 'string') {
      unwrapped = storedValue;
      continue;
    }

    try {
      unwrapped = JSON.parse(storedValue) as unknown;
    } catch {
      throw new Error(
        'A cloud document contains invalid shared-storage data.'
      );
    }
  }

  return unwrapped;
}

function createUtcDate(
  year: number,
  month: number,
  day: number
): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseDocumentDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : new Date(value.getTime());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const milliseconds =
      Math.abs(value) < 100_000_000_000
        ? value * 1000
        : value;
    const date = new Date(milliseconds);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const normalized = value.trim();

  if (/^\d{8}$/.test(normalized)) {
    return createUtcDate(
      Number(normalized.slice(0, 4)),
      Number(normalized.slice(4, 6)),
      Number(normalized.slice(6, 8))
    );
  }

  const yearFirst = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|[T\s].*)/
  );

  if (yearFirst) {
    return createUtcDate(
      Number(yearFirst[1]),
      Number(yearFirst[2]),
      Number(yearFirst[3])
    );
  }

  const dayOrMonthFirst = normalized.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
  );

  if (dayOrMonthFirst) {
    const first = Number(dayOrMonthFirst[1]);
    const second = Number(dayOrMonthFirst[2]);
    const year = Number(dayOrMonthFirst[3]);
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;

    return createUtcDate(year, month, day);
  }

  if (/^\d{10,13}$/.test(normalized)) {
    const numericValue = Number(normalized);
    const milliseconds =
      normalized.length === 10
        ? numericValue * 1000
        : numericValue;
    const date = new Date(milliseconds);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDocumentDateYear(value: unknown): number | null {
  return parseDocumentDate(value)?.getUTCFullYear() ?? null;
}

export const BUSINESS_YEAR = 2026;

export function isDocumentInBusinessYear(
  record: unknown,
  dateField = 'date',
  year = BUSINESS_YEAR
): boolean {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return false;
  }

  return (
    getDocumentDateYear(
      (record as Record<string, unknown>)[dateField]
    ) === year
  );
}

export function formatDocumentDate(value: unknown): string {
  const date = parseDocumentDate(value);

  return date
    ? date.toLocaleDateString(undefined, { timeZone: 'UTC' })
    : 'Date unavailable';
}
