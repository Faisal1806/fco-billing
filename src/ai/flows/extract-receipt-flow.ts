
'use server';
/**
 * @fileOverview An AI flow to extract structured data from a goods receipt image.
 *
 * - extractReceiptFromImage - A function that handles the receipt extraction process.
 * - ReceiptExtractOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const ReceiptExtractOutputSchema = z.object({
  no: z.string().describe('The receipt number.'),
  date: z.string().describe('The date of the receipt in YYYY-MM-DD format.'),
  customerName: z.string().describe("The name of the customer or M/s."),
  ro: z.string().optional().describe("The residence of (R/o) the customer."),
  entries: z.array(z.object({
    khata: z.string().describe("The khata or account name for the entry."),
    kind: z.string().describe("The kind or variety of the produce."),
    peti: z.number().describe("The quantity of peti (boxes)."),
    daba: z.number().describe("The quantity of daba (small boxes)."),
    freight: z.string().describe("The freight charge for this entry."),
  })),
  freightPaid: z.number().optional().describe("The total amount of freight paid in cash."),
  wattakReadyOn: z.string().optional().describe("The date the watak (invoice) will be ready."),
});
export type ReceiptExtractOutput = z.infer<typeof ReceiptExtractOutputSchema>;

const prompt = ai.definePrompt({
  name: 'extractReceiptPrompt',
  input: {
    schema: z.object({
      photoDataUri: z.string().describe("A photo of a goods receipt, as a data URI."),
      apiKey: z.string().optional().describe('The Gemini API Key'),
    }),
  },
  output: {
    schema: ReceiptExtractOutputSchema,
  },
  prompt: `You are an expert at extracting structured data from images of handwritten agricultural goods receipts from Sopore, Kashmir. The receipts are called 'payments' locally.
Your task is to analyze the provided image and extract the key information into a structured JSON object.

Extract the following fields:
- no: The receipt number.
- date: The date on the receipt. Convert it to YYYY-MM-DD format.
- customerName: The name of the M/s (customer).
- ro: The 'R/o' or 'Residence of' field.
- entries: An array of all line items. Each item must have:
  - khata: The account name.
  - kind: The type/variety of produce.
  - peti: The number of 'peti' (large boxes).
  - daba: The number of 'daba' (small boxes).
  - freight: The freight cost as a string.
- freightPaid: The total cash amount paid for freight.
- wattakReadyOn: The date when the invoice (watak) will be ready.

Analyze this image:
{{media url=photoDataUri}}
`,
});

const extractReceiptFlow = ai.defineFlow(
    {
        name: 'extractReceiptFlow',
        inputSchema: z.object({
            photoDataUri: z.string(),
            apiKey: z.string().optional(),
        }),
        outputSchema: ReceiptExtractOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error('AI failed to extract data from the receipt.');
        }
        return output;
    }
);

export async function extractReceiptFromImage(input: {photoDataUri: string; apiKey?: string}): Promise<ReceiptExtractOutput> {
    return extractReceiptFlow(input);
}
