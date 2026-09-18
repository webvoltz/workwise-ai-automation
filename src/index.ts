import { env } from './config/env.js';
import { createMockProvider } from './providers/mock-provider.js';
import {
  completeInvoiceScript,
  completeInvoiceText,
} from './workflows/document-extraction/fixtures.js';
import { extractInvoice } from './workflows/document-extraction/extractor.js';
import {
  refundAnswerScript,
  refundQuery,
  sampleKnowledgeBase,
} from './workflows/rag-lookup/fixtures.js';
import { ragLookup } from './workflows/rag-lookup/rag.js';
import { classifyTicket } from './workflows/ticket-classifier/classifier.js';
import {
  billingClassificationScript,
  billingTicketText,
} from './workflows/ticket-classifier/fixtures.js';

async function runClassifierDemo(): Promise<void> {
  const provider = createMockProvider(billingClassificationScript);
  const result = await classifyTicket(provider, billingTicketText);

  console.log('\n--- Support ticket classifier ---');
  console.log(`Ticket: ${billingTicketText}`);
  if (result.ok) {
    console.log('Classification:', result.value);
  } else {
    console.log('Rejected:', result.error.message);
  }
}

async function runExtractionDemo(): Promise<void> {
  const provider = createMockProvider(completeInvoiceScript);
  const result = await extractInvoice(provider, completeInvoiceText);

  console.log('\n--- Document extraction ---');
  console.log(`Document: ${completeInvoiceText}`);
  if (result.ok) {
    console.log('Extraction:', result.value);
  } else {
    console.log('Rejected:', result.error.message);
  }
}

async function runRagDemo(): Promise<void> {
  const provider = createMockProvider(refundAnswerScript);
  const result = await ragLookup(provider, sampleKnowledgeBase, refundQuery);

  console.log('\n--- RAG knowledge lookup ---');
  console.log(`Question: ${refundQuery}`);
  if (result.ok) {
    console.log('Answer:', result.value);
  } else {
    console.log('Rejected:', result.error.message);
  }
}

async function main(): Promise<void> {
  console.log(`WorkWise AI automation examples (provider: ${env.LLM_PROVIDER})`);
  await runClassifierDemo();
  await runExtractionDemo();
  await runRagDemo();
}

await main();
