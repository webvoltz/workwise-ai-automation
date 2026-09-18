import { ProviderFailureError, ProviderTimeoutError } from '../shared/errors.js';
import { err, ok } from '../shared/result.js';
import type { CompletionResponse, LlmProvider } from './types.js';

export type MockScriptEntry =
  | { readonly type: 'text'; readonly text: string; readonly model?: string }
  | { readonly type: 'timeout'; readonly timeoutMs?: number }
  | { readonly type: 'failure'; readonly message?: string };

export interface MockProviderOptions {
  readonly name?: string;
  readonly defaultModel?: string;
}

// Deterministic offline provider: responses are consumed in order from `script`.
export function createMockProvider(
  script: readonly MockScriptEntry[],
  options: MockProviderOptions = {},
): LlmProvider {
  const name = options.name ?? 'mock';
  const defaultModel = options.defaultModel ?? 'mock-1';
  const queue = [...script];
  let callCount = 0;

  return {
    name,
    complete() {
      callCount += 1;
      const entry = queue.shift();

      if (entry === undefined) {
        return Promise.resolve(
          err(
            new ProviderFailureError(
              name,
              new Error(`mock provider script exhausted after ${String(callCount)} call(s)`),
            ),
          ),
        );
      }

      switch (entry.type) {
        case 'text':
          return Promise.resolve(
            ok<CompletionResponse>({ text: entry.text, model: entry.model ?? defaultModel }),
          );
        case 'timeout':
          return Promise.resolve(err(new ProviderTimeoutError(name, entry.timeoutMs ?? 10_000)));
        case 'failure':
          return Promise.resolve(
            err(
              new ProviderFailureError(name, new Error(entry.message ?? 'mock provider failure')),
            ),
          );
      }
    },
  };
}
