
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Bot, User } from 'lucide-react';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { queryData, SmartSearchOutput } from '@/ai/flows/smart-search-flow';

type Message = {
  role: 'user' | 'assistant' | 'error';
  content: string | SmartSearchOutput;
};

export default function SmartSearchPage() {
  const { apiKey, isApiKeySet } = useApiKey();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    setQuery('');

    try {
      const result = await queryData({ query, apiKey });
      
      let assistantMessage: Message;
      if (result.error) {
        assistantMessage = { role: 'error', content: result.error };
      } else {
        // For now, we'll just display the structured query.
        // In the next step, we'll execute this query and show the results.
        assistantMessage = { role: 'assistant', content: result };
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
      setIsLoading(false);
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    const isUser = msg.role === 'user';
    const isError = msg.role === 'error';
    const Icon = isUser ? User : Bot;

    return (
      <div key={index} className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
        {!isUser && <div className="p-2 bg-primary/10 rounded-full"><Icon className="h-6 w-6 text-primary" /></div>}
        <div className={`max-w-xl p-4 rounded-xl ${isUser ? 'bg-primary text-primary-foreground' : (isError ? 'bg-destructive/10 text-destructive-foreground' : 'bg-muted')}`}>
          {typeof msg.content === 'string' ? (
            <p>{msg.content}</p>
          ) : (
            <div>
              <p className="font-semibold">Understood! Here's the plan:</p>
              <pre className="mt-2 text-xs bg-black/20 p-2 rounded-md overflow-x-auto">
                {JSON.stringify(msg.content, null, 2)}
              </pre>
               <p className="text-xs italic mt-2 text-muted-foreground">(Result rendering will be implemented in the next step)</p>
            </div>
          )}
        </div>
         {isUser && <div className="p-2 bg-muted rounded-full"><Icon className="h-6 w-6" /></div>}
      </div>
    );
  };

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Search className="h-6 w-6 text-primary" />
          Smart Search Assistant
        </CardTitle>
        <CardDescription>
          Ask anything about your data in plain English. For example: "Show me all sales from last week" or "Find parties in Nadihal".
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
            className="pr-24"
          />
          <Button
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
