import { env } from './config/env.js';

function main(): void {
  console.log(`WorkWise AI automation examples (provider: ${env.LLM_PROVIDER})`);
  console.log('Run `npm test` to execute the workflow examples and their test suites.');
}

main();
