
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ActivityLog, fetchLogs } from '@/lib/logger';
import { Loader2, History, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const loadedLogs = fetchLogs();
        setLogs(loadedLogs);
        setIsLoading(false);
    }, []);

    const handleClearLogs = () => {
        if (window.confirm('Are you sure you want to delete all activity logs? This cannot be undone.')) {
            localStorage.removeItem('activityLogs');
            setLogs([]);
            toast({ title: 'Logs Cleared', description: 'All activity logs have been deleted.' });
        }
    };

    const getBadgeVariant = (type: ActivityLog['type']) => {
        switch (type) {
            case 'Portal Login': return 'default';
            case 'View Ledger': return 'secondary';
            case 'Download Report': return 'outline';
            default: return 'secondary';
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <History className="h-6 w-6" />
                        <div>
                            <CardTitle>Customer Portal Activity Log</CardTitle>
                            <CardDescription>Monitor customer logins and actions within the portal.</CardDescription>
                        </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleClearLogs} className="gap-2">
                        <Trash2 className="h-4 w-4" /> Clear All Logs
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : logs.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Activity Type</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={getBadgeVariant(log.type)}>{log.type}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{log.details}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                        <ShieldAlert className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Activity Recorded Yet</h3>
                        <p className="mt-1 text-sm">Customer actions from the portal will appear here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
