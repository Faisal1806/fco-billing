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

    MANDATORY RULES:
    1. ACTION: If the user mentions "PDF", "report", "document", "file", "download", or "print", you MUST set the 'action' field to 'export_pdf'.
    2. AGGREGATION: If the user asks for "total", "sum", "grand total", "add these up", "average", or "how many", you MUST use the 'aggregation' field.
    3. FIELD MAPPING for Total/Sum (CRITICAL):
       - 'invoices': Use 'totals.netSale'
       - 'purchases': Use 'totals.grandTotal'
       - 'statements': Use 'finalBalance'
       - 'advances': Use 'amount'
       - 'expenses': Use 'amount'
       - 'bikris': Use 'calculation.netSalePayableToGrower' or 'calculation.netProfitOrLoss'
    4. CONTEXT: Use the provided history to maintain filters. If the user first asks for a grower's invoices and then asks "what is the total?", carry over the grower name filter.
    5. NAMES: If searching for a person, use the 'contains' operator on the name field.

    EXAMPLES:
    User: "Show all wataks of AB. Majeed Lone S/P"
    Assistant: {"collection": "invoices", "filters": [{"field": "customerName", "operator": "contains", "value": "AB. Majeed Lone S/P"}], "action": "view"}

    User: "Now add all these in grand total"
    Assistant: {"collection": "invoices", "filters": [{"field": "customerName", "operator": "contains", "value": "AB. Majeed Lone S/P"}], "aggregation": {"field": "totals.netSale", "type": "sum"}}

    User: "Download all wataks of Faisal in pdf form"
    Assistant: {"collection": "invoices", "filters": [{"field": "customerName", "operator": "contains", "value": "Faisal"}], "action": "export_pdf"}

    User Query: "{{query}}"
    
    Conversation History:
    {{#each history}}
    {{role}}: {{content}}
    {{/each}}`,
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