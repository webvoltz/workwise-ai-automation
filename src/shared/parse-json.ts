import { err, ok, type Result } from './result.js';

export function parseJsonResponse(text: string): Result<unknown, string> {
  try {
    return ok<unknown>(JSON.parse(text));
  } catch {
    return err('Model response was not valid JSON.');
  }
}
