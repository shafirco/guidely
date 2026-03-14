import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { clsx } from 'clsx'

import { api } from '../lib/api'
import type { CreateLearnerResponse, ListLearnersResponse } from '../lib/types'
import { Sparkline } from '../components/Sparkline'
import { formatDateTime } from '../lib/format'

const createLearnerSchema = z.object({
  learnerId: z.string().min(1, 'יש להכניס שם תלמיד'),
})
type CreateLearnerValues = z.infer<typeof createLearnerSchema>

export function LearnersListPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')

  const learnersQuery = useQuery({
    queryKey: ['learners'],
    queryFn: async () => {
      const res = await api.get<ListLearnersResponse>('/learners')
      return res.data.learners
    },
  })

  const createLearnerForm = useForm<CreateLearnerValues>({
    resolver: zodResolver(createLearnerSchema),
    defaultValues: { learnerId: '' },
  })

  const createLearner = useMutation({
    mutationFn: async (values: CreateLearnerValues) => {
      const res = await api.post<CreateLearnerResponse>('/learners', { learner_id: values.learnerId })
      return res.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['learners'] })
      createLearnerForm.reset({ learnerId: '' })
    },
  })

  const learners = learnersQuery.data ?? []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return learners
    return learners.filter((l) => l.name.toLowerCase().includes(q))
  }, [learners, query])

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">תלמידים</h2>
          <p className="mt-1 text-sm text-zinc-300">
            חיפוש לפי שם + כניסה לדף תלמיד עם גרף ושיעורים.
          </p>
        </div>
        <div className="text-xs text-zinc-400">
          סה״כ: <span className="text-zinc-200">{learners.length}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/20 p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-zinc-100">חיפוש</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:border-zinc-600 text-right"
              placeholder="חפש לפי שם תלמיד…"
              autoComplete="off"
            />
          </div>

          <div className="mt-4 border-t border-zinc-800 pt-4">
            <div className="text-sm font-semibold text-zinc-100">הוסף תלמיד</div>
            <form
              onSubmit={createLearnerForm.handleSubmit(async (values) => createLearner.mutateAsync(values))}
              className="mt-2 flex gap-2"
            >
              <input
                {...createLearnerForm.register('learnerId')}
                className={clsx(
                  'w-full rounded-xl border bg-zinc-950/40 px-3 py-2 text-sm outline-none text-right',
                  createLearnerForm.formState.errors.learnerId
                    ? 'border-red-500/60'
                    : 'border-zinc-800 focus:border-zinc-600',
                )}
                placeholder="שם תלמיד חדש…"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={createLearner.isPending}
                className="shrink-0 rounded-xl bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-60"
              >
                הוסף
              </button>
            </form>
            {createLearnerForm.formState.errors.learnerId && (
              <p className="mt-2 text-xs text-red-400">{createLearnerForm.formState.errors.learnerId.message}</p>
            )}
            {createLearner.isError && (
              <p className="mt-2 text-xs text-red-400">לא הצליח להוסיף תלמיד (אולי כבר קיים?)</p>
            )}
          </div>
        </aside>

        <section className="space-y-2">
          {learnersQuery.isLoading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-4 text-sm text-zinc-300">
              טוען תלמידים…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 p-6 text-sm text-zinc-300">
              לא נמצאו תלמידים.
            </div>
          ) : (
            filtered.map((l) => {
              const last = l.sessions[l.sessions.length - 1]
              return (
                <Link
                  key={l.name}
                  to={`/learners/${encodeURIComponent(l.name)}`}
                  className="block rounded-2xl border border-zinc-800 bg-zinc-950/20 p-4 hover:border-zinc-700 hover:bg-zinc-950/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-100">{l.name}</div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {l.sessions.length} שיעורים
                        {last ? ` • אחרון: ${formatDateTime(last.occurred_at)}` : ''}
                      </div>
                    </div>
                    <Sparkline points={l.trend ?? []} width={220} height={64} />
                  </div>
                </Link>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}

