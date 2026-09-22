import { env } from '../../config/env.js';
import type { WorkflowError } from '../../shared/errors.js';
import type { Result } from '../../shared/result.js';
import { withRetry } from '../../shared/retry.js';
import type { JobAttemptRecord, JobResult } from './types.js';

export interface RunJobOptions {
  // Falls back to MAX_RETRY_ATTEMPTS from the environment when omitted.
  readonly maxAttempts?: number;
  readonly baseDelayMs: number;
  readonly sleep?: (delayMs: number) => Promise<void>;
}

// Runs a unit of work with retries, then lands it in a terminal, inspectable state: a
// non-retryable error (e.g. invalid model output) fails fast, while exhausting retries on a
// transient error (timeout, provider failure) escalates to manual_review instead of just failing.
export async function runJob<T>(
  handler: (attempt: number) => Promise<Result<T, WorkflowError>>,
  options: RunJobOptions,
): Promise<JobResult<T>> {
  const attemptLog: JobAttemptRecord[] = [];

  const trackedHandler = async (attempt: number): Promise<Result<T, WorkflowError>> => {
    const outcome = await handler(attempt);
    attemptLog.push({ attempt, outcome: outcome.ok ? 'succeeded' : outcome.error.code });
    return outcome;
  };

  const result = await withRetry(trackedHandler, {
    maxAttempts: options.maxAttempts ?? env.MAX_RETRY_ATTEMPTS,
    baseDelayMs: options.baseDelayMs,
    ...(options.sleep !== undefined ? { sleep: options.sleep } : {}),
  });

  if (result.ok) {
    return { status: 'succeeded', attempts: attemptLog.length, attemptLog, value: result.value };
  }

  switch (result.error.code) {
    case 'RETRY_EXHAUSTED':
      return {
        status: 'manual_review',
        attempts: attemptLog.length,
        attemptLog,
        error: result.error.lastError,
      };
    case 'PROVIDER_TIMEOUT':
    case 'PROVIDER_FAILURE':
    case 'INVALID_MODEL_OUTPUT':
      return { status: 'failed', attempts: attemptLog.length, attemptLog, error: result.error };
  }
}
