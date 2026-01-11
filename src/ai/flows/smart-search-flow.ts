
'use server';
/**
 * @fileOverview A smart search AI agent for querying business data.
 *
 * - queryData - A function that handles the natural language search process.
 */

import { smartSearchFlow } from '@/ai/genkit';
import type { SmartSearchInput, SmartSearchOutput } from '@/ai/schemas/smart-search-schemas';


export async function queryData(input: SmartSearchInput): Promise<SmartSearchOutput> {
  try {
      return await smartSearchFlow(input);
  } catch (e: any) {
      console.error("Error executing smartSearchFlow:", e);
      return { collection: 'invoices', filters: [], error: `An unexpected error occurred while processing your query: ${e.message}` };
  }
}
