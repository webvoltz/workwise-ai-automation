import { afterEach, describe, expect, it, vi } from 'vitest';

const genericMessage = 'Invalid service configuration.';

interface EnvironmentOverrides {
  llmProvider?: string;
  openAiApiKey?: string;
  providerTimeoutMs?: string;
  maxRetryAttempts?: string;
}

async function loadEnvironment(overrides: EnvironmentOverrides = {}) {
  vi.stubEnv('NODE_ENV', 'test');
  if (overrides.llmProvider !== undefined) {
    vi.stubEnv('LLM_PROVIDER', overrides.llmProvider);
  }
  if (overrides.openAiApiKey !== undefined) {
    vi.stubEnv('OPENAI_API_KEY', overrides.openAiApiKey);
  }
  if (overrides.providerTimeoutMs !== undefined) {
    vi.stubEnv('PROVIDER_TIMEOUT_MS', overrides.providerTimeoutMs);
  }
  if (overrides.maxRetryAttempts !== undefined) {
    vi.stubEnv('MAX_RETRY_ATTEMPTS', overrides.maxRetryAttempts);
  }
  vi.resetModules();

  return import('./env.js');
}

async function captureConfigurationError(overrides: EnvironmentOverrides): Promise<Error> {
  try {
    await loadEnvironment(overrides);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return error;
    }

    throw new Error('Environment validation threw a non-Error value.');
  }

  throw new Error('Environment validation unexpectedly succeeded.');
}

describe('WorkWise AI environment validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to the mock provider with sane fallback values', async () => {
    const { env } = await loadEnvironment();

    expect(env).toEqual({
      NODE_ENV: 'test',
      LLM_PROVIDER: 'mock',
      OPENAI_MODEL: 'gpt-4o-mini',
      PROVIDER_TIMEOUT_MS: 10_000,
      MAX_RETRY_ATTEMPTS: 3,
    });
  });

  it('ignores a blank OPENAI_API_KEY while the provider stays "mock"', async () => {
    const { env } = await loadEnvironment({ openAiApiKey: '' });

    expect(env.LLM_PROVIDER).toBe('mock');
  });

  it('accepts the openai provider once an API key is supplied', async () => {
    const { env } = await loadEnvironment({
      llmProvider: 'openai',
      openAiApiKey: 'sk-test-key',
    });

    expect(env.LLM_PROVIDER).toBe('openai');
    if (env.LLM_PROVIDER === 'openai') {
      expect(env.OPENAI_API_KEY).toBe('sk-test-key');
    }
  });

  it('rejects the openai provider when no API key is supplied', async () => {
    const error = await captureConfigurationError({ llmProvider: 'openai' });

    expect(error.message).toBe(genericMessage);
  });

  it('rejects the openai provider when the API key is blank', async () => {
    const error = await captureConfigurationError({ llmProvider: 'openai', openAiApiKey: '' });

    expect(error.message).toBe(genericMessage);
  });

  it('rejects an unknown LLM_PROVIDER value', async () => {
    const error = await captureConfigurationError({ llmProvider: 'anthropic' });

    expect(error.message).toBe(genericMessage);
  });

  it.each(['0', 'not-a-number'])('rejects an invalid PROVIDER_TIMEOUT_MS of %s', async (value) => {
    const error = await captureConfigurationError({ providerTimeoutMs: value });

    expect(error.message).toBe(genericMessage);
  });

  it.each(['0', 'not-a-number'])('rejects an invalid MAX_RETRY_ATTEMPTS of %s', async (value) => {
    const error = await captureConfigurationError({ maxRetryAttempts: value });

    expect(error.message).toBe(genericMessage);
  });
});
