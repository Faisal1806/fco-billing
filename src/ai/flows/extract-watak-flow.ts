
'use server';
/**
 * @fileOverview AI flow to extract structured data from an invoice (Watak) photo.
 *
 * - extractWatak - Handles the OCR process using Gemini Vision.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const WatakExtractInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of an invoice, as a data URI (base64)."),
});

const WatakExtractOutputSchema = z.object({
  sNo: z.string().describe("The serial number or bill number of the invoice."),
  date: z.string().describe("The date of the invoice in YYYY-MM-DD format."),
  customerName: z.string().describe("The name of the customer or grower."),
  watakNo: z.string().optional().describe("The specific Watak number if different from S.No."),
  khata: z.string().optional().describe("The khata name or number."),
  freight: z.number().optional().describe("Total freight amount."),
  entries: z.array(z.object({
    type: z.enum(['Patti', 'Dabba']).describe("The type of packaging."),
    qty: z.number().describe("The quantity."),
    variety: z.string().describe("The variety of fruit (e.g., American, Delicious)."),
    rate: z.number().describe("The selling rate."),
  })).describe("The line items in the invoice."),
});

export type WatakExtractOutput = z.infer<typeof WatakExtractOutputSchema>;

export async function extractWatak(input: { photoDataUri: string }): Promise<WatakExtractOutput> {
  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    input: input,
    output: { schema: WatakExtractOutputSchema },
    prompt: `You are an expert at reading handwritten and printed fruit mandi invoices (Wataks) from Sopore, Kashmir.
    
    Extract all details from this photo.
    - If values are unclear, make your best educated guess based on mandi context.
    - Convert any date to YYYY-MM-DD.
    - Ensure 'type' is either 'Patti' or 'Dabba'.
    - If a field is missing, leave it null or 0.
    
    Photo: {{media url=photoDataUri}}`,
  });

  if (!output) {
    throw new Error('AI failed to read the invoice. Please try a clearer photo.');
  }

  return output;
}
