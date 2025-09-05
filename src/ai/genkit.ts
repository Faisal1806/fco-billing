
'use server';

/**
 * @fileoverview This file initializes the Genkit AI toolkit and configures the Google AI plugin.
 * It exports a singleton `ai` object that should be used for all AI-related operations
 * in the application, such as defining flows, prompts, and tools.
 */

import { genkit } from '@genkit-ai/ai';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from 'genkitx-firebase';

// Initialize Genkit with the Google AI plugin and Firebase plugin for production environment.
export const ai = genkit({
  plugins: [
    firebase(), // Use Firebase for auth, flow state, and trace storage in production.
    googleAI(), // Use the Google AI plugin for generative models.
  ],
  // Log to the console in non-production environments.
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  // Store flow state and traces in-memory in non-production environments.
  flowStateStore: process.env.NODE_ENV === 'production' ? undefined : 'memory',
  traceStore: process.env.NODE_ENV === 'production' ? undefined : 'memory',
});
