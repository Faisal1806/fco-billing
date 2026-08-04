import {
  getDocument,
  saveDocument,
} from '@/lib/actions';

export type ActivityLog = {
  id: string;
  timestamp: string;
  type: 'Portal Login' | 'View Ledger' | 'Download Report';
  details: string;
};

const LOG_KEY = 'activityLogs';

export async function addLog(
  type: ActivityLog['type'],
  details: string
): Promise<void> {
  try {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      type,
      details,
    };

    const existing = await getDocument(LOG_KEY);

    const logs: ActivityLog[] =
      existing.success && Array.isArray(existing.data)
        ? existing.data
        : [];

    logs.unshift(newLog);

    if (logs.length > 500) {
      logs.length = 500;
    }

    await saveDocument(LOG_KEY, logs as any);
  } catch (err) {
    console.error('Failed to write activity log', err);
  }
}

export async function fetchLogs(): Promise<ActivityLog[]> {
  try {
    const result = await getDocument(LOG_KEY);

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (err) {
    console.error('Failed to fetch activity logs', err);
    return [];
  }
}

export async function clearLogs(): Promise<void> {
  await saveDocument(LOG_KEY, [] as any);
}
