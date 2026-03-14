import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { clsx } from 'clsx'

import { api } from '../lib/api'
import type {
  GetLearnerResponse,
  ProgressMark,
  RenameLearnerResponse,
} from '../lib/types'
import { Sparkline } from '../components/Sparkline'
import { formatDateTime } from '../lib/format'
import { dateTimeLocalToIso, toDateTimeLocalValue } from '../lib/datetime'
import { ChevronRight, Trash2 } from 'lucide-react'

const progressOptions: Array<{ value: ProgressMark; label: string; tone: string }> = [
  { value: 'progress', label: 'התקדמות', tone: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' },
  { value: 'same', label: 'ללא שינוי', tone: 'bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/30' },
  { value: 'regression', label: 'נסיגה', tone: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30' },
]

const addSessionSchema = z.object({
  occurredAtLocal: z.string().min(1, 'יש לבחור תאריך ושעה'),
  progress: z.enum(['progress', 'same', 'regression']),
  description: z.string().min(1, 'יש להוסיף תיאור קצר לשיעור'),
})
type AddSessionValues = z.infer<typeof addSessionSchema>

const renameSchema = z.object({
  newName: z.string().min(1, 'יש להכניס שם חדש'),
})
type RenameValues = z.infer<typeof renameSchema>

export function LearnerDetailPage() {
  const { learnerId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const defaultOccurredAt = useMemo(
    () => toDateTimeLocalValue(new Date(Date.now() - 5 * 60 * 1000)),
    [],
  )

  const learnerQuery = useQuery({
    queryKey: ['learner', learnerId],
    enabled: !!learnerId,
    queryFn: async () => {
      const res = await api.get<GetLearnerResponse>(`/learners/${encodeURIComponent(learnerId!)}`)
      return res.data
    },
  })

  const addSessionForm = useForm<AddSessionValues>({
    resolver: zodResolver(addSessionSchema),
    defaultValues: {
      occurredAtLocal: defaultOccurredAt,
      progress: 'progress',
      description: '',
    },
  })

  const renameForm = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: { newName: '' },
  })

  const renameLearner = useMutation({
    mutationFn: async (values: RenameValues) => {
      const res = await api.patch<RenameLearnerResponse>(`/learners/${encodeURIComponent(learnerId!)}`, {
        new_name: values.newName,
      })
      return res.data
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['learners'] })
      await queryClient.invalidateQueries({ queryKey: ['learner', learnerId] })
      renameForm.reset({ newName: '' })
      navigate(`/learners/${encodeURIComponent(data.learner_id)}`, { replace: true })
    },
  })

  const addSession = useMutation({
    mutationFn: async (values: AddSessionValues) => {
      if (!learnerId) throw new Error('No learner selected')
      const isFuture = new Date(values.occurredAtLocal).getTime() > Date.now()
      if (isFuture) throw new Error('לא ניתן להוסיף שיעור עתידי')

      const occurred_at = dateTimeLocalToIso(values.occurredAtLocal)
      const res = await api.post(`/learners/${encodeURIComponent(learnerId)}/sessions`, {
        occurred_at,
        progress: values.progress,
        description: values.description,
      })
      return res.data as GetLearnerResponse
    },
    onSuccess: async () => {
      addSessionForm.reset({
        occurredAtLocal: defaultOccurredAt,
        progress: 'progress',
        description: '',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['learners'] }),
        queryClient.invalidateQueries({ queryKey: ['learner', learnerId] }),
      ])
    },
  })

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.delete(`/learners/${encodeURIComponent(learnerId!)}/sessions/${encodeURIComponent(sessionId)}`)
      return res.data as GetLearnerResponse
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['learners'] }),
        queryClient.invalidateQueries({ queryKey: ['learner', learnerId] }),
      ])
    },
  })

  const learner = learnerQuery.data?.learner ?? null
  const [showRename, setShowRename] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)

  const infoForm = useForm<{ description: string; important_notes: string }>({
    defaultValues: { description: '', important_notes: '' },
  })
  
  // Keep form in sync when learner loads/changes
  useEffect(() => {
    if (!learner) return
    infoForm.setValue('description', learner.description ?? '')
    infoForm.setValue('important_notes', learner.important_notes ?? '')
  }, [learner?.name, learner?.description, learner?.important_notes]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateLearnerInfo = useMutation({
    mutationFn: async (values: { description?: string; important_notes?: string }) => {
      const res = await api.patch<RenameLearnerResponse>(`/learners/${encodeURIComponent(learnerId!)}`, {
        description: values.description,
        important_notes: values.important_notes,
      })
      return res.data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['learners'] }),
        queryClient.invalidateQueries({ queryKey: ['learner', learnerId] }),
      ])
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/learners"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/20 px-2.5 py-1.5 text-sm text-zinc-200 hover:border-zinc-700 hover:bg-zinc-950/30"
        >
          <ChevronRight className="h-4 w-4" />
          חזרה לרשימה
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        {learnerQuery.isLoading ? (
          <div className="text-sm text-zinc-300">טוען…</div>
        ) : learnerQuery.isError || !learner ? (
          <div className="text-sm text-red-300">לא הצלחתי להביא את התלמיד.</div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">תלמיד: {learner.name}</h2>
                <p className="mt-1 text-sm text-zinc-300">{learner.sessions.length} שיעורים</p>
              </div>
              <Sparkline points={learner.trend ?? []} width={320} height={80} />
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100">פרטי תלמיד</h3>
                  <button
                    type="button"
                    onClick={() => setShowRename((v) => !v)}
                    className="text-xs text-zinc-300 hover:text-zinc-50"
                  >
                    שינוי שם
                  </button>
                </div>

                {showRename && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
                    <form
                      className="flex gap-2"
                      onSubmit={renameForm.handleSubmit(async (v) => renameLearner.mutateAsync(v))}
                    >
                      <input
                        {...renameForm.register('newName')}
                        className={clsx(
                          'w-full rounded-lg border bg-zinc-950/40 px-3 py-2 text-sm outline-none text-right',
                          renameForm.formState.errors.newName
                            ? 'border-red-500/60'
                            : 'border-zinc-800 focus:border-zinc-600',
                        )}
                        placeholder="שם חדש…"
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        disabled={renameLearner.isPending}
                        className="shrink-0 rounded-lg bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-60"
                      >
                        שמור
                      </button>
                    </form>
                    {renameForm.formState.errors.newName && (
                      <p className="mt-2 text-xs text-red-400">{renameForm.formState.errors.newName.message}</p>
                    )}
                    {renameLearner.isError && (
                      <p className="mt-2 text-xs text-red-400">לא הצליח לשנות שם (אולי השם כבר קיים?)</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-zinc-200">תיאור כללי</label>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-400">
                      {learner.description?.trim() ? 'מוצג בדף התלמיד.' : 'אין תיאור כרגע.'}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const next = !isEditingDescription
                        setIsEditingDescription(next)
                        if (!next) {
                          updateLearnerInfo.mutate({ description: infoForm.getValues('description') ?? '' })
                        }
                      }}
                      className="text-xs text-zinc-300 hover:text-zinc-50"
                    >
                      {isEditingDescription ? 'סיום' : 'עריכה'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    {...infoForm.register('description')}
                    readOnly={!isEditingDescription}
                    onBlur={() => {
                      if (!isEditingDescription) return
                      updateLearnerInfo.mutate({ description: infoForm.getValues('description') ?? '' })
                    }}
                    className={clsx(
                      'mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none text-right',
                      isEditingDescription
                        ? 'border-zinc-700 bg-zinc-950/40 focus:border-zinc-500'
                        : 'border-zinc-800 bg-zinc-950/20 text-zinc-200/90',
                    )}
                    placeholder="מידע כללי על התלמיד…"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <label className="text-xs font-medium text-zinc-200">הערות חשובות</label>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-400">
                      {learner.important_notes?.trim() ? 'מוצג בדף התלמיד.' : 'אין הערות כרגע.'}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const next = !isEditingNotes
                        setIsEditingNotes(next)
                        if (!next) {
                          updateLearnerInfo.mutate({ important_notes: infoForm.getValues('important_notes') ?? '' })
                        }
                      }}
                      className="text-xs text-zinc-300 hover:text-zinc-50"
                    >
                      {isEditingNotes ? 'סיום' : 'עריכה'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    {...infoForm.register('important_notes')}
                    readOnly={!isEditingNotes}
                    onBlur={() => {
                      if (!isEditingNotes) return
                      updateLearnerInfo.mutate({ important_notes: infoForm.getValues('important_notes') ?? '' })
                    }}
                    className={clsx(
                      'mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none text-right',
                      isEditingNotes
                        ? 'border-zinc-700 bg-zinc-950/40 focus:border-zinc-500'
                        : 'border-zinc-800 bg-zinc-950/20 text-zinc-200/90',
                    )}
                    placeholder="הערות חשובות (לדוגמה: רגישויות, מטרות, דגשים)…"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/20 p-4">
                <h3 className="text-sm font-semibold text-zinc-100">הוסף שיעור</h3>
                <form
                  onSubmit={addSessionForm.handleSubmit(async (values) => {
                    try {
                      await addSession.mutateAsync(values)
                    } catch (e) {
                      const message = e instanceof Error ? e.message : 'שגיאה'
                      addSessionForm.setError('occurredAtLocal', { message })
                    }
                  })}
                  className="mt-3 space-y-3"
                >
                  <div>
                    <label className="text-xs font-medium text-zinc-200">תאריך ושעה</label>
                    <input
                      type="datetime-local"
                      {...addSessionForm.register('occurredAtLocal')}
                      className={clsx(
                        'mt-1 w-full rounded-xl border bg-zinc-950/40 px-3 py-2 text-sm outline-none text-right',
                        addSessionForm.formState.errors.occurredAtLocal
                          ? 'border-red-500/60'
                          : 'border-zinc-800 focus:border-zinc-600',
                      )}
                    />
                    {addSessionForm.formState.errors.occurredAtLocal && (
                      <p className="mt-1 text-xs text-red-400">
                        {addSessionForm.formState.errors.occurredAtLocal.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-200">סטטוס</label>
                    <select
                      {...addSessionForm.register('progress')}
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    >
                      {progressOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-200">תיאור</label>
                    <textarea
                      rows={3}
                      {...addSessionForm.register('description')}
                      className={clsx(
                        'mt-1 w-full resize-none rounded-xl border bg-zinc-950/40 px-3 py-2 text-sm outline-none text-right',
                        addSessionForm.formState.errors.description
                          ? 'border-red-500/60'
                          : 'border-zinc-800 focus:border-zinc-600',
                      )}
                      placeholder="מה היה בשיעור?"
                    />
                    {addSessionForm.formState.errors.description && (
                      <p className="mt-1 text-xs text-red-400">
                        {addSessionForm.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={addSession.isPending}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-60"
                  >
                    {addSession.isPending ? 'מוסיף…' : 'הוסף שיעור'}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h3 className="text-base font-semibold">שיעורים</h3>

        <div className="mt-4 space-y-2">
          {learner && learner.sessions.length > 0 ? (
            learner.sessions
              .slice()
              .reverse()
              .map((s, idx) => {
              const opt = progressOptions.find((p) => p.value === s.progress)
              return (
                <div
                  key={s.id ?? `${s.occurred_at}-${idx}`}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-950/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-100">
                        {formatDateTime(s.occurred_at)}
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                        {s.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => deleteSession.mutate(s.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md border border-transparent px-1.5 py-1 text-xs text-zinc-300 hover:text-zinc-50 hover:border-zinc-700"
                        title="מחק שיעור"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <span className={clsx('shrink-0 rounded-full px-2 py-1 text-xs font-semibold', opt?.tone)}>
                        {opt?.label ?? s.progress}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 p-6 text-sm text-zinc-300">
              אין שיעורים עדיין לתלמיד הזה.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

