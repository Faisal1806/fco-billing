
'use server';
/**
 * @fileOverview An AI flow to extract structured data from a Watak (invoice) image.
 *
 * - extractWatakFromImage - A function that takes an image of a Watak and returns its digital representation.
 * - WatakExtractInput - The input type for the flow (the image data).
 * - WatakExtractOutput - The structured return type for the flow, representing a digital Watak.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single item entry in the Watak
const WatakItemSchema = z.object({
  type: z.enum(['Patti', 'Dabba']).describe('The type of the item, either Patti or Dabba.'),
  qty: z.number().describe('The quantity of the item.'),
  variety: z.string().describe('The variety or description of the item.'),
  rate: z.number().describe('The rate per item.'),
  total: z.number().describe('The total amount for this line item (qty * rate).'),
});

// Define the schema for the totals section of the Watak
const WatakTotalsSchema = z.object({
    pattiQty: z.number().describe('Total quantity of all "Patti" items.'),
    dabbaQty: z.number().describe('Total quantity of all "Dabba" items.'),
    totalQty: z.number().describe('Total quantity of all items (Patti + Dabba).'),
    grossSale: z.number().describe('The total gross sale amount before any deductions.'),
    commissionAmount: z.number().describe('The calculated commission amount.'),
    labour: z.number().describe('The calculated labour charges.'),
    association: z.number().describe('The calculated association fees.'),
    security: z.number().describe('The calculated security fees.'),
    totalExpenses: z.number().describe('The sum of all expenses and deductions.'),
    netSale: z.number().describe('The final net sale amount payable to the grower (Gross Sale - Total Expenses).'),
});


// Define the input schema for the AI flow
const WatakExtractInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a handwritten or printed Watak, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type WatakExtractInput = z.infer<typeof WatakExtractInputSchema>;


// Define the output schema for the AI flow - this is the structured digital Watak
const WatakExtractOutputSchema = z.object({
  sNo: z.string().describe('The serial number or Bill Number of the Watak.'),
  date: z.string().describe('The date of the Watak in YYYY-MM-DD format.'),
  customerName: z.string().describe("The full name of the customer or grower (M/s)."),
  watakNo: z.string().describe('The Watak number, if present.'),
  khata: z.string().optional().describe('The Khata (account) name, if present.'),
  freight: z.number().optional().describe('The freight charges, if mentioned separately.'),
  entries: z.array(WatakItemSchema).describe('An array of all the line items in the Watak.'),
  totals: WatakTotalsSchema.describe('The calculated totals section of the Watak.'),
});
export type WatakExtractOutput = z.infer<typeof WatakExtractOutputSchema>;

// Define the AI prompt for the OCR and data extraction task
const extractWatakPrompt = ai.definePrompt({
  name: 'extractWatakPrompt',
  input: {schema: WatakExtractInputSchema},
  output: {schema: WatakExtractOutputSchema},
  prompt: `You are an expert data entry specialist for a fruit commission agency in Kashmir. Your task is to meticulously analyze the provided image of a "Watak" (a type of invoice or bill) and extract all the relevant information into a structured JSON format.

The Watak may be handwritten or printed. Pay close attention to details.

Analyze the image: {{media url=photoDataUri}}

Extract the following fields and provide them in the specified JSON format. If a field is not present, you may omit it from the output unless it is required.
- sNo (Bill No.)
- date (in YYYY-MM-DD format)
- customerName (The M/s or Grower name)
- watakNo
- khata (Account Name, if different from customerName)
- freight (if mentioned separately)
- entries: A list of all items. Each item must have a type ('Patti' or 'Dabba'), quantity, variety, rate, and total.
- totals: The summary section of the bill. You must calculate and fill all sub-fields like grossSale, all expenses (labour, commission, etc.), and netSale based on the values in the Watak. If formulas are mentioned on the Watak (e.g., Labour = Qty * 3), use them. The standard commission is 12% of the gross sale.`,
});

/**
 * Takes an image of a Watak and returns a structured digital version.
 * @param input The image data as a data URI.
 * @returns A promise that resolves to the structured Watak data.
 */
export async function extractWatakFromImage(input: WatakExtractInput): Promise<WatakExtractOutput> {
  const {output} = await extractWatakPrompt(input, {model: 'gemini-pro-vision'});
  if (!output) {
    throw new Error('AI failed to extract data from the Watak image.');
  }
  return output;
}
