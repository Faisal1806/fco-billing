
import { genkit, type Genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { SmartSearchInputSchema, SmartSearchOutputSchema } from './schemas/smart-search-schemas';
import { PesticideCategoryInputSchema, PesticideCategoryOutputSchema } from './schemas/pesticide-category-schemas';

// Initialize Genkit with the Google AI plugin using the latest model generation (Gemini 3)
export const ai: Genkit = genkit({
  plugins: [
    googleAI(),
  ],
  model: googleAI.model('gemini-3-flash-preview'),
});

// Schemas for Smart Search
const collectionsSchema = `
Here are the available data collections and their queryable fields:

- **invoices** (also called wataks, sales, or bills)
  - Fields: sNo (string), date (string, YYYY-MM-DD), customerName (string), watakNo (string), freight (number), totals.pattiQty (number), totals.dabbaQty (number), totals.grossSale (number), totals.netSale (number)

- **purchases**
  - Fields: billNo (string), date (string, YYYY-MM-DD), growerName (string), purchaseFor (string, "Customer" or "Own Stock (F.Co)"), totals.grandTotal (number)

- **receipts** (also called goods receipts)
  - Fields: no (string), date (string, YYYY-MM-DD), customerName (string), totalNugs (number)

- **challans** (also called delivery notes)
  - Fields: challanNo (string), date (string, YYYY-MM-DD), toMs (string), vehicleNo (string), driverName (string), totalPetti (number), totalDabba (number)

- **products**
  - Fields: name (string), category (string), stock (number), supplier (string)

- **parties** (Growers, Customers, etc.)
  - Fields: name (string), type (string, "Grower", "Customer", "Both", etc.), address (string), phone (string)

- **expenses**
  - Fields: date (string, YYYY-MM-DD), category (string), description (string), amount (number), partyName (string)

- **advances** (Payments/Loans)
  - Fields: date (string, YYYY-MM-DD), partyName (string), type (string, "Advance Given" or "Repayment Received"), amount (number)

- **cold_storage**
  - Fields: dateIn (string, YYYY-MM-DD), grower (string), item (string), chamberNo (string), currentQty (number), status (string, "In Stock" or "Released")
  
- **bikris** (Outside Sales)
    - Fields: bikriNo (string), date (string, YYYY-MM-DD), market (string), growerName (string), bikriType (string, "fcoStock" or "growerForwarding"), calculation.netProfitOrLoss (number), calculation.netSalePayableToGrower (number)

- **statements** (Manual Grower Statements)
    - Fields: sNo (string), partyName (string), statementDate (string, YYYY-MM-DD), finalBalance (number)
`;

// Define Prompts
const smartSearchPrompt = ai.definePrompt(
    {
        name: 'smartSearchPrompt',
        input: { schema: SmartSearchInputSchema },
        output: { schema: SmartSearchOutputSchema },
        prompt: `You are an expert at converting natural language queries into structured data filters for the F.Co Billing OS.
    The user wants to search their business data. Your task is to determine the correct data collection and construct a set of filters based on their query.

    Today's date is ${new Date().toISOString().split('T')[0]}.

    ${collectionsSchema}

    - Follow-up context: Use the history provided to understand what "they", "it", or specific names mentioned previously refer to.
    - Date Conversion: Convert relative terms like "today", "last week", "this month" into specific YYYY-MM-DD dates or date ranges.
    - Aggregation: If the user asks for "total", "sum", "grand total", "average", or "how many", use the 'aggregation' field.
    - Actions: If the user asks for data "in pdf form", "as a report", or "to print", set 'action' to 'export_pdf'.
    - For queries like "show me sales", default to the 'invoices' collection.
    - For queries about profit or loss from outside sales, use the 'bikris' collection.
    - For queries about manual ledger statements, use the 'statements' collection.
    - For "top N" or "bottom N" queries, add a 'limit' and 'sort' property to the output.
    - The 'sort' field should have 'field' and 'direction' ('asc' or 'desc').
    - If searching for a person by name, use the 'contains' operator on the appropriate name field.
    - Do not invent fields. Only use the fields listed in the schemas.

    Conversation History:
    {{#each history}}
    {{role}}: {{content}}
    {{/each}}

    User Query: "{{query}}"`,
    }
);

const categorizePesticidePrompt = ai.definePrompt(
    {
        name: 'categorizePesticidePrompt',
        input: { schema: PesticideCategoryInputSchema },
        output: { schema: PesticideCategoryOutputSchema },
        prompt: `You are an expert in agricultural products. Your task is to categorize the given product name into one of the following categories: Fungicide, Insecticide, Herbicide, Fertilizer, Plant Growth Regulator, or Other.

Product Name: {{{name}}}`,
    },
);


// Define Flows
export const smartSearchFlow = ai.defineFlow(
  {
    name: 'smartSearchFlow',
    inputSchema: SmartSearchInputSchema,
    outputSchema: SmartSearchOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await smartSearchPrompt(input);

      if (!output) {
        return { collection: 'invoices', filters: [], error: 'The AI could not process the query. Please try rephrasing.' };
      }
      return output;
    } catch (e: any) {
      console.error("Error in AI prompt execution:", e);
      return { collection: 'invoices', filters: [], error: `AI model failed to respond: ${e.message || 'Please check your API key and model availability.'}` };
    }
  }
);


export const categorizePesticideFlow = ai.defineFlow(
    {
        name: 'categorizePesticideFlow',
        inputSchema: PesticideCategoryInputSchema,
        outputSchema: PesticideCategoryOutputSchema,
    },
    async (input) => {
        const { output } = await categorizePesticidePrompt(input);
        if (!output) {
            throw new Error('AI failed to categorize the product.');
        }
        return output;
    }
);
