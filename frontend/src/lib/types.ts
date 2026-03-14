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

