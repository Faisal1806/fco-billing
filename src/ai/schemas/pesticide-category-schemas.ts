
/**
 * @fileOverview Schemas and types for the pesticide categorization AI flow.
 *
 * - PesticideCategoryInputSchema, PesticideCategoryInput - The input type for the flow.
 * - PesticideCategoryOutputSchema, PesticideCategoryOutput - The return type for the flow.
 */
import { z } from 'zod';

export const PesticideCategoryInputSchema = z.object({
  name: z.string().describe('The name of the pesticide or fertilizer product.'),
  apiKey: z.string().optional().describe('The Gemini API Key'),
});
export type PesticideCategoryInput = z.infer<typeof PesticideCategoryInputSchema>;

export const PesticideCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the product. Should be one of: Fungicide, Insecticide, Herbicide, Fertilizer, Plant Growth Regulator, or Other.'),
});
export type PesticideCategoryOutput = z.infer<typeof PesticideCategoryOutputSchema>;
