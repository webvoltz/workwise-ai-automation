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
import { runJob } from './workflows/async-job/job-runner.js';
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

async function runAsyncJobDemo(): Promise<void> {
  const alwaysTimesOutProvider = createMockProvider([
    { type: 'timeout', timeoutMs: 500 },
    { type: 'timeout', timeoutMs: 500 },
    { type: 'timeout', timeoutMs: 500 },
  ]);

  const job = await runJob(() => classifyTicket(alwaysTimesOutProvider, billingTicketText), {
    maxAttempts: 3,
    baseDelayMs: 10,
  });

  console.log('\n--- Async job with retry/failure state ---');
  console.log(`Status: ${job.status} after ${String(job.attempts)} attempt(s)`);
  console.log('Attempt log:', job.attemptLog);
  if (job.status !== 'succeeded') {
    console.log('Escalation reason:', job.error.message);
  }
}

async function main(): Promise<void> {
  console.log(`WorkWise AI automation examples (provider: ${env.LLM_PROVIDER})`);
  await runClassifierDemo();
  await runExtractionDemo();
  await runRagDemo();
  await runAsyncJobDemo();
}

await main();
