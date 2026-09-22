import { z } from 'zod';

import { ProviderFailureError, ProviderTimeoutError } from '../shared/errors.js';
import { err, ok } from '../shared/result.js';
import type { CompletionRequest, CompletionResponse, LlmProvider } from './types.js';

export interface OpenAiProviderOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly timeoutMs: number;
  readonly baseUrl?: string;
}

const openAiChatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
});

const DEFAULT_BASE_URL = 'https://api.openai.com/v1/chat/completions';

// 408/429/5xx are transient (timeout, rate limit, server trouble) and worth retrying. Everything
// else (400, 401, 404, ...) is a permanent problem with the request itself - retrying just repeats it.
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

// Optional real-provider path: only exercised when LLM_PROVIDER=openai and OPENAI_API_KEY is set.
export function createOpenAiProvider(options: OpenAiProviderOptions): LlmProvider {
  const name = 'openai';
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  return {
    name,
    async complete(request: CompletionRequest) {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, options.timeoutMs);

      try {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.apiKey}`,
          },
          body: JSON.stringify({
            model: options.model,
            messages: [
              { role: 'system', content: request.system },
              { role: 'user', content: request.prompt },
            ],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return err(
            new ProviderFailureError(
              name,
              new Error(`OpenAI request failed with status ${String(response.status)}`),
              { retryable: isRetryableStatus(response.status) },
            ),
          );
        }

        const payload = await response.json();
        const parsed = openAiChatCompletionSchema.safeParse(payload);
        if (!parsed.success) {
          // A 2xx response in a shape we don't recognize is a permanent integration mismatch, not
          // a transient failure - retrying gets the same unexpected shape again.
          return err(
            new ProviderFailureError(name, new Error('OpenAI response shape was unexpected.'), {
              retryable: false,
            }),
          );
        }

        const [firstChoice] = parsed.data.choices;
        /* v8 ignore start -- schema's .min(1) already guarantees this at runtime */
        if (firstChoice === undefined) {
          return err(
            new ProviderFailureError(name, new Error('OpenAI response contained no choices.')),
          );
        }
        /* v8 ignore stop */

        return ok<CompletionResponse>({ text: firstChoice.message.content, model: options.model });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return err(new ProviderTimeoutError(name, options.timeoutMs));
        }

        return err(new ProviderFailureError(name, error));
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
