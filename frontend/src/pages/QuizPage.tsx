import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { ChevronRight, Loader2, BookOpen, CheckCircle2, XCircle } from 'lucide-react'

import { api } from '../lib/api'
import type { GenerateQuizResponse, QuizDTO, QuestionDTO } from '../lib/types'

type QuizState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'taking'; quiz: QuizDTO; current: number; answers: Record<number, string> }
  | { phase: 'results'; quiz: QuizDTO; answers: Record<number, string> }

export function QuizPage() {
  const { learnerId } = useParams()
  const [state, setState] = useState<QuizState>({ phase: 'idle' })

  const generateQuiz = useMutation({
    mutationFn: async () => {
      const res = await api.post<GenerateQuizResponse>(
        `/learners/${encodeURIComponent(learnerId!)}/quiz`,
        { num_sessions: 15 },
      )
      return res.data.quiz
    },
    onSuccess: (quiz) => {
      setState({ phase: 'taking', quiz, current: 0, answers: {} })
    },
  })

  function selectAnswer(questionIdx: number, label: string) {
    if (state.phase !== 'taking') return
    setState({
      ...state,
      answers: { ...state.answers, [questionIdx]: label },
    })
  }

  function goToQuestion(idx: number) {
    if (state.phase !== 'taking') return
    setState({ ...state, current: idx })
  }

  function submitQuiz() {
    if (state.phase !== 'taking') return
    setState({ phase: 'results', quiz: state.quiz, answers: state.answers })
  }

  function getScore(quiz: QuizDTO, answers: Record<number, string>): number {
    return quiz.questions.reduce((acc, q, i) => {
      const correct = q.choices.find((c) => c.is_correct)
      return acc + (answers[i] === correct?.label ? 1 : 0)
    }, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to={`/learners/${encodeURIComponent(learnerId ?? '')}`}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/20 px-2.5 py-1.5 text-sm text-zinc-200 hover:border-zinc-700 hover:bg-zinc-950/30"
        >
          <ChevronRight className="h-4 w-4" />
          חזרה לתלמיד
        </Link>
      </div>

      {/* Idle: generate button */}
      {state.phase === 'idle' && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-zinc-400" />
          <h2 className="mt-4 text-lg font-semibold">יצירת מבחן מותאם אישית</h2>
          <p className="mt-2 text-sm text-zinc-300">
            האייגנט ינתח את השיעורים האחרונים של התלמיד ויבנה מבחן אמריקאי
            של 10-15 שאלות בנושאים שהוא חלש בהם.
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            השאלות ברמת קושי בינונית עד קשה. התלמיד יצטרך לפתור על מחברת ולסמן את התשובה.
          </p>
          <button
            type="button"
            onClick={() => {
              setState({ phase: 'loading' })
              generateQuiz.mutate()
            }}
            disabled={generateQuiz.isPending}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-60"
          >
            צור מבחן
          </button>
          {generateQuiz.isError && (
            <p className="mt-4 text-sm text-red-400">
              {(generateQuiz.error as Error)?.message ?? 'שגיאה ביצירת המבחן'}
            </p>
          )}
        </section>
      )}

      {/* Loading */}
      {state.phase === 'loading' && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-zinc-300" />
          <p className="mt-4 text-sm text-zinc-300">
            האייגנט מנתח את השיעורים ובונה מבחן מותאם אישית…
          </p>
          <p className="mt-1 text-xs text-zinc-400">זה יכול לקחת כמה שניות.</p>
        </section>
      )}

      {/* Taking the quiz */}
      {state.phase === 'taking' && (
        <TakingQuiz
          quiz={state.quiz}
          current={state.current}
          answers={state.answers}
          onSelect={selectAnswer}
          onNavigate={goToQuestion}
          onSubmit={submitQuiz}
        />
      )}

      {/* Results */}
      {state.phase === 'results' && (
        <QuizResults
          quiz={state.quiz}
          answers={state.answers}
          score={getScore(state.quiz, state.answers)}
          onRetry={() => {
            setState({ phase: 'loading' })
            generateQuiz.mutate()
          }}
        />
      )}
    </div>
  )
}


