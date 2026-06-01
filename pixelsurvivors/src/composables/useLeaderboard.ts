import { ref } from 'vue'

const STORAGE_KEY = 'pixelsurvivors-lb'
const MAX_ENTRIES = 5

export interface LeaderboardEntry {
  score: number
  time: number
  difficulty: string
  date: string
}

function load(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch {
    return []
  }
}

export function useLeaderboard() {
  const entries = ref<LeaderboardEntry[]>(load())

  function saveEntry(entry: LeaderboardEntry): number | null {
    const all = [...entries.value, entry].sort((a, b) => b.score - a.score)
    const rank = all.indexOf(entry) + 1
    entries.value = all.slice(0, MAX_ENTRIES)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
    } catch { /* storage full — ignore */ }
    return rank <= MAX_ENTRIES ? rank : null
  }

  function clearBoard() {
    entries.value = []
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  return { entries, saveEntry, clearBoard }
}
