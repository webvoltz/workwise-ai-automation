import { describe, expect, it } from 'vitest';

import { sampleKnowledgeBase } from './fixtures.js';
import { searchKnowledgeBase } from './knowledge-base.js';
import type { KnowledgeDocument } from './types.js';

describe('searchKnowledgeBase', () => {
  it('ranks documents by keyword overlap and applies topK', () => {
    const results = searchKnowledgeBase(sampleKnowledgeBase, 'refund password reset account', 1);

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('kb-password-reset');
  });

  it('returns an empty list when nothing matches', () => {
    const results = searchKnowledgeBase(sampleKnowledgeBase, 'nonexistent gibberish zzz');

    expect(results).toEqual([]);
  });

  it('scores documents without tags using their title and content alone', () => {
    const untaggedDocs: readonly KnowledgeDocument[] = [
      { id: 'doc-1', title: 'Untagged document', content: 'This document has no tags at all.' },
    ];

    const results = searchKnowledgeBase(untaggedDocs, 'untagged document');

    expect(results).toEqual(untaggedDocs);
  });
});
