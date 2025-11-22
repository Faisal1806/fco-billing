
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Bot, User } from 'lucide-react';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { queryData } from '@/ai/flows/smart-search-flow';
import { SmartSearchOutput } from '@/ai/schemas/smart-search-schemas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Message = {
  role: 'user' | 'assistant' | 'error';
  content: string | SmartSearchOutput;
  results?: any[];
};

// Helper to access nested properties
const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export default function SmartSearchPage() {
  const { apiKey, isApiKeySet } = useApiKey();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allData, setAllData] = useState<{[key: string]: any[]}>({});

  useEffect(() => {
    // Pre-load all data from localStorage on component mount
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
                        data[prefixes[prefix]].push(JSON.parse(localStorage.getItem(key)!));
                        break;
                    }
                }
            }
        }
        setAllData(data);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!isApiKeySet) {
      toast({
        variant: 'destructive',
        title: 'API Key Required',
        description: 'Please set your Gemini API key in the Sales tab to use Smart Search.',
      });
      return;
    }

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const result = await queryData({ query, apiKey });
      
      let assistantMessage: Message;
      if (result.error) {
        assistantMessage = { role: 'error', content: result.error };
      } else {
        const collectionData = allData[result.collection] || [];

        let filteredData = collectionData.filter(item => {
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

  const renderMessage = (msg: Message, index: number) => {
    const isUser = msg.role === 'user';
    const isError = msg.role === 'error';
    const Icon = isUser ? User : Bot;

    return (
      <div key={index} className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
        {!isUser && <div className="p-2 bg-primary/10 rounded-full shrink-0"><Icon className="h-6 w-6 text-primary" /></div>}
        <div className={`max-w-3xl w-full p-4 rounded-xl ${isUser ? 'bg-primary text-primary-foreground' : (isError ? 'bg-destructive/10 text-destructive-foreground' : 'bg-muted')}`}>
          {typeof msg.content === 'string' ? (
            <p>{msg.content}</p>
          ) : (
            <div>
              {msg.results && msg.results.length > 0 ? (
                <>
                <p className="font-semibold mb-2">Found {msg.results.length} results:</p>
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {Object.keys(msg.results[0]).map(key => <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {msg.results.map((row, i) => (
                                <TableRow key={i}>
                                    {Object.values(row).map((val: any, j) => (
                                        <TableCell key={j} className="whitespace-nowrap text-xs">
                                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
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
         {isUser && <div className="p-2 bg-muted rounded-full shrink-0"><Icon className="h-6 w-6" /></div>}
      </div>
    );
  };

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          AI Chat Assistant
        </CardTitle>
        <CardDescription>
          Ask anything about your data in plain English. For example: "Show me top 5 sales this month" or "Find parties from Nadihal".
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="h-16 w-16 mb-4" />
              <p className="text-lg font-semibold">I'm ready to help!</p>
              <p>What would you like to find today?</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map(renderMessage)}
             {isLoading && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
                <div className="max-w-3xl w-full p-4 rounded-xl bg-muted">
                  <p>Thinking...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <div className="p-4 border-t">
        <div className="relative">
          <Input
            placeholder="Type your search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
            disabled={isLoading}
            className="pr-24 h-12"
          />
          <Button
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9"
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

    