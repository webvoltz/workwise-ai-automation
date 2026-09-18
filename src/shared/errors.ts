export type WorkflowErrorCode =
  'PROVIDER_TIMEOUT' | 'PROVIDER_FAILURE' | 'INVALID_MODEL_OUTPUT' | 'RETRY_EXHAUSTED';

abstract class BaseWorkflowError extends Error {
  abstract readonly code: WorkflowErrorCode;
  abstract readonly retryable: boolean;
}

export class ProviderTimeoutError extends BaseWorkflowError {
  readonly code = 'PROVIDER_TIMEOUT' as const;
  readonly retryable = true;

  constructor(providerName: string, timeoutMs: number) {
    super(`${providerName} timed out after ${String(timeoutMs)}ms.`);
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderFailureError extends BaseWorkflowError {
  readonly code = 'PROVIDER_FAILURE' as const;
  readonly retryable = true;

  constructor(providerName: string, cause: unknown) {
    super(`${providerName} failed to produce a completion.`, { cause });
    this.name = 'ProviderFailureError';
  }
}

export class InvalidModelOutputError extends BaseWorkflowError {
  readonly code = 'INVALID_MODEL_OUTPUT' as const;
  // Not retried: providers are deterministic here, so replaying the same request just fails the same way.
  readonly retryable = false;
  readonly issues: readonly string[];

  constructor(workflowName: string, issues: readonly string[]) {
    super(`${workflowName} produced output that failed schema validation: ${issues.join('; ')}`);
    this.name = 'InvalidModelOutputError';
    this.issues = issues;
  }
}

export class RetryExhaustedError extends BaseWorkflowError {
  readonly code = 'RETRY_EXHAUSTED' as const;
  readonly retryable = false;
  readonly attempts: number;
  readonly lastError: WorkflowError;

  constructor(attempts: number, lastError: WorkflowError) {
    super(`Exhausted ${String(attempts)} attempt(s). Last error: ${lastError.message}`);
    this.name = 'RetryExhaustedError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export type WorkflowError =
  ProviderTimeoutError | ProviderFailureError | InvalidModelOutputError | RetryExhaustedError;
