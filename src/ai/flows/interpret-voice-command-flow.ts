
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
            prompt: `You are an assistant for a fruit commission agent. Your task is to interpret a transcribed voice command and extract structured data to create an invoice.

The user will provide a command to add items to an invoice. Extract the customer name (if provided) and a list of all items.
Each item must have a type ('Patti' or 'Dabba'), quantity, variety, and rate.

Here are some examples:
- "Add 10 patti of American A2 at 1200 and 20 dabba of Red Delicious at 800 for customer Mohammad Shabaan." -> Should result in 2 items and a customerName.
- "25 dabba Italy at 1500" -> Should result in 1 item.
- "Customer is Sameer Lone. Add 50 patti Kullu at 1000." -> Should result in 1 item and a customerName.

User's voice command transcript:
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
