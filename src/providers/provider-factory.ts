import { env } from '../config/env.js';
import { createMockProvider, type MockScriptEntry } from './mock-provider.js';
import { createOpenAiProvider } from './openai-provider.js';
import type { LlmProvider } from './types.js';

// Flips a workflow between the offline mock and the real OpenAI API via LLM_PROVIDER alone.
export function createProviderFromEnv(mockScript: readonly MockScriptEntry[]): LlmProvider {
  switch (env.LLM_PROVIDER) {
    case 'mock':
      return createMockProvider(mockScript);
    case 'openai':
      return createOpenAiProvider({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        timeoutMs: env.PROVIDER_TIMEOUT_MS,
      });
  }
}
