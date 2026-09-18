import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOpenAiProvider } from './openai-provider.js';

const request = { system: 'system', prompt: 'prompt' };
const baseOptions = { apiKey: 'sk-test', model: 'gpt-test', timeoutMs: 1000 };

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('createOpenAiProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a successful chat completion', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(200, { choices: [{ message: { content: 'hello there' } }] }),
        ),
    );

    const provider = createOpenAiProvider(baseOptions);
    const result = await provider.complete(request);

    expect(result).toEqual({ ok: true, value: { text: 'hello there', model: 'gpt-test' } });
  });

  it('maps a non-2xx response to a ProviderFailureError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, {})));

    const provider = createOpenAiProvider(baseOptions);
    const result = await provider.complete(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_FAILURE');
    }
  });

  it('maps an unexpected response shape to a ProviderFailureError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { unexpected: true })));

    const provider = createOpenAiProvider(baseOptions);
    const result = await provider.complete(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_FAILURE');
    }
  });

  it('maps an aborted request to a ProviderTimeoutError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: { signal?: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted.');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        });
      }),
    );

    const provider = createOpenAiProvider({ ...baseOptions, timeoutMs: 5 });
    const result = await provider.complete(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_TIMEOUT');
    }
  });

  it('maps an unexpected network failure to a ProviderFailureError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network is down')));

    const provider = createOpenAiProvider(baseOptions);
    const result = await provider.complete(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PROVIDER_FAILURE');
    }
  });
});
