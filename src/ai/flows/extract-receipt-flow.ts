
'use server';
/**
 * @fileOverview An AI flow to extract structured data from a Goods Receipt image.
 *
 * - extractReceiptFromImage - A function that takes an image of a receipt and returns its digital representation.
 * - ReceiptExtractInput - The input type for the flow (the image data).
 * - ReceiptExtractOutput - The structured return type for the flow, representing a digital receipt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single item entry in the Receipt
const ReceiptItemSchema = z.object({
  khata: z.string().describe('The Khata (account) name for the item.'),
  kind: z.string().describe('The kind or variety of the produce.'),
  peti: z.number().describe('The quantity of "Peti" (boxes).'),
  daba: z.number().describe('The quantity of "Daba" (smaller boxes).'),
  freight: z.string().optional().describe('Freight charges associated with this item, if any.'),
});

// Define the input schema for the AI flow
const ReceiptExtractInputSchema = z.object({
  apiKey: z.string().optional().describe('The Gemini API key.'),
  photoDataUri: z
    .string()
    .describe(
      "A photo of a handwritten or printed Goods Receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReceiptExtractInput = z.infer<typeof ReceiptExtractInputSchema>;


// Define the output schema for the AI flow - this is the structured digital Receipt
const ReceiptExtractOutputSchema = z.object({
  no: z.string().describe('The serial number of the receipt.'),
  date: z.string().describe('The date of the receipt in YYYY-MM-DD format.'),
  customerName: z.string().describe("The full name of the customer or grower (M/s)."),
  ro: z.string().optional().describe("The residence of the customer (R/o)."),
  entries: z.array(ReceiptItemSchema).describe('An array of all the line items in the receipt.'),
  totalNugs: z.number().describe('The total quantity of all items (Peti + Daba).'),
  freightPaid: z.number().optional().describe('The total freight amount paid, if mentioned.'),
  wattakReadyOn: z.string().optional().describe('The date when the Watak (bill) will be ready.'),
});
export type ReceiptExtractOutput = z.infer<typeof ReceiptExtractOutputSchema>;


/**
 * Takes an image of a Goods Receipt and returns a structured digital version.
 * @param input The image data as a data URI.
 * @returns A promise that resolves to the structured Receipt data.
 */
export async function extractReceiptFromImage(input: ReceiptExtractInput): Promise<ReceiptExtractOutput> {
  return extractReceiptFlow(input);
}


const extractReceiptPrompt = ai.definePrompt({
  name: 'extractReceiptPrompt',
  model: 'googleai/gemini-1.5-flash-preview',
  input: {schema: z.object({ photoDataUri: z.string() })},
  output: {schema: ReceiptExtractOutputSchema},
  prompt: `You are an expert data entry specialist for a fruit commission agency in Kashmir. Your task is to meticulously analyze the provided image of a "Goods Receipt" and extract all the relevant information into a structured JSON format.

The Receipt may be handwritten or printed. Pay close attention to details.

Analyze the image: {{media url=photoDataUri}}

Extract the following fields and provide them in the specified JSON format. If a field is not present, you may omit it from the output.
- no (Receipt No.)
- date (in YYYY-MM-DD format)
- customerName (The M/s or Grower name)
- ro (Residence of)
- entries: A list of all items. Each item must have a khata, kind, peti, and daba.
- totalNugs: Calculate the sum of all peti and daba quantities.
- freightPaid: The total freight amount paid in cash.
- wattakReadyOn: The date the Watak is expected to be ready.`,
  config: {
    // The API key will be passed dynamically in the flow.
  },
});

// Define the main Genkit flow
const extractReceiptFlow = ai.defineFlow(
  {
    name: 'extractReceiptFlow',
    inputSchema: ReceiptExtractInputSchema,
    outputSchema: ReceiptExtractOutputSchema,
  },
  async (input) => {
    const {output} = await extractReceiptPrompt(
      {photoDataUri: input.photoDataUri},
      {
        config: {
          apiKey: input.apiKey,
        },
      }
    );
    if (!output) {
      throw new Error('AI failed to extract data from the Receipt image.');
    }
    return output;
  }
);
