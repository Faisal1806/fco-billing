
/**
 * @fileOverview Schemas and types for the smart search AI flow.
 *
 * - SmartSearchInputSchema, SmartSearchInput - The input type for the queryData function.
 * - SmartSearchOutputSchema, SmartSearchOutput - The return type for the queryData function.
 */

import { z } from 'zod';

const FilterSchema = z.object({
  field: z.string().describe('The field to filter on (e.g., "date", "customerName", "totals.netSale").'),
  operator: z.enum(['==', '!=', '<', '<=', '>', '>=', 'contains']).describe('The comparison operator.'),
  value: z.union([z.string(), z.number(), z.boolean()]).describe('The value to compare against.'),
});

export const SmartSearchInputSchema = z.object({
  query: z.string().describe('The user\'s natural language search query.'),
  apiKey: z.string().optional().describe('The Gemini API Key'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

export const SmartSearchOutputSchema = z.object({
  collection: z.enum(['invoices', 'purchases', 'receipts', 'challans', 'products', 'parties', 'expenses', 'advances', 'cold_storage', 'bikris']).describe('The data collection to search within.'),
  filters: z.array(FilterSchema).describe('An array of filters to apply to the data.'),
  error: z.string().optional().describe('An error message if the query could not be understood.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;