function TakingQuiz({
  quiz,
  current,
  answers,
  onSelect,
  onNavigate,
  onSubmit,
}: {
  quiz: QuizDTO
  current: number
  answers: Record<number, string>
  onSelect: (idx: number, label: string) => void
  onNavigate: (idx: number) => void
  onSubmit: () => void
}) {
  const q = quiz.questions[current]
  const total = quiz.questions.length
  const answeredCount = Object.keys(answers).length

  return (
    <>
      {quiz.summary && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-sm text-zinc-300">{quiz.summary}</p>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        {/* Progress bar */}
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-400">
          <span>שאלה {current + 1} מתוך {total}</span>
          <span>{answeredCount}/{total} נענו</span>
        </div>
        <div className="mb-6 h-1.5 w-full rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-50 transition-all duration-300"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question */}
        <QuestionCard
          question={q}
          questionIdx={current}
          selectedLabel={answers[current]}
          onSelect={onSelect}
        />

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate(current - 1)}
            disabled={current === 0}
            className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-700 disabled:opacity-30"
          >
            הקודם
          </button>

          <div className="flex flex-wrap justify-center gap-1.5">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate(i)}
                className={clsx(
                  'h-7 w-7 rounded-md text-xs font-medium transition-colors',
                  i === current
                    ? 'bg-zinc-50 text-zinc-950'
                    : answers[i]
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800',
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {current < total - 1 ? (
            <button
              type="button"
              onClick={() => onNavigate(current + 1)}
              className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-700"
            >
              הבא
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={answeredCount < total}
              className="rounded-lg bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-40"
            >
              סיים מבחן
            </button>
          )}
        </div>
      </section>
    </>
  )
}


function QuestionCard({
  question,
  questionIdx,
  selectedLabel,
  onSelect,
}: {
  question: QuestionDTO
  questionIdx: number
  selectedLabel?: string
  onSelect: (idx: number, label: string) => void
}) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <span
          className={clsx(
            'mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-xs font-medium',
            question.difficulty === 'hard'
              ? 'bg-rose-500/15 text-rose-300'
              : 'bg-amber-500/15 text-amber-300',
          )}
        >
          {question.difficulty === 'hard' ? 'קשה' : 'בינוני'}
        </span>
        <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
          {question.topic}
        </span>
      </div>

      <p className="mt-3 text-base font-medium leading-relaxed text-zinc-100">
        {question.question_text}
      </p>

      <div className="mt-4 space-y-2">
        {question.choices.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onSelect(questionIdx, c.label)}
            className={clsx(
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm text-right transition-colors',
              selectedLabel === c.label
                ? 'border-zinc-50/40 bg-zinc-50/10 text-zinc-50'
                : 'border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-950/30',
            )}
          >
            <span
              className={clsx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                selectedLabel === c.label
                  ? 'bg-zinc-50 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-300',
              )}
            >
              {c.label}
            </span>
            <span>{c.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}


function QuizResults({
  quiz,
  answers,
  score,
  onRetry,
}: {
  quiz: QuizDTO
  answers: Record<number, string>
  score: number
  onRetry: () => void
}) {
  const total = quiz.questions.length
  const pct = Math.round((score / total) * 100)

  return (
    <>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
        <h2 className="text-xl font-bold">תוצאות המבחן</h2>
        <div className="mt-4 text-4xl font-black">
          <span className={pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'}>
            {score}
          </span>
          <span className="text-zinc-400">/{total}</span>
        </div>
        <p className="mt-1 text-sm text-zinc-400">{pct}% תשובות נכונות</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-white"
        >
          צור מבחן חדש
        </button>
      </section>

      <section className="space-y-3">
        {quiz.questions.map((q, i) => {
          const correct = q.choices.find((c) => c.is_correct)
          const userAnswer = answers[i]
          const isCorrect = userAnswer === correct?.label

          return (
            <div
              key={i}
              className={clsx(
                'rounded-2xl border p-4',
                isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-rose-500/30 bg-rose-500/5',
              )}
            >
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-100">
                    {i + 1}. {q.question_text}
                  </p>

                  <div className="mt-2 space-y-1">
                    {q.choices.map((c) => {
                      const isUserPick = c.label === userAnswer
                      const isRight = c.is_correct
                      return (
                        <div
                          key={c.label}
                          className={clsx(
                            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm',
                            isRight
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : isUserPick
                                ? 'bg-rose-500/10 text-rose-300'
                                : 'text-zinc-400',
                          )}
                        >
                          <span className="font-bold">{c.label}.</span>
                          <span>{c.text}</span>
                          {isRight && <span className="mr-auto text-xs">(נכון)</span>}
                          {isUserPick && !isRight && <span className="mr-auto text-xs">(בחרת)</span>}
                        </div>
                      )
                    })}
                  </div>

                  <p className="mt-2 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-300">הסבר: </span>
                    {q.explanation}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}
