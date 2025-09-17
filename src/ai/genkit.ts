
import {genkit, Plugin, durableFlow} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const MockFlow: durableFlow<any, any, any> = (name, fn) => {
  return fn;
}

const mockPlugin: Plugin<any> = {
  name: 'mock',
  flow: (name, schema, fn) => {
    return fn;
  },
  prompt: (name, prompt, options) => {
    return (input) => {
      return {
        output: async () => 'mock output',
        usage: async () => ({
          inputCharacters: 1,
          outputCharacters: 1,
        }),
      }
    }
  }
};

export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracing: true,
});
