
'use server';
/**
 * @fileOverview An AI flow to categorize pesticide and fertilizer products.
 *
 * - categorizePesticide - a function that suggests a category for a given product name.
 */

import { categorizePesticideFlow } from '@/ai/genkit';
import type { PesticideCategoryInput, PesticideCategoryOutput } from '@/ai/schemas/pesticide-category-schemas';

export async function categorizePesticide(input: PesticideCategoryInput): Promise<PesticideCategoryOutput> {
    return categorizePesticideFlow(input);
}
