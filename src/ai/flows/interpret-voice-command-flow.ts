
'use server';
/**
 * @fileOverview An AI flow to interpret natural language voice commands for creating an invoice.
 *
 * - interpretVoiceCommand - A function that takes a text transcript and returns structured invoice data.
 * - VoiceCommandInput - The input type for the flow.
 * - VoiceCommandOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceCommandInputSchema = z.object({
  command: z.string().describe('The transcribed voice command from the user.'),
  apiKey: z.string().optional().describe('The Gemini API Key'),
});
export type VoiceCommandInput = z.infer<typeof VoiceCommandInputSchema>;


const InvoiceItemSchema = z.object({
    type: z.enum(['Patti', 'Dabba']).describe("The type of the item, either 'Patti' or 'Dabba'."),
    qty: z.number().describe('The quantity of the item.'),
    variety: z.string().describe('The variety or description of the item.'),
    rate: z.number().describe('The rate per item.'),
});

const VoiceCommandOutputSchema = z.object({
  customerName: z.string().optional().describe("The customer's name if mentioned in the command."),
  items: z.array(InvoiceItemSchema).describe('An array of invoice items extracted from the command.'),
});
export type VoiceCommandOutput = z.infer<typeof VoiceCommandOutputSchema>;


const interpretVoiceCommandFlow = ai.defineFlow(
    {
        name: 'interpretVoiceCommandFlow',
        inputSchema: VoiceCommandInputSchema,
        outputSchema: VoiceCommandOutputSchema,
    },
    async (input) => {
        const {output} = await ai.generate({
            model: 'gemini-pro',
            prompt: `You are an expert assistant for a fruit commission agent in Kashmir. Your task is to interpret a transcribed voice command and extract structured data to create an invoice. The user may speak casually.

The user will provide a command to add items to an invoice. Extract the customer name (if provided) and a list of all items. Each item must have a type ('Patti' or 'Dabba'), quantity, variety, and rate.

**Rules:**
- "patti", "peti", or "patty" should be interpreted as type 'Patti'.
- "dabba" or "box" should be interpreted as type 'Dabba'.
- If a customer name is mentioned with phrases like "for customer", "customer is", "party name", or is mentioned at the beginning or end of a command, extract it. The customer name will likely be a person's name common in Kashmir.
- The item variety might be a mix of English and local terms (e.g., "American A2", "Kullu", "Delicious").
- Extract all items mentioned in a single command.

**Examples of commands and their correct JSON output:**
1.  **Command:** "Add 10 patti of American A2 at 1200 and 20 dabba of Red Delicious at 800 for customer Mohammad Shabaan."
    **Output:** {"customerName": "Mohammad Shabaan", "items": [{"type": "Patti", "qty": 10, "variety": "American A2", "rate": 1200}, {"type": "Dabba", "qty": 20, "variety": "Red Delicious", "rate": 800}]}
2.  **Command:** "25 dabba Italy at 1500"
    **Output:** {"items": [{"type": "Dabba", "qty": 25, "variety": "Italy", "rate": 1500}]}
3.  **Command:** "Customer is Sameer Lone. Add 50 patti Kullu at 1000."
    **Output:** {"customerName": "Sameer Lone", "items": [{"type": "Patti", "qty": 50, "variety": "Kullu", "rate": 1000}]}
4.  **Command:** "5 peti American at 1100"
    **Output:** {"items": [{"type": "Patti", "qty": 5, "variety": "American", "rate": 1100}]}
5.  **Command:** "Okay add two items first is 100 box of delicious rate 950 and second is 50 patti of kullu at 1100 party name is Fayaz Ahmad"
    **Output:** {"customerName": "Fayaz Ahmad", "items": [{"type": "Dabba", "qty": 100, "variety": "Delicious", "rate": 950}, {"type": "Patti", "qty": 50, "variety": "Kullu", "rate": 1100}]}

Now, analyze the following user's voice command transcript and produce the JSON output.
Transcript:
"${input.command}"`,
            output: {
                schema: VoiceCommandOutputSchema,
            },
            config: {
                apiKey: input.apiKey,
            }
        });
        if (!output) {
            throw new Error('AI failed to interpret the voice command.');
        }
        return output;
    }
);

/**
 * Takes a transcribed voice command and returns structured invoice data.
 * @param input The voice command as a string.
 * @returns A promise that resolves to the structured invoice data.
 */
export async function interpretVoiceCommand(input: VoiceCommandInput): Promise<VoiceCommandOutput> {
    return await interpretVoiceCommandFlow(input);
}
