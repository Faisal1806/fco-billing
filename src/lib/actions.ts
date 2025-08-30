'use server';

import { getContextualHelp, type ContextualHelpInput } from '@/ai/flows/contextual-help-tool';
import { z } from 'zod';

const ActionInputSchema = z.object({
  context: z.string(),
  userQuery: z.string().min(5, { message: 'Query must be at least 5 characters long.' }),
});

export async function getContextualHelpAction(
  prevState: { advice: string; error?: string } | null,
  formData: FormData
) {
  const validatedFields = ActionInputSchema.safeParse({
    context: formData.get('context'),
    userQuery: formData.get('userQuery'),
  });

  if (!validatedFields.success) {
    return {
      advice: '',
      error: validatedFields.error.flatten().fieldErrors.userQuery?.join(', ') ?? 'Invalid input.',
    };
  }

  try {
    const input: ContextualHelpInput = {
      context: validatedFields.data.context,
      userQuery: validatedFields.data.userQuery,
    };
    const result = await getContextualHelp(input);
    return { advice: result.advice, error: '' };
  } catch (e) {
    return { advice: '', error: 'Sorry, I was unable to get help for you. Please try again.' };
  }
}
