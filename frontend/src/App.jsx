


import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Problems from './pages/problems/Problems'
import Submissions from './pages/Submissions'
import ProblemDetail from './pages/problems/ProblemDetail'
import CustomProblems from './pages/problems/CustomProblems'
import CustomPractice from './pages/problems/CustomPractice'
import './App.css'

function App() {
  return (
    <main className="app">
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/submissions" element={<Submissions />} />
        <Route path="/problems/:slug" element={<ProblemDetail />} />
        <Route path="/customproblems" element={<CustomProblems />} />
        <Route path="/customproblems/:input" element={<CustomPractice />} />
      </Routes>
    </main>
  )
}

export default App