
'use server';
/**
 * @fileOverview An AI flow to extract structured data from a watak (sales invoice) image.
 *
 * - extractWatakFromImage - A function that handles the watak extraction process.
 * - WatakExtractOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const WatakExtractOutputSchema = z.object({
  sNo: z.string().describe('The invoice serial number (S.No).'),
  date: z.string().describe('The date of the invoice in YYYY-MM-DD format.'),
  customerName: z.string().describe("The name of the customer or M/s."),
  khata: z.string().optional().describe("The khata or account name, if present."),
  watakNo: z.string().optional().describe("The watak number, if present."),
  freight: z.number().optional().describe("The freight charge."),
  entries: z.array(z.object({
    type: z.enum(['Patti', 'Dabba']).describe("The type of packaging, either 'Patti' or 'Dabba'."),
    qty: z.number().describe("The quantity of items."),
    variety: z.string().describe("The variety of the produce."),
    rate: z.number().describe("The rate per item."),
  })),
});
export type WatakExtractOutput = z.infer<typeof WatakExtractOutputSchema>;

const prompt = ai.definePrompt({
  name: 'extractWatakPrompt',
  input: {
    schema: z.object({
      photoDataUri: z.string().describe("A photo of a watak (sales invoice), as a data URI."),
      apiKey: z.string().optional().describe('The Gemini API Key'),
    }),
  },
  output: {
    schema: WatakExtractOutputSchema,
  },
  prompt: `You are an expert at extracting structured data from images of handwritten agricultural sales invoices (called Wataks) from Sopore, Kashmir.
Your task is to analyze the provided image and extract the key information into a structured JSON object.

Extract the following fields:
- sNo: The main invoice serial number.
- date: The date on the invoice. Convert it to YYYY-MM-DD format.
- customerName: The name of the M/s (customer).
- khata: The 'Khata' field, if it exists.
- watakNo: The 'Watak No' field, if it exists.
- freight: The freight charge, if specified.
- entries: An array of all line items. Each item must have:
  - type: 'Patti' or 'Dabba'. Determine this from the column it's in.
  - qty: The quantity.
  - variety: The name/variety of the produce.
  - rate: The rate per unit.

Analyze this image carefully:
{{media url=photoDataUri}}
`,
});

const extractWatakFlow = ai.defineFlow(
    {
        name: 'extractWatakFlow',
        inputSchema: z.object({
            photoDataUri: z.string(),
            apiKey: z.string().optional(),
        }),
        outputSchema: WatakExtractOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error('AI failed to extract data from the watak.');
        }
        return output;
    }
);

export async function extractWatakFromImage(input: {photoDataUri: string; apiKey?: string}): Promise<WatakExtractOutput> {
    return extractWatakFlow(input);
}
