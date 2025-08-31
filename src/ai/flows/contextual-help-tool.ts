'use server';
/**
 * @fileOverview A contextual help tool AI agent.
 *
 * - getContextualHelp - A function that provides contextual help within the app.
 * - ContextualHelpInput - The input type for the getContextualHelp function.
 * - ContextualHelpOutput - The return type for the getContextualHelp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ContextualHelpInputSchema = z.object({
  context: z.string().describe('The current context or situation within the app.'),
  userQuery: z.string().describe('The user query or action they are trying to perform.'),
});
export type ContextualHelpInput = z.infer<typeof ContextualHelpInputSchema>;

const ContextualHelpOutputSchema = z.object({
  advice: z.string().describe('The advice and guidance provided to the user.'),
});
export type ContextualHelpOutput = z.infer<typeof ContextualHelpOutputSchema>;

export async function getContextualHelp(input: ContextualHelpInput): Promise<ContextualHelpOutput> {
  return contextualHelpFlow(input);
}

const contextualHelpFlow = ai.defineFlow(
  {
    name: 'contextualHelpFlow',
    inputSchema: ContextualHelpInputSchema,
    outputSchema: ContextualHelpOutputSchema,
  },
  async input => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-pro',
      prompt: `You are a helpful assistant providing guidance to users of the SwiftSale application.

      Based on the current context and the user's query, provide relevant advice and instructions to help them effectively use the system.
    
      Context: ${input.context}
      User Query: ${input.userQuery}
    
      Advice:`,
      output: {
        schema: ContextualHelpOutputSchema,
      }
    });

    return output!;
  }
);
