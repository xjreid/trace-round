


import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Problems from './pages/problems/Problems'
import Submissions from './pages/submissions/Submissions'
import ProblemDetails from './pages/problems/ProblemDetails'
import CustomProblems from './pages/problems/CustomProblems'
import CustomPractice from './pages/problems/CustomPractice'
import InterviewAccess from './pages/problems/InterviewAccess'
import Feedback from './pages/problems/Feedback'
import Signin from './pages/Signin'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/submissions" element={<Submissions />} />
          <Route path="/problems/:slug" element={<ProblemDetails />} />
          <Route path="/customproblems" element={<CustomProblems />} />
          <Route
            path="/customproblems/:input/:questionCount"
            element={<CustomPractice />}
          />
          <Route path="/interview-access" element={<InterviewAccess />} />
          <Route path="/feedback/:feedbackId" element={<Feedback />} />
          <Route path="/signin" element={<Signin />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
