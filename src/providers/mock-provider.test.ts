import { describe, expect, it } from 'vitest';

import { createMockProvider } from './mock-provider.js';

const noopRequest = { system: 'system', prompt: 'prompt' };

describe('createMockProvider', () => {
  it('replays scripted text responses in order', async () => {
    const provider = createMockProvider([
      { type: 'text', text: 'first' },
      { type: 'text', text: 'second', model: 'mock-2' },
    ]);

    const first = await provider.complete(noopRequest);
    const second = await provider.complete(noopRequest);

    expect(first).toEqual({ ok: true, value: { text: 'first', model: 'mock-1' } });
    expect(second).toEqual({ ok: true, value: { text: 'second', model: 'mock-2' } });
  });

  it('returns a ProviderTimeoutError for a scripted timeout', async () => {
    const provider = createMockProvider([{ type: 'timeout', timeoutMs: 5000 }]);

    const result = await provider.complete(noopRequest);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_TIMEOUT');
      expect(result.error.message).toContain('5000');
    }
  });

  it('returns a ProviderFailureError for a scripted failure', async () => {
    const provider = createMockProvider([{ type: 'failure', message: 'boom' }]);

    const result = await provider.complete(noopRequest);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_FAILURE');
    }
  });

  it('returns a ProviderFailureError once the script is exhausted', async () => {
    const provider = createMockProvider([{ type: 'text', text: 'only-one' }]);

    await provider.complete(noopRequest);
    const result = await provider.complete(noopRequest);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_FAILURE');
      expect(result.error.cause).toBeInstanceOf(Error);
      if (result.error.cause instanceof Error) {
        expect(result.error.cause.message).toContain('exhausted');
      }
    }
  });

  it('honors a custom provider name', () => {
    const provider = createMockProvider([{ type: 'text', text: 'hi' }], { name: 'custom-mock' });

    expect(provider.name).toBe('custom-mock');
  });
});
