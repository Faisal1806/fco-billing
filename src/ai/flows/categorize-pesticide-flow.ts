
'use server';

/**
 * @fileOverview A flow to categorize pesticides and fertilizers.
 * - categorizePesticide - A function that categorizes a product name.
 * - CategorizePesticideInput - The input type for the flow.
 * - CategorizePesticideOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for the flow
export const CategorizePesticideInputSchema = z.object({
  pesticideName: z.string().describe('The name of the pesticide or fertilizer product.'),
});
export type CategorizePesticideInput = z.infer<typeof CategorizePesticideInputSchema>;

// Define the output schema for the flow, with specific categories
export const CategorizePesticideOutputSchema = z.object({
  category: z.enum(['Fungicide', 'Insecticide', 'Herbicide', 'Fertilizer', 'Other'])
    .describe('The category of the product.'),
});
export type CategorizePesticideOutput = z.infer<typeof CategorizePesticideOutputSchema>;

// Exported wrapper function to be called from client components
export async function categorizePesticide(input: CategorizePesticideInput): Promise<CategorizePesticideOutput> {
  return categorizePesticideFlow(input);
}

// Define the Genkit prompt
const categorizePesticidePrompt = ai.definePrompt({
  name: 'categorizePesticidePrompt',
  input: { schema: CategorizePesticideInputSchema },
  output: { schema: CategorizePesticideOutputSchema },
  prompt: `
    You are an agricultural supplies expert. Your task is to categorize the given product name into one of the following categories: Fungicide, Insecticide, Herbicide, Fertilizer, or Other.

    Analyze the product name: {{{pesticideName}}}

    Based on your knowledge, determine the correct category and provide it in the specified output format.
  `,
});

// Define the Genkit flow
const categorizePesticideFlow = ai.defineFlow(
  {
    name: 'categorizePesticideFlow',
    inputSchema: CategorizePesticideInputSchema,
    outputSchema: CategorizePesticideOutputSchema,
  },
  async (input) => {
    const { output } = await categorizePesticidePrompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the categorization model.');
    }
    return output;
  }
);
