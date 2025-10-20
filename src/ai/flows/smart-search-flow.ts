
'use server';
/**
 * @fileOverview A smart search AI agent for querying business data.
 *
 * - queryData - A function that handles the natural language search process.
 * - SmartSearchInput - The input type for the queryData function.
 * - SmartSearchOutput - The return type for the queryData function.
 */

import { ai } from '@/ai/genkit';
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

const collectionsSchema = `
Here are the available data collections and their queryable fields:

- **invoices** (also called wataks, sales, or bills)
  - Fields: sNo (string), date (string, YYYY-MM-DD), customerName (string), watakNo (string), freight (number), totals.pattiQty (number), totals.dabbaQty (number), totals.grossSale (number), totals.netSale (number)

- **purchases**
  - Fields: billNo (string), date (string, YYYY-MM-DD), growerName (string), purchaseFor (string, "Customer" or "Own Stock (F.Co)"), totals.grandTotal (number)

- **receipts** (also called goods receipts)
  - Fields: no (string), date (string, YYYY-MM-DD), customerName (string), totalNugs (number)

- **challans** (also called delivery notes)
  - Fields: challanNo (string), date (string, YYYY-MM-DD), toMs (string), vehicleNo (string), driverName (string), totalPetti (number), totalDabba (number)

- **products**
  - Fields: name (string), category (string), stock (number), supplier (string)

- **parties** (also called customers or growers)
  - Fields: name (string), type (string, "Grower", "Customer", "Both", etc.), address (string), phone (string)

- **expenses**
  - Fields: date (string, YYYY-MM-DD), category (string), description (string), amount (number), partyName (string)

- **advances** (also called loans)
  - Fields: date (string, YYYY-MM-DD), partyName (string), type (string, "Advance Given" or "Repayment Received"), amount (number)

- **cold_storage**
  - Fields: dateIn (string, YYYY-MM-DD), grower (string), item (string), chamberNo (string), currentQty (number), status (string, "In Stock" or "Released")
  
- **bikris** (also called outside sales)
    - Fields: bikriNo (string), date (string, YYYY-MM-DD), market (string), growerName (string), bikriType (string, "fcoStock" or "growerForwarding"), calculation.netProfitOrLoss (number), calculation.netSalePayableToGrower (number)
`;

const smartSearchFlow = ai.defineFlow(
  {
    name: 'smartSearchFlow',
    inputSchema: SmartSearchInputSchema,
    outputSchema: SmartSearchOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert at converting natural language queries into structured data filters.
    The user wants to search their business data. Your task is to determine the correct data collection and construct a set of filters based on their query.

    Today's date is ${new Date().toISOString().split('T')[0]}.

    ${collectionsSchema}

    - When filtering by date, convert relative terms like "today", "last week", "this month" into specific YYYY-MM-DD dates or date ranges.
    - If a user asks for "unpaid" or "paid" wataks, there is no status field. You should return an error message explaining that this feature is not yet available.
    - If you cannot determine the collection or filters, set the 'error' field with a helpful message. Do not guess.
    - For queries like "show me sales", default to the 'invoices' collection.
    - For queries about profit or loss from outside sales, use the 'bikris' collection.

    User Query: "${input.query}"`;

    try {
      const { output } = await ai.generate({
        model: 'gemini-pro',
        prompt: prompt,
        output: {
          schema: SmartSearchOutputSchema,
        },
        config: {
          apiKey: input.apiKey,
        }
      });
      if (!output) {
        return { collection: 'invoices', filters: [], error: 'The AI could not process the query. Please try rephrasing.' };
      }
      return output;
    } catch (e) {
      console.error(e);
      return { collection: 'invoices', filters: [], error: 'An unexpected error occurred while processing your query.' };
    }
  }
);

export async function queryData(input: SmartSearchInput): Promise<SmartSearchOutput> {
  return await smartSearchFlow(input);
}
