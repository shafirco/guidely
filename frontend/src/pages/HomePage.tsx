import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../lib/api'
import type { ListLearnersResponse, LearnerDTO } from '../lib/types'
import { Sparkline } from '../components/Sparkline'

function hasRegressionStreak(learner: LearnerDTO, streak: number): boolean {
  if (learner.sessions.length < streak) return false
  const last = learner.sessions.slice(-streak)
  return last.every((s) => s.progress === 'regression')
}

export function HomePage() {
  const learnersQuery = useQuery({
    queryKey: ['learners'],
    queryFn: async () => {
      const res = await api.get<ListLearnersResponse>('/learners')
      return res.data.learners
    },
  })

  const learners = learnersQuery.data ?? []
  const alerts = learners.filter((l) => hasRegressionStreak(l, 3))

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-semibold">דף בית</h2>
        <p className="mt-1 text-sm text-zinc-300">
          תובנות מהירות על תלמידים שמצריכים תשומת לב.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">התראות</h3>
            <p className="mt-1 text-xs text-zinc-400">
              תלמידים עם <span className="text-zinc-200">3 נסיגות רצוף</span> (ב־3 השיעורים האחרונים).
            </p>
          </div>
          <div className="text-xs text-zinc-400">
            נמצאו: <span className="text-zinc-200">{alerts.length}</span>
          </div>
        </div>

        {learnersQuery.isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-4 text-sm text-zinc-300">
            טוען…
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 p-6 text-sm text-zinc-300">
            אין כרגע התראות מהסוג הזה.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {alerts.map((l) => (
              <Link
                key={l.name}
                to={`/learners/${encodeURIComponent(l.name)}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/20 p-4 hover:border-zinc-700 hover:bg-zinc-950/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-100">{l.name}</div>
                    <div className="mt-1 text-xs text-zinc-400">לחץ כדי להיכנס לפרטי התלמיד</div>
                  </div>
                  <Sparkline points={l.trend ?? []} width={180} height={56} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

