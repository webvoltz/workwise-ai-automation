import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadFactory(envOverrides: Record<string, string> = {}) {
  vi.stubEnv('NODE_ENV', 'test');
  for (const [key, value] of Object.entries(envOverrides)) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();

  return import('./provider-factory.js');
}

describe('createProviderFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('builds a mock provider by default', async () => {
    const { createProviderFromEnv } = await loadFactory();

    const provider = createProviderFromEnv([{ type: 'text', text: 'hi' }]);

    expect(provider.name).toBe('mock');
  });

  it('builds an openai provider once configured via env vars', async () => {
    const { createProviderFromEnv } = await loadFactory({
      LLM_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
    });

    const provider = createProviderFromEnv([]);

    expect(provider.name).toBe('openai');
  });
});
