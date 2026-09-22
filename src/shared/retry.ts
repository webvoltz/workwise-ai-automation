import { RetryExhaustedError, type WorkflowError } from './errors.js';
import { err, type Result } from './result.js';

export interface RetryOptions {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly sleep?: (delayMs: number) => Promise<void>;
}

// The subset of RetryOptions a workflow exposes to its caller: maxAttempts/baseDelayMs, both
// optional so a single call (the default) doesn't require thinking about retry at all.
export interface WorkflowRetryOptions {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
}

const defaultSleep = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

export async function withRetry<T, E extends WorkflowError>(
  operation: (attempt: number) => Promise<Result<T, E>>,
  options: RetryOptions,
): Promise<Result<T, E | RetryExhaustedError>> {
  if (options.maxAttempts < 1) {
    throw new Error('withRetry requires maxAttempts to be at least 1.');
  }

  const sleep = options.sleep ?? defaultSleep;
  let lastError: E | undefined;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    const result = await operation(attempt);
    if (result.ok) {
      return result;
    }

    lastError = result.error;
    if (!result.error.retryable || attempt === options.maxAttempts) {
      break;
    }

    await sleep(options.baseDelayMs * attempt);
  }

  /* v8 ignore start -- unreachable: the maxAttempts guard above ensures the loop runs at least once */
  if (lastError === undefined) {
    throw new Error('withRetry exited its attempt loop without recording an error.');
  }
  /* v8 ignore stop */

  // maxAttempts of 1 never actually retried, so return the original error unwrapped.
  if (!lastError.retryable || options.maxAttempts === 1) {
    return err(lastError);
  }

  return err(new RetryExhaustedError(options.maxAttempts, lastError));
}
