
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Bot, User, BrainCircuit } from 'lucide-react';
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
            invoices: [], purchases: [], receipts: [], challans: [], products: [], parties: [], expenses: [], advances: [], cold_storage: [], bikris: []
        };
        const prefixes: {[key: string]: string} = {
            'invoice-': 'invoices', 'purchase-': 'purchases', 'receipt-': 'receipts', 'challan-': 'challans', 'product-': 'products',
            'party-': 'parties', 'expense-': 'expenses', 'advance-': 'advances', 'cs-': 'cold_storage', 'bikri-': 'bikris'
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

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const result = await queryData({ query });
      
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
      const title = item.name || item.customerName || item.growerName || `ID: ${item.id || item.sNo || item.billNo}`;
      const date = item.date ? new Date(item.date).toLocaleDateString() : null;
      const amount = item.totals?.netSale ?? item.totals?.grandTotal ?? item.amount ?? null;
      
      return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.05, y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
            className="bg-card/60 backdrop-blur-sm border border-white/10 p-4 rounded-lg shadow-md"
        >
            <h4 className="font-bold text-primary-foreground truncate">{title}</h4>
            {date && <p className="text-xs text-muted-foreground">{date}</p>}
            {amount !== null && <p className="font-mono text-lg mt-2">₹{amount.toLocaleString()}</p>}
            <div className="text-xs mt-2 space-y-1 text-muted-foreground overflow-hidden">
                {Object.entries(item).slice(0, 3).map(([key, value]) => 
                    (typeof value === 'string' || typeof value === 'number') && key !== 'name' && key !== 'date' && (
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
        {!isUser && <div className="p-2 bg-primary/10 rounded-full shrink-0"><Icon className="h-6 w-6 text-primary" /></div>}
        <div className={`max-w-3xl w-full p-4 rounded-xl shadow-lg ${isUser ? 'bg-primary text-primary-foreground' : (isError ? 'bg-destructive/20 text-destructive-foreground border border-destructive/50' : 'bg-card/70 backdrop-blur-sm border border-white/10')}`}>
          {typeof msg.content === 'string' ? (
            <p>{msg.content}</p>
          ) : (
            <div>
              {msg.results && msg.results.length > 0 ? (
                <>
                <p className="font-semibold mb-3">Found {msg.results.length} results from '{msg.content.collection}':</p>
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
                 <p>I couldn't find any results matching your query in the '{msg.content.collection}' collection.</p>
              ) : (
                 <pre className="mt-2 text-xs bg-black/20 p-2 rounded-md overflow-x-auto">
                    {JSON.stringify(msg.content, null, 2)}
                 </pre>
              )}
            </div>
          )}
        </div>
         {isUser && <div className="p-2 bg-card rounded-full shrink-0"><Icon className="h-6 w-6" /></div>}
      </motion.div>
    );
  };

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col bg-transparent border-none shadow-none">
      <CardHeader className="text-center">
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' } }}
            className="flex justify-center"
        >
            <div className="p-4 bg-primary/10 rounded-full w-fit mb-2 border-4 border-primary/20">
                <BrainCircuit className="h-10 w-10 text-primary" />
            </div>
        </motion.div>
        <CardTitle className="text-3xl">AI Chat Assistant</CardTitle>
        <CardDescription>
          Ask anything about your data in plain English. For example: "Show me top 5 sales this month" or "Find parties from Nadihal".
        </CardDescription>
      </CardHeader>
      <CardContent ref={scrollAreaRef} className="flex-1 flex flex-col gap-4 overflow-y-auto p-4">
        <AnimatePresence>
            {messages.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground"
            >
                <Bot className="h-16 w-16 mb-4" />
                <p className="text-lg font-semibold">I'm ready to help!</p>
                <p>What would you like to find today?</p>
            </motion.div>
            ) : (
            <div className="space-y-6">
                {messages.map(renderMessage)}
                {isLoading && (
                <motion.div 
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                    <div className="max-w-3xl w-full p-4 rounded-xl bg-card/70 backdrop-blur-sm border border-white/10">
                    <p>Thinking...</p>
                    </div>
                </motion.div>
                )}
            </div>
            )}
        </AnimatePresence>
      </CardContent>
      <motion.div 
        className="p-4 border-t border-white/10 mt-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
      >
        <div className="relative">
             <motion.div
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(var(--ring), 0.3)' }}
                className="relative"
            >
                <Input
                    placeholder="Type your search query..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                    disabled={isLoading}
                    className="pr-24 h-14 text-base rounded-full bg-card/80 backdrop-blur-sm border-2 border-primary/30 focus-visible:ring-primary/50"
                />
                <Button
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-11 rounded-full px-5"
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </Button>
            </motion.div>
        </div>
      </motion.div>
    </Card>
  );
}
