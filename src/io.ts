import fs from 'fs'
import path from 'path'
import { withLock } from './lock'
import { vgPaths } from './vg'
import type { SessionEvent, IndexEntry } from './types'

// ─── Raw file helpers ────────────────────────────────────────────────────────

function readLines(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return []
  return fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim())
}

// ─── Session files ────────────────────────────────────────────────────────────

export function readEvents(sessionFile: string): SessionEvent[] {
  return readLines(sessionFile).flatMap(line => {
    try { return [JSON.parse(line) as SessionEvent] } catch { return [] }
  })
}

export function appendEvent(sessionFile: string, event: SessionEvent): void {
  fs.mkdirSync(path.dirname(sessionFile), { recursive: true })
  fs.appendFileSync(sessionFile, JSON.stringify(event) + '\n', 'utf8')
}

export function nextSeq(sessionFile: string): number {
  const lines = readLines(sessionFile)
  if (lines.length === 0) return 0
  try {
    return (JSON.parse(lines[lines.length - 1]) as SessionEvent).seq + 1
  } catch {
    return lines.length
  }
}

/** Union of all file paths across all events in a session. */
export function deriveFiles(events: SessionEvent[]): string[] {
  const set = new Set<string>()
  for (const e of events) {
    if ('files' in e) for (const f of e.files) set.add(f.path)
  }
  return Array.from(set)
}

// ─── Index ────────────────────────────────────────────────────────────────────

export function readIndex(indexFile: string): IndexEntry[] {
  const map = new Map<string, IndexEntry>()
  for (const line of readLines(indexFile)) {
    try {
      const e = JSON.parse(line) as IndexEntry
      const existing = map.get(e.session_id)
      if (!existing || e.index_version > existing.index_version) map.set(e.session_id, e)
    } catch { /* skip corrupt line */ }
  }
  return Array.from(map.values())
}

export async function appendIndex(indexFile: string, lockFile: string, entry: IndexEntry): Promise<void> {
  await withLock(lockFile, () => {
    fs.appendFileSync(indexFile, JSON.stringify(entry) + '\n', 'utf8')
  })
}

export function writeIndex(indexFile: string, entries: IndexEntry[]): void {
  const content = entries.map(e => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : '')
  fs.writeFileSync(indexFile, content, 'utf8')
}

// ─── Current session pointer ──────────────────────────────────────────────────

export function getCurrentId(currentFile: string): string | null {
  if (!fs.existsSync(currentFile)) return null
  return fs.readFileSync(currentFile, 'utf8').trim() || null
}

export async function setCurrentId(currentFile: string, lockFile: string, id: string): Promise<void> {
  await withLock(lockFile, () => {
    fs.writeFileSync(currentFile, id + '\n', 'utf8')
  })
}

export async function clearCurrentId(currentFile: string, lockFile: string): Promise<void> {
  await withLock(lockFile, () => {
    if (fs.existsSync(currentFile)) fs.unlinkSync(currentFile)
  })
}

// ─── Interrupted session detection ───────────────────────────────────────────

/**
 * If `current` exists but the session has a close event, delete `current` (clean close, missing cleanup).
 * If `current` exists and session has no close event, the session is interrupted — leave as-is.
 */
export function resolveInterrupted(vgDir: string): void {
  const p = vgPaths(vgDir)
  const id = getCurrentId(p.current)
  if (!id) return

  const sessionFile = p.session(id)
  if (!fs.existsSync(sessionFile)) return

  const events = readEvents(sessionFile)
  if (events.some(e => e.type === 'close')) {
    // Closed cleanly but current wasn't deleted
    try { fs.unlinkSync(p.current) } catch { /* already gone */ }
  }
}
