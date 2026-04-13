
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Bot, User, BrainCircuit, Sparkles, MessageSquare, FileDown, Calculator, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryData } from '@/ai/flows/smart-search-flow';
import { SmartSearchOutput } from '@/ai/schemas/smart-search-schemas';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Badge } from '@/components/ui/badge';

type Message = {
  role: 'user' | 'assistant' | 'error';
  content: string | SmartSearchOutput;
  results?: any[];
  aggregationResult?: number;
};

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const SUGGESTIONS = [
    "Show me all wataks of AB. Majeed Lone S/P",
    "What is the grand total of sales for Faisal?",
    "Find all statements from last month",
    "Show me all wataks of Faisal in PDF form",
    "List receipts from last week",
];

export default function SmartSearchPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allData, setAllData] = useState<{[key: string]: any[]}>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const data: {[key: string]: any[]} = {
            invoices: [], purchases: [], receipts: [], challans: [], products: [], parties: [], expenses: [], advances: [], cold_storage: [], bikris: [], statements: []
        };
        const prefixes: {[key: string]: string} = {
            'invoice-': 'invoices', 'purchase-': 'purchases', 'receipt-': 'receipts', 'challan-': 'challans', 'product-': 'products',
            'party-': 'parties', 'expense-': 'expenses', 'advance-': 'advances', 'cs-': 'cold_storage', 'bikri-': 'bikris',
            'manual-statement-': 'statements'
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                for (const prefix in prefixes) {
                    if (key.startsWith(prefix)) {
                        try {
                            data[prefixes[prefix]].push(JSON.parse(localStorage.getItem(key)!));
                        } catch (e) {
                            console.error(`Failed to parse ${key}:`, e);
                        }
                        break;
                    }
                }
            }
        }
        setAllData(data);
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const exportResultsToPdf = (collection: string, results: any[]) => {
    if (!results || results.length === 0) return;
    
    const doc = new jsPDF();
    doc.text(`F.Co Intelligence Report - ${collection.toUpperCase()}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const head = [Object.keys(results[0]).slice(0, 6)];
    const body = results.map(item => Object.values(item).slice(0, 6).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)));

    autoTable(doc, {
        head,
        body,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [30, 127, 79] }
    });

    doc.save(`FCo-Report-${collection}-${Date.now()}.pdf`);
    toast({ title: 'PDF Report Generated', description: 'Your data has been exported to a professional document.' });
  };

  const handleSearch = async (forcedQuery?: string) => {
    const activeQuery = forcedQuery || query;
    if (!activeQuery.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: activeQuery };
    setMessages(prev => [...prev, userMessage]);
    
    const history = messages
        .filter(m => m.role !== 'error')
        .map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            content: typeof m.content === 'string' ? m.content : `Action: ${m.content.collection} search. Filters: ${JSON.stringify(m.content.filters)}. Agg: ${JSON.stringify(m.content.aggregation)}`
        }))
        .slice(-6);

    try {
      const result = await queryData({ query: activeQuery, history });
      
      let assistantMessage: Message;
      if (result.error) {
        assistantMessage = { role: 'error', content: result.error };
      } else {
        const collectionData = allData[result.collection] || [];

        let filteredData = collectionData.filter(item => {
            if (!result.filters || result.filters.length === 0) return true;
            return result.filters.every(filter => {
                const itemValue = getNestedValue(item, filter.field);
                if (itemValue === undefined) return false;

                switch(filter.operator) {
                    case '==': return itemValue == filter.value;
                    case '!=': return itemValue != filter.value;
                    case '>': return itemValue > filter.value;
                    case '>=': return itemValue >= filter.value;
                    case '<': return itemValue < filter.value;
                    case '<=': return itemValue <= filter.value;
                    case 'contains': return typeof itemValue === 'string' && itemValue.toLowerCase().includes(String(filter.value).toLowerCase());
                    default: return false;
                }
            })
        });

        if (result.sort) {
            filteredData.sort((a, b) => {
                const valA = getNestedValue(a, result.sort!.field);
                const valB = getNestedValue(b, result.sort!.field);
                if (valA < valB) return result.sort!.direction === 'asc' ? -1 : 1;
                if (valA > valB) return result.sort!.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        if (result.limit) {
            filteredData = filteredData.slice(0, result.limit);
        }

        let aggregationResult: number | undefined;
        if (result.aggregation && filteredData.length > 0) {
            const values = filteredData.map(item => Number(getNestedValue(item, result.aggregation!.field)) || 0);
            if (result.aggregation.type === 'sum') {
                aggregationResult = values.reduce((a, b) => a + b, 0);
            } else if (result.aggregation.type === 'avg') {
                aggregationResult = values.reduce((a, b) => a + b, 0) / values.length;
            } else if (result.aggregation.type === 'count') {
                aggregationResult = filteredData.length;
            }
        }

        assistantMessage = { 
            role: 'assistant', 
            content: result, 
            results: filteredData,
            aggregationResult 
        };

        if (result.action === 'export_pdf' && filteredData.length > 0) {
            setTimeout(() => exportResultsToPdf(result.collection, filteredData), 1000);
        }
      }
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Smart Search failed:', error);
      const errorMessage: Message = { role: 'error', content: 'An unexpected error occurred. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: (error as Error).message || 'Could not process your request.',
      });
    } finally {
      setQuery('');
      setIsLoading(false);
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    const isUser = msg.role === 'user';
    const isError = msg.role === 'error';
    const Icon = isUser ? User : Bot;
    
    return (
      <motion.div 
        key={index} 
        className={`flex items-start gap-4 w-full ${isUser ? 'justify-end' : ''}`}
        initial={{ opacity: 0, x: isUser ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {!isUser && (
            <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="p-3 bg-accent/20 rounded-2xl border border-accent/30"><Icon className="h-6 w-6 text-accent" /></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">AI NODE</span>
            </div>
        )}
        <div className={`max-w-3xl w-full p-6 rounded-[2rem] shadow-lg ${isUser ? 'bg-accent text-black font-bold' : (isError ? 'bg-destructive/20 text-destructive-foreground border border-destructive/50' : 'glass-panel border-white/10')}`}>
          {typeof msg.content === 'string' ? (
            <p className="leading-relaxed">{msg.content}</p>
          ) : (
            <div className="space-y-6">
              {msg.aggregationResult !== undefined && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="p-8 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[2.5rem] flex items-center justify-between shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden group"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <TrendingUp className="h-24 w-24 text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-6 relative z-10">
                          <div className="p-5 bg-emerald-500 rounded-[1.5rem] shadow-lg shadow-emerald-500/20">
                              <Calculator className="h-8 w-8 text-black" />
                          </div>
                          <div>
                              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1">
                                {msg.content.aggregation?.type === 'sum' ? 'Grand Total Summary' : 
                                 msg.content.aggregation?.type === 'avg' ? 'Average Yield' : 'Index Count'}
                              </p>
                              <p className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                                {msg.content.aggregation?.type === 'count' ? '' : '₹'}{msg.aggregationResult.toLocaleString()}
                              </p>
                          </div>
                      </div>
                      <Badge className="bg-emerald-500 text-black font-black py-2 px-4 rounded-xl text-[10px] tracking-widest uppercase relative z-10">
                        VERIFIED RESULT
                      </Badge>
                  </motion.div>
              )}

              {msg.results && msg.results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <p className="font-black text-xs uppercase tracking-widest opacity-60 flex items-center gap-2">
                            <Sparkles className="h-3 w-3" /> Found {msg.results.length} records in '{msg.content.collection}'
                        </p>
                        {msg.content.action === 'export_pdf' && <Badge className="bg-blue-500 gap-2"><FileDown className="h-3 w-3" /> PDF GENERATED</Badge>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {msg.results.slice(0, 12).map((item, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                <p className="font-bold text-sm truncate text-white">{item.customerName || item.growerName || item.partyName || item.name || 'Record'}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black">{item.date || item.sNo || item.billNo || ''}</p>
                                <p className="text-lg font-black text-accent mt-2">₹{(item.totals?.netSale || item.totals?.grandTotal || item.amount || 0).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                    {msg.results.length > 12 && <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest">Showing top 12 of {msg.results.length} nodes</p>}
                </div>
              )}
            </div>
          )}
        </div>
         {isUser && (
             <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><User className="h-6 w-6" /></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">OPERATOR</span>
             </div>
         )}
      </motion.div>
    );
  };

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col bg-transparent border-none shadow-none">
      <CardHeader className="text-center pb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center">
            <div className="p-6 bg-accent/10 rounded-[2.5rem] w-fit mb-4 border border-accent/20">
                <BrainCircuit className="h-12 w-12 text-accent" />
            </div>
        </motion.div>
        <CardTitle className="text-4xl font-black tracking-tighter uppercase">AI Terminal Assistant</CardTitle>
        <CardDescription className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Natural Language Intelligence Hub</CardDescription>
      </CardHeader>
      
      <CardContent ref={scrollAreaRef} className="flex-1 flex flex-col gap-8 overflow-y-auto p-8 custom-scrollbar">
        <AnimatePresence>
            {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                <MessageSquare className="h-16 w-16 opacity-10" />
                <div className="w-full max-w-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6">INTELLIGENCE STARTERS</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {SUGGESTIONS.map((s, i) => (
                            <button key={i} onClick={() => handleSearch(s)} className="px-6 py-3 rounded-2xl glass-panel border-white/5 hover:border-accent/50 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-all">
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            ) : (
            <div className="space-y-10">
                {messages.map(renderMessage)}
                {isLoading && (
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20 shrink-0">
                        <Loader2 className="h-6 w-6 text-accent animate-spin" />
                    </div>
                    <div className="max-w-3xl w-full p-6 rounded-[2rem] glass-panel border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse opacity-50">Synthesizing data stream...</p>
                    </div>
                </div>
                )}
            </div>
            )}
        </AnimatePresence>
      </CardContent>

      <div className="p-8 border-t border-white/5 mt-auto">
        <div className="relative max-w-4xl mx-auto">
            <Input
                placeholder="COMMAND YOUR DATA (e.g. 'Grand total of Faisal's sales')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                disabled={isLoading}
                className="pr-32 h-20 text-sm font-black tracking-widest uppercase rounded-[2.5rem] bg-white/5 border-white/10 focus-visible:ring-accent/50"
            />
            <Button
                className="absolute right-3 top-3 bottom-3 rounded-[2rem] px-8 bg-accent text-black font-black tracking-widest text-[10px]"
                onClick={() => handleSearch()}
                disabled={isLoading || !query.trim()}
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'EXECUTE'}
            </Button>
        </div>
      </div>
    </Card>
  );
}
