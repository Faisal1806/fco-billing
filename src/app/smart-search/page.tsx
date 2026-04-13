
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Bot, User, BrainCircuit, Sparkles, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryData } from '@/ai/flows/smart-search-flow';
import { SmartSearchOutput } from '@/ai/schemas/smart-search-schemas';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  role: 'user' | 'assistant' | 'error';
  content: string | SmartSearchOutput;
  results?: any[];
};

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const SUGGESTIONS = [
    "Show me top 5 sales this month",
    "Find all statements for Faisal",
    "List receipts from last week",
    "Find parties from Nadihal",
    "Show me commissions earned"
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

  const handleSearch = async (forcedQuery?: string) => {
    const activeQuery = forcedQuery || query;
    if (!activeQuery.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: activeQuery };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const result = await queryData({ query: activeQuery });
      
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

        assistantMessage = { role: 'assistant', content: result, results: filteredData };
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

  const ResultCard = ({ item }: { item: any }) => {
      const title = item.name || item.customerName || item.growerName || item.partyName || `ID: ${item.id || item.sNo || item.billNo}`;
      const date = item.date || item.statementDate || (item.dateIn ? item.dateIn : null);
      const displayDate = date ? new Date(date).toLocaleDateString() : null;
      const amount = item.totals?.netSale ?? item.totals?.grandTotal ?? item.amount ?? item.finalBalance ?? null;
      
      return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.05, y: -5, boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.4)' }}
            className="bg-card/60 backdrop-blur-sm border border-white/10 p-4 rounded-lg shadow-md"
        >
            <h4 className="font-bold text-primary-foreground truncate">{title}</h4>
            {displayDate && <p className="text-xs text-muted-foreground">{displayDate}</p>}
            {amount !== null && <p className="font-mono text-lg mt-2 text-accent">₹{amount.toLocaleString()}</p>}
            <div className="text-xs mt-2 space-y-1 text-muted-foreground overflow-hidden">
                {Object.entries(item).slice(0, 3).map(([key, value]) => 
                    (typeof value === 'string' || typeof value === 'number') && !['name', 'date', 'id', 'sNo', 'customerName', 'growerName', 'partyName'].includes(key) && (
                        <div key={key} className="flex justify-between gap-2">
                            <span className="capitalize font-medium text-foreground/70">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="truncate">{String(value)}</span>
                        </div>
                    )
                )}
            </div>
        </motion.div>
      )
  };


  const renderMessage = (msg: Message, index: number) => {
    const isUser = msg.role === 'user';
    const isError = msg.role === 'error';
    const Icon = isUser ? User : Bot;
    
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
      <motion.div 
        key={index} 
        className={`flex items-start gap-4 w-full ${isUser ? 'justify-end' : ''}`}
        initial={{ opacity: 0, x: isUser ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {!isUser && (
            <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-accent/20 rounded-2xl border border-accent/30 shrink-0"><Icon className="h-6 w-6 text-accent" /></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">AI NODE</span>
            </div>
        )}
        <div className={`max-w-3xl w-full p-6 rounded-[2rem] shadow-lg ${isUser ? 'bg-accent text-black font-bold' : (isError ? 'bg-destructive/20 text-destructive-foreground border border-destructive/50' : 'glass-panel border-white/10')}`}>
          {typeof msg.content === 'string' ? (
            <p className="leading-relaxed">{msg.content}</p>
          ) : (
            <div>
              {msg.results && msg.results.length > 0 ? (
                <>
                <p className="font-black text-xs uppercase tracking-widest mb-4 opacity-60 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Data Retrieval Successful: {msg.results.length} nodes located in '{msg.content.collection}'
                </p>
                 <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {msg.results.map((item, i) => <ResultCard key={i} item={item} />)}
                </motion.div>
                </>
              ) : msg.results && msg.results.length === 0 ? (
                 <p className="opacity-60 italic">Scan complete. I could not locate any matching data nodes in the '{msg.content.collection}' infrastructure.</p>
              ) : (
                 <pre className="mt-2 text-[10px] font-mono bg-black/20 p-4 rounded-xl overflow-x-auto opacity-50">
                    {JSON.stringify(msg.content, null, 2)}
                 </pre>
              )}
            </div>
          )}
        </div>
         {isUser && (
             <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shrink-0"><Icon className="h-6 w-6" /></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">OPERATOR</span>
             </div>
         )}
      </motion.div>
    );
  };

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col bg-transparent border-none shadow-none">
      <CardHeader className="text-center pb-8">
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' } }}
            className="flex justify-center"
        >
            <div className="p-6 bg-accent/10 rounded-[2.5rem] w-fit mb-4 border border-accent/20 relative group">
                <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <BrainCircuit className="h-12 w-12 text-accent relative z-10" />
            </div>
        </motion.div>
        <CardTitle className="text-4xl font-black tracking-tighter uppercase">AI Terminal Assistant</CardTitle>
        <CardDescription className="text-xs font-bold tracking-widest uppercase opacity-60 mt-2">
          Natural Language Query Node • Connected to F.Co Cloud Database
        </CardDescription>
      </CardHeader>
      
      <CardContent ref={scrollAreaRef} className="flex-1 flex flex-col gap-8 overflow-y-auto p-8 custom-scrollbar">
        <AnimatePresence>
            {messages.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-10"
            >
                <div className="space-y-4">
                    <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground opacity-20 mx-auto" />
                    <p className="text-lg font-black tracking-tight text-white/40 uppercase">Awaiting Operator Input...</p>
                </div>
                
                <div className="w-full max-w-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6">INTELLIGENCE STARTERS</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {SUGGESTIONS.map((s, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSearch(s)}
                                className="px-6 py-3 rounded-2xl glass-panel border-white/5 hover:border-accent/50 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-all"
                            >
                                {s}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>
            ) : (
            <div className="space-y-10">
                {messages.map(renderMessage)}
                {isLoading && (
                <motion.div 
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20 shrink-0">
                        <Loader2 className="h-6 w-6 text-accent animate-spin" />
                    </div>
                    <div className="max-w-3xl w-full p-6 rounded-[2rem] glass-panel border-white/10">
                        <p className="text-xs font-black uppercase tracking-widest animate-pulse opacity-50">Analyzing data clusters...</p>
                    </div>
                </motion.div>
                )}
            </div>
            )}
        </AnimatePresence>
      </CardContent>

      <motion.div 
        className="p-8 border-t border-white/5 mt-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
      >
        <div className="relative max-w-4xl mx-auto">
             <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative"
            >
                <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full opacity-20 pointer-events-none" />
                <Input
                    placeholder="COMMAND YOUR DATA (e.g. 'Show me top 5 sales this month')..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                    disabled={isLoading}
                    className="pr-32 h-20 text-sm font-black tracking-widest uppercase rounded-[2.5rem] bg-white/5 border-white/10 focus-visible:ring-accent/50 focus-visible:border-accent/50 shadow-2xl"
                />
                <Button
                    className="absolute right-3 top-3 bottom-3 rounded-[2rem] px-8 bg-accent text-black font-black tracking-widest text-[10px] hover:bg-accent/90"
                    onClick={() => handleSearch()}
                    disabled={isLoading || !query.trim()}
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-4 w-4 mr-2" /> EXECUTE</>}
                </Button>
            </motion.div>
        </div>
      </motion.div>
    </Card>
  );
}
