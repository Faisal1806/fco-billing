
/**
 * @fileOverview Schemas and types for the smart search AI flow.
 *
 * - SmartSearchInputSchema, SmartSearchInput - The input type for the queryData function.
 * - SmartSearchOutputSchema, SmartSearchOutput - The return type for the queryData function.
 */

import { z } from 'genkit';

export const FilterSchema = z.object({
  field: z.string().describe('The field to filter on (e.g., "date", "customerName", "totals.netSale").'),
  operator: z.enum(['==', '!=', '<', '<=', '>', '>=', 'contains']).describe('The comparison operator.'),
  value: z.union([z.string(), z.number(), z.boolean()]).describe('The value to compare against.'),
});

export const SortSchema = z.object({
    field: z.string().describe('The field to sort by.'),
    direction: z.enum(['asc', 'desc']).describe('The sort direction.'),
});

export const AggregationSchema = z.object({
    field: z.string().describe('The field to aggregate (e.g., "totals.netSale").'),
    type: z.enum(['sum', 'avg', 'count']).describe('The type of aggregation to perform.'),
});

export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

export const SmartSearchInputSchema = z.object({
  query: z.string().describe('The user\'s natural language search query.'),
  history: z.array(ChatMessageSchema).optional().describe('The conversation history for follow-up context.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

export const SmartSearchOutputSchema = z.object({
  collection: z.enum(['invoices', 'purchases', 'receipts', 'challans', 'products', 'parties', 'expenses', 'advances', 'cold_storage', 'bikris', 'statements']).describe('The data collection to search within.'),
  filters: z.array(FilterSchema).describe('An array of filters to apply to the data.'),
  sort: SortSchema.optional().describe("An optional sort configuration."),
  limit: z.number().optional().describe("An optional limit for the number of results."),
  aggregation: AggregationSchema.optional().describe("Optional request to calculate a total, average, or count."),
  action: z.enum(['view', 'export_pdf']).optional().describe("The action the user wants to perform, e.g., viewing data or exporting a PDF."),
  error: z.string().optional().describe('An error message if the query could not be understood.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;
