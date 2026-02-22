import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Otp from './pages/Otp';
// New Dashboard components
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Learn from './pages/Learn';
import Lesson from './pages/Lesson';
import More from './pages/More';
import Vocabulary from './pages/Vocabulary';
import Dictionary from './pages/Dictionary';
import Tests from './pages/Tests';
import Arena from './pages/Arena';
import Leaderboard from './pages/Leaderboard';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

function App() {
  return (
    <Routes>
       <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/otp" element={<Otp />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
             <Route index element={<DashboardHome />} />
             <Route path="learn" element={<Learn />} />
             <Route path="learn/:lessonId" element={<Lesson />} />
             <Route path="arena" element={<Arena />} />
             <Route path="leaderboard" element={<Leaderboard />} />
             <Route path="more" element={<More />} />
             <Route path="wallet" element={<Wallet />} />
             <Route path="vocabulary" element={<Vocabulary />} />
             <Route path="dictionary" element={<Dictionary />} />
             <Route path="tests" element={<Tests />} />
             <Route path="profile" element={<Profile />} />
             <Route path="notifications" element={<Notifications />} />
          </Route>
       </Route>
    </Routes>
  )
}

export default App;
