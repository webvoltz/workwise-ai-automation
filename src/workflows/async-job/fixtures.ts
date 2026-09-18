import {
  InvalidModelOutputError,
  ProviderFailureError,
  ProviderTimeoutError,
  type WorkflowError,
} from '../../shared/errors.js';
import { err, ok, type Result } from '../../shared/result.js';

export function createFlakyHandler<T>(
  failuresBeforeSuccess: number,
  successValue: T,
): (attempt: number) => Promise<Result<T, WorkflowError>> {
  return (attempt: number) =>
    Promise.resolve(
      attempt <= failuresBeforeSuccess
        ? err(new ProviderTimeoutError('flaky-handler', 1000))
        : ok(successValue),
    );
}

export function createAlwaysTimingOutHandler(): (
  attempt: number,
) => Promise<Result<never, WorkflowError>> {
  return () => Promise.resolve(err(new ProviderTimeoutError('flaky-handler', 1000)));
}

export function createAlwaysFailingHandler(): (
  attempt: number,
) => Promise<Result<never, WorkflowError>> {
  return () => Promise.resolve(err(new ProviderFailureError('flaky-handler', new Error('boom'))));
}

export function createInvalidOutputHandler(): (
  attempt: number,
) => Promise<Result<never, WorkflowError>> {
  return () => Promise.resolve(err(new InvalidModelOutputError('flaky-handler', ['bad output'])));
}
