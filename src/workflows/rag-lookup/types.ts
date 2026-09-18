export interface KnowledgeDocument {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags?: readonly string[];
}

export interface Citation {
  readonly id: string;
  readonly title: string;
}

export interface RagAnswer {
  readonly answer: string;
  readonly citations: readonly Citation[];
}
