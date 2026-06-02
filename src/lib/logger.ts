
export type ActivityLog = {
    id: string;
    timestamp: string;
    type: 'Portal Login' | 'View Ledger' | 'Download Report';
    details: string;
};

const LOG_KEY = 'activityLogs';

/**
 * Adds a new log entry to localStorage.
 * @param type The type of event being logged.
 * @param details A string describing the event.
 */
export function addLog(type: ActivityLog['type'], details: string): void {
    if (typeof window === 'undefined') return;

    try {
        const newLog: ActivityLog = {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            type,
            details,
        };

        const existingLogsRaw = localStorage.getItem(LOG_KEY);
        const existingLogs: ActivityLog[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];

        // Add the new log and keep the list sorted with the newest first
        const updatedLogs = [newLog, ...existingLogs];

        // Optional: Limit the number of logs to prevent localStorage from getting too large
        if (updatedLogs.length > 500) {
            updatedLogs.pop();
        }

        localStorage.setItem(LOG_KEY, JSON.stringify(updatedLogs));

    } catch (error) {
        console.error("Failed to write to activity log:", error);
    }
}

/**
 * Fetches all activity logs from localStorage.
 * @returns An array of ActivityLog objects, sorted from newest to oldest.
 */
export function fetchLogs(): ActivityLog[] {
    if (typeof window === 'undefined') return [];
    
    try {
        const logsRaw = localStorage.getItem(LOG_KEY);
        return logsRaw ? JSON.parse(logsRaw) : [];
    } catch (error) {
        console.error("Failed to fetch activity logs:", error);
        return [];
    }
}


