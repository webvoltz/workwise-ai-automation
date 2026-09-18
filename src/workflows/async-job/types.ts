import type { WorkflowError, WorkflowErrorCode } from '../../shared/errors.js';

export interface JobAttemptRecord {
  readonly attempt: number;
  readonly outcome: 'succeeded' | WorkflowErrorCode;
}

export interface SucceededJob<T> {
  readonly status: 'succeeded';
  readonly attempts: number;
  readonly attemptLog: readonly JobAttemptRecord[];
  readonly value: T;
}

export interface FailedJob {
  readonly status: 'failed';
  readonly attempts: number;
  readonly attemptLog: readonly JobAttemptRecord[];
  readonly error: WorkflowError;
}

export interface ManualReviewJob {
  readonly status: 'manual_review';
  readonly attempts: number;
  readonly attemptLog: readonly JobAttemptRecord[];
  readonly error: WorkflowError;
}

export type JobResult<T> = SucceededJob<T> | FailedJob | ManualReviewJob;
