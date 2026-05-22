
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
    FileSpreadsheet, 
    Search, 
    PlusCircle, 
    FilePenLine, 
    Trash2, 
    Loader2, 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    FileText,
    ArrowUpRight,
    Calculator
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { SummaryCard } from '@/components/ui/summary-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function StatementRegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [statements, setStatements] = React.useState<any[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [userRole, setUserRole] = React.useState<string | null>(null);

    const fetchStatements = React.useCallback(() => {
        setIsLoading(true);
        if (typeof window !== 'undefined') {
            const loaded = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('manual-statement-')) {
                    try {
                        const stmt = JSON.parse(localStorage.getItem(key)!);
                        loaded.push(stmt);
                    } catch (e) {
                        console.error("Error parsing statement:", key, e);
                    }
                }
            }
            setStatements(loaded.sort((a, b) => Number(b.sNo) - Number(a.sNo)));
        }
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setUserRole(localStorage.getItem('userRole'));
        }
        fetchStatements();
    }, [fetchStatements]);

    const filteredStatements = React.useMemo(() => {
        if (!searchTerm) return statements;
        const lower = searchTerm.toLowerCase();
        return statements.filter(s => 
            s.partyName?.toLowerCase().includes(lower) || 
            s.sNo?.toString().includes(lower)
        );
    }, [statements, searchTerm]);

    const globalTotals = React.useMemo(() => {
        return filteredStatements.reduce((acc, s) => {
            acc.credits += s.creditTotals?.netSale || 0;
            acc.debits += s.totalDebit || 0;
            acc.balance += s.finalBalance || 0;
            return acc;
        }, { credits: 0, debits: 0, balance: 0 });
    }, [filteredStatements]);

    const handleDelete = (sNo: string) => {
        if (userRole !== 'admin') {
            toast({ variant: "destructive", title: "Permission Denied" });
            return;
        }
        if (!window.confirm(`Are you sure you want to delete Statement #${sNo}?`)) return;
        localStorage.removeItem(`manual-statement-${sNo}`);
        toast({ title: "Statement Deleted" });
        fetchStatements();
    };

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                title="Statement Register"
                description="Consolidated intelligence for all grower account statements. Track credits, remittances, and net balances at scale."
                icon={<FileSpreadsheet className="h-8 w-8" />}
                imageUrl="/assets/3d/khata.png"
            />

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SummaryCard 
                    title="Gross Credit Volume" 
                    value={`₹${globalTotals.credits.toLocaleString()}`} 
                    description="Aggregate net sales (Jama) across all indexed statement nodes."
                    icon={Wallet}
                />
                <SummaryCard 
                    title="Remittance Flow" 
                    value={`₹${globalTotals.debits.toLocaleString()}`} 
                    description="Total cash and bank payments (Kharch) received from growers."
                    icon={TrendingUp}
                />
                <SummaryCard 
                    title="Net Ledger Position" 
                    value={`₹${Math.abs(globalTotals.balance).toLocaleString()}`} 
                    description={globalTotals.balance >= 0 ? "Total Net Jama (Payable to Growers)" : "Total Net Baqaya (Recoverable Advances)"}
                    icon={globalTotals.balance >= 0 ? TrendingDown : TrendingUp}
                    className={globalTotals.balance >= 0 ? "border-emerald-500/30" : "border-rose-500/30"}
                />
            </div>

            <Card className="glass-panel rounded-[3rem] border-white/5 overflow-hidden">
                <CardHeader className="p-10 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight uppercase">Master Statement Index</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                {filteredStatements.length} Active Account Nodes Located
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input 
                                    placeholder="Search by Grower or ID..." 
                                    className="pl-12 h-12 rounded-2xl bg-white/5 border-white/10 font-bold text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button onClick={() => router.push('/statement')} className="h-12 rounded-2xl gap-2 bg-accent text-black font-black text-[10px] tracking-widest px-6 shadow-lg shadow-accent/20">
                                <PlusCircle className="h-4 w-4" /> NEW STATEMENT
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <Table>
                            <TableHeader className="bg-white/[0.03] sticky top-0 z-10">
                                <TableRow className="border-white/5 h-16">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest pl-10">ID</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Grower Node</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Total Jama</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Total Kharch</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Net Position</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {filteredStatements.length > 0 ? (
                                        filteredStatements.map((s, index) => (
                                            <motion.tr
                                                key={s.sNo}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="group border-white/5 h-20 hover:bg-white/[0.03] transition-all cursor-pointer"
                                                onClick={() => router.push(`/statement`)}
                                            >
                                                <TableCell className="pl-10">
                                                    <Badge variant="outline" className="bg-white/5 border-white/10 font-mono text-xs px-3 py-1">
                                                        #{s.sNo}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-black text-white tracking-tight">{s.partyName}</p>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">ID: {s.sNo}</p>
                                                </TableCell>
                                                <TableCell className="text-xs font-bold opacity-60">
                                                    {s.statementDate ? new Date(s.statementDate).toLocaleDateString('en-GB') : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-sm">
                                                    ₹{s.creditTotals?.netSale?.toLocaleString() || '0'}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-sm text-rose-400">
                                                    - ₹{s.totalDebit?.toLocaleString() || '0'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <p className={cn(
                                                        "text-lg font-black tracking-tighter",
                                                        s.finalBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        ₹{Math.abs(s.finalBalance).toLocaleString()}
                                                    </p>
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40">
                                                        {s.finalBalance >= 0 ? "JAMA" : "BAQAYAH"}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-right pr-10">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={(e) => { e.stopPropagation(); router.push('/statement'); }}
                                                            className="h-10 w-10 rounded-xl hover:bg-accent/20 text-accent"
                                                        >
                                                            <FilePenLine className="h-4 w-4" />
                                                        </Button>
                                                        {userRole === 'admin' && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(s.sNo); }}
                                                                className="h-10 w-10 rounded-xl hover:bg-rose-500/20 text-rose-500"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-10 w-10 rounded-xl hover:bg-white/10"
                                                        >
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-60 text-center opacity-30">
                                                <div className="flex flex-col items-center gap-4">
                                                    <FileText className="h-12 w-12" />
                                                    <p className="text-xs font-black uppercase tracking-[0.3em]">No statement nodes indexed in terminal</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </AnimatePresence>
                            </TableBody>
                            <TableFooter className="bg-white/[0.05] h-20 font-black border-t-2 border-white/10">
                                <TableRow className="border-none">
                                    <TableCell colSpan={3} className="pl-10 text-[10px] uppercase tracking-widest text-accent flex items-center gap-3 h-20">
                                        <Calculator className="h-4 w-4" /> AGGREGATE LEDGER TOTALS
                                    </TableCell>
                                    <TableCell className="text-right text-base tracking-tighter">
                                        ₹{globalTotals.credits.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right text-base tracking-tighter text-rose-400">
                                        - ₹{globalTotals.debits.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={cn(
                                                "text-xl tracking-tighter",
                                                globalTotals.balance >= 0 ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                ₹{Math.abs(globalTotals.balance).toLocaleString()}
                                            </span>
                                            <span className="text-[8px] uppercase tracking-widest opacity-40">
                                                NET {globalTotals.balance >= 0 ? "JAMA" : "BAQAYAH"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

