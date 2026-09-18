import type { KnowledgeDocument } from './types.js';

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'what',
  'how',
  'you',
  'your',
  'from',
  'with',
  'this',
  'that',
  'can',
  'will',
  'does',
  'have',
  'has',
]);

function tokenize(text: string): readonly string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function scoreDocument(document: KnowledgeDocument, queryTerms: readonly string[]): number {
  const haystack = tokenize(
    `${document.title} ${document.content} ${(document.tags ?? []).join(' ')}`,
  );

  return queryTerms.reduce(
    (score, term) => score + haystack.filter((word) => word === term).length,
    0,
  );
}

// Naive keyword overlap retrieval: enough to demonstrate the RAG shape without a vector store.
export function searchKnowledgeBase(
  knowledgeBase: readonly KnowledgeDocument[],
  query: string,
  topK = 3,
): readonly KnowledgeDocument[] {
  const queryTerms = tokenize(query);

  return knowledgeBase
    .map((document) => ({ document, score: scoreDocument(document, queryTerms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((entry) => entry.document);
}
