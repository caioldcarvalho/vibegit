export type SessionOutcome = 'completed' | 'partial' | 'abandoned' | 'interrupted'
export type AttemptOutcome = 'succeeded' | 'failed' | 'partial'
export type IndexOutcome = SessionOutcome | 'in_progress'

export interface FileRef {
  path: string
  base_commit: string | null
  dirty: boolean
}

interface BaseEvent {
  session_id: string
  seq: number
  type: string
  at: string
}

export interface BeginEvent extends BaseEvent {
  type: 'begin'
  intent: string
  context: string | null
  git_head: string | null
  resumed_from: string | null
}

export interface NoteEvent extends BaseEvent {
  type: 'note'
  body: string
  files: FileRef[]
}

export interface DecisionEvent extends BaseEvent {
  type: 'decision'
  body: string
  alternatives: Array<{ option: string; reason_rejected: string }>
  files: FileRef[]
}

export interface AttemptEvent extends BaseEvent {
  type: 'attempt'
  body: string
  outcome: AttemptOutcome
  reason: string | null
  files: FileRef[]
}

export interface UncertaintyEvent extends BaseEvent {
  type: 'uncertainty'
  body: string
  files: FileRef[]
}

export interface CloseEvent extends BaseEvent {
  type: 'close'
  outcome: SessionOutcome
  outcome_note: string | null
  files: FileRef[]
}

export type SessionEvent =
  | BeginEvent
  | NoteEvent
  | DecisionEvent
  | AttemptEvent
  | UncertaintyEvent
  | CloseEvent

export interface IndexEntry {
  session_id: string
  index_version: number
  started_at: string
  closed_at: string | null
  agent: { tool: string; model: string | null }
  git_head: string | null
  intent: string
  outcome: IndexOutcome
  outcome_note: string | null
  files: string[]
  tags: string[]
}

export interface Config {
  spec_version: string
  created_at: string
}
