import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Supabase's newer "publishable" key (sb_publishable_…) replaces the legacy anon key; accept either.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

/** When env isn't configured the deck still runs — quizzes just don't record. */
export const quizEnabled = Boolean(url && key)

const client: SupabaseClient | null = quizEnabled ? createClient(url as string, key as string) : null

const STORAGE_KEY = 'gqlquiz.participant'

export interface Participant {
  id: string
  name: string
}

export interface LeaderRow {
  name: string
  correct: number
  answered: number
}

export function getParticipant(): Participant | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Participant) : null
  } catch {
    return null
  }
}

export async function join(name: string): Promise<Participant | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  if (!client) {
    const local: Participant = { id: 'local', name: trimmed }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local))
    return local
  }

  const { data, error } = await client
    .from('participants')
    .insert({ name: trimmed })
    .select()
    .single()
  if (error || !data) return null

  const participant: Participant = { id: data.id as string, name: data.name as string }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(participant))
  return participant
}

/** Only the first answer per (participant, question) counts — enforced by a unique index. */
export async function recordAnswer(
  questionId: string,
  choice: number,
  isCorrect: boolean,
): Promise<void> {
  const participant = getParticipant()
  if (!client || !participant || participant.id === 'local') return

  await client.from('answers').upsert(
    {
      participant_id: participant.id,
      question_id: questionId,
      choice,
      is_correct: isCorrect,
    },
    { onConflict: 'participant_id,question_id', ignoreDuplicates: true },
  )
}

export async function getLeaderboard(limit = 10): Promise<LeaderRow[]> {
  if (!client) return []
  const { data, error } = await client.rpc('leaderboard', { top_n: limit })
  if (error || !data) return []
  return data as LeaderRow[]
}

export function onAnswersChange(callback: () => void): () => void {
  if (!client) return () => {}
  const channel = client
    .channel('answers-stream')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, callback)
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}
