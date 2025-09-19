
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
  photoDataUri: z
    .string()
    .describe(
      "A photo of a handwritten or printed Goods Receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  apiKey: z.string().optional().describe('The Gemini API Key'),
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

const extractReceiptFlow = ai.defineFlow(
    {
        name: 'extractReceiptFlow',
        inputSchema: ReceiptExtractInputSchema,
        outputSchema: ReceiptExtractOutputSchema,
    },
    async (input) => {
        const {output} = await ai.generate({
            model: 'gemini-pro-vision',
            prompt: `You are an expert data entry specialist for a fruit commission agency in Kashmir. Your task is to meticulously analyze the provided image of a "Goods Receipt" and extract all the relevant information into a structured JSON format.

The Receipt may be handwritten or printed. Pay close attention to details.

**Rules:**
- Extract the date and format it as YYYY-MM-DD.
- 'M/s' refers to the customerName.
- 'R/o' refers to the residence.
- 'Khata' is the account name for a line item.
- 'Peti' and 'Daba' are types of boxes. Extract their quantities for each line item.
- 'Kind' refers to the variety of produce.
- **You must calculate 'totalNugs' by summing up all 'peti' and 'daba' quantities from all entries.**
- If a value is not present on the receipt, you may omit the field from the JSON output unless it is required by the schema.

**Example of a handwritten receipt and its JSON output:**
*   **Receipt Details:**
    *   No: 101
    *   Date: 15/07/2024
    *   M/s: Ghulam Mohammad Lone
    *   R/o: Nadihal
    *   Item 1: Khata 'Self', Kind 'Delicious', Peti 10, Daba 5
    *   Item 2: Khata 'Fayaz', Kind 'American', Peti 20, Daba 0
    *   Freight Paid: 500
*   **Correct JSON Output:**
    *   { "no": "101", "date": "2024-07-15", "customerName": "Ghulam Mohammad Lone", "ro": "Nadihal", "entries": [ { "khata": "Self", "kind": "Delicious", "peti": 10, "daba": 5 }, { "khata": "Fayaz", "kind": "American", "peti": 20, "daba": 0 } ], "totalNugs": 35, "freightPaid": 500 }


Now, analyze the following image and produce the JSON output.

[START IMAGE]
{{media url=photoDataUri}}
[END IMAGE]`,
            output: {
                schema: ReceiptExtractOutputSchema,
            },
            config: {
                apiKey: input.apiKey,
            }
        });
        if (!output) {
            throw new Error('AI failed to extract data from the Receipt image.');
        }
        return output;
    }
);


/**
 * Takes an image of a Goods Receipt and returns a structured digital version.
 * @param input The image data as a data URI.
 * @returns A promise that resolves to the structured Receipt data.
 */
export async function extractReceiptFromImage(input: ReceiptExtractInput): Promise<ReceiptExtractOutput> {
    return await extractReceiptFlow(input);
}
