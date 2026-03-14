export type ProgressMark = 'progress' | 'same' | 'regression'

export type SessionDTO = {
  id: string
  occurred_at: string
  progress: ProgressMark
  description: string
}

export type TrendPointDTO = {
  occurred_at: string
  progress: ProgressMark
  y: number
}

export type LearnerDTO = {
  name: string
  description: string
  important_notes: string
  sessions: SessionDTO[]
  trend: TrendPointDTO[]
}

export type AddSessionResponse = {
  learner_id: string
  learner: LearnerDTO
}

export type ListLearnersResponse = {
  learners: LearnerDTO[]
}

export type GetLearnerResponse = {
  learner_id: string
  learner: LearnerDTO
}

export type CreateLearnerResponse = {
  learner_id: string
  learner: LearnerDTO
}

export type RenameLearnerResponse = {
  learner_id: string
  learner: LearnerDTO
}

// Quiz types

export type ChoiceDTO = {
  label: string
  text: string
  is_correct: boolean
}

export type QuestionDTO = {
  question_text: string
  topic: string
  difficulty: 'medium' | 'hard'
  choices: ChoiceDTO[]
  explanation: string
}

export type QuizDTO = {
  learner_name: string
  summary: string
  questions: QuestionDTO[]
}

export type GenerateQuizResponse = {
  quiz: QuizDTO
}

