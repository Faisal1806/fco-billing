
'use server';
/**
 * @fileOverview An AI flow to categorize pesticide and fertilizer products.
 *
 * - categorizePesticide - a function that suggests a category for a given product name.
 */

import {ai} from '@/ai/genkit';
import { PesticideCategoryInput, PesticideCategoryInputSchema, PesticideCategoryOutput, PesticideCategoryOutputSchema } from '@/ai/schemas/pesticide-category-schemas';

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
            config: {
                apiKey: input.apiKey,
            }
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
