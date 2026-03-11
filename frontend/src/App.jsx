import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { Footer, Messages } from './components/Common';
import Home from './pages/Home';
import { Login, Register } from './pages/Auth';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import { ApplyJob, MyApplications, SavedJobs, Recommendations } from './pages/JobSeeker';
import { PostJob, MyPostedJobs, ManageApplicants, FindCandidates } from './pages/JobProvider';
import { Dashboard, Profile } from './pages/DashboardProfile';
import './styles/main.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <Messages />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />

          {/* Job Seeker Routes */}
          <Route path="/jobs/:id/apply" element={<PrivateRoute roles={['jobseeker']}><ApplyJob /></PrivateRoute>} />
          <Route path="/my-applications" element={<PrivateRoute roles={['jobseeker']}><MyApplications /></PrivateRoute>} />
          <Route path="/saved-jobs" element={<PrivateRoute roles={['jobseeker']}><SavedJobs /></PrivateRoute>} />
          <Route path="/recommendations" element={<PrivateRoute roles={['jobseeker']}><Recommendations /></PrivateRoute>} />

          {/* Job Provider Routes */}
          <Route path="/post-job" element={<PrivateRoute roles={['jobprovider']}><PostJob /></PrivateRoute>} />
          <Route path="/jobs/:id/edit" element={<PrivateRoute roles={['jobprovider']}><PostJob editMode /></PrivateRoute>} />
          <Route path="/my-jobs" element={<PrivateRoute roles={['jobprovider']}><MyPostedJobs /></PrivateRoute>} />
          <Route path="/jobs/:id/applicants" element={<PrivateRoute roles={['jobprovider']}><ManageApplicants /></PrivateRoute>} />
          <Route path="/find-candidates" element={<PrivateRoute roles={['jobprovider']}><FindCandidates /></PrivateRoute>} />

          {/* Shared */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
