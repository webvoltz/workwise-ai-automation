import type { ProviderFailureError, ProviderTimeoutError } from '../shared/errors.js';
import type { Result } from '../shared/result.js';

export interface CompletionRequest {
  readonly system: string;
  readonly prompt: string;
}

export interface CompletionResponse {
  readonly text: string;
  readonly model: string;
}

export interface LlmProvider {
  readonly name: string;
  complete(
    request: CompletionRequest,
  ): Promise<Result<CompletionResponse, ProviderTimeoutError | ProviderFailureError>>;
}
