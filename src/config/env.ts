import { z } from 'zod';

const commonFields = {
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  PROVIDER_TIMEOUT_MS: z.coerce.number().int().min(1).default(10_000),
  MAX_RETRY_ATTEMPTS: z.coerce.number().int().min(1).default(3),
};

const envSchema = z.discriminatedUnion('LLM_PROVIDER', [
  z.object({ ...commonFields, LLM_PROVIDER: z.literal('mock') }),
  z.object({
    ...commonFields,
    LLM_PROVIDER: z.literal('openai'),
    OPENAI_API_KEY: z.string().min(1),
  }),
]);

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const rawProvider = process.env['LLM_PROVIDER'];
  const provider = rawProvider === undefined || rawProvider === '' ? 'mock' : rawProvider;

  const result = envSchema.safeParse({
    NODE_ENV: process.env['NODE_ENV'],
    LLM_PROVIDER: provider,
    OPENAI_API_KEY: process.env['OPENAI_API_KEY'],
    OPENAI_MODEL: process.env['OPENAI_MODEL'],
    PROVIDER_TIMEOUT_MS: process.env['PROVIDER_TIMEOUT_MS'],
    MAX_RETRY_ATTEMPTS: process.env['MAX_RETRY_ATTEMPTS'],
  });

  if (!result.success) {
    throw new Error('Invalid service configuration.');
  }

  return result.data;
}

export const env = loadEnv();
