
'use server';
/**
 * @fileOverview An AI flow to categorize pesticide and fertilizer products.
 *
 * - categorizePesticide - A function that suggests a category for a given product name.
 * - PesticideCategoryInput - The input type for the flow.
 * - PesticideCategoryOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PesticideCategoryInputSchema = z.object({
  name: z.string().describe('The name of the pesticide or fertilizer product.'),
});
export type PesticideCategoryInput = z.infer<typeof PesticideCategoryInputSchema>;

const PesticideCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the product. Should be one of: Fungicide, Insecticide, Herbicide, Fertilizer, Plant Growth Regulator, or Other.'),
});
export type PesticideCategoryOutput = z.infer<typeof PesticideCategoryOutputSchema>;

const categorizePesticidePrompt = ai.definePrompt({
  name: 'categorizePesticidePrompt',
  input: {schema: z.object({name: z.string()})},
  output: {schema: PesticideCategoryOutputSchema},
  prompt: `You are an expert in agricultural products. Your task is to categorize the given product name into one of the following categories: Fungicide, Insecticide, Herbicide, Fertilizer, Plant Growth Regulator, or Other.

Product Name: {{{name}}}`,
});

const categorizePesticideFlow = ai.defineFlow(
    {
        name: 'categorizePesticideFlow',
        inputSchema: PesticideCategoryInputSchema,
        outputSchema: PesticideCategoryOutputSchema,
    },
    async (input) => {
        const {output} = await ai.generate({
            model: 'gemini-pro',
            prompt: `You are an expert in agricultural products. Your task is to categorize the given product name into one of the following categories: Fungicide, Insecticide, Herbicide, Fertilizer, Plant Growth Regulator, or Other.

Product Name: ${input.name}`,
            output: {
                schema: PesticideCategoryOutputSchema,
            },
        });
        if (!output) {
            throw new Error('AI failed to categorize the product.');
        }
        return output;
    }
);


export async function categorizePesticide(input: PesticideCategoryInput): Promise<PesticideCategoryOutput> {
    return await categorizePesticideFlow(input);
}
