import { Route, Routes, Navigate, Link } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LearnersListPage } from './pages/LearnersListPage'
import { LearnerDetailPage } from './pages/LearnerDetailPage'
import { QuizPage } from './pages/QuizPage'

function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Guidely
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-300">
            <Link to="/home" className="hover:text-zinc-50">
              בית
            </Link>
            <Link to="/learners" className="hover:text-zinc-50">
              תלמידים
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/learners" element={<LearnersListPage />} />
          <Route path="/learners/:learnerId" element={<LearnerDetailPage />} />
          <Route path="/learners/:learnerId/quiz" element={<QuizPage />} />
        </Routes>
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-zinc-400">
          Backend: FastAPI • Frontend: React
        </div>
      </footer>
    </div>
  )
}

export default App
