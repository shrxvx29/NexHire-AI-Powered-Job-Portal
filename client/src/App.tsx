import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ProfilePage from "./pages/ProfilePage";
import AIPage from "./pages/AIPage";
import EmployerPage from "./pages/EmployerPage";
import EmployerJobsPage from "./pages/EmployerJobsPage";
import JobFormPage from "./pages/JobFormPage";
import ApplicantsPage from "./pages/ApplicantsPage";
import EmployerProfilePage from "./pages/EmployerProfilePage";
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading NexHire…</div>;
  return (
    <Navigate
      to={
        user
          ? user.role === "employer"
            ? "/employer"
            : "/dashboard"
          : "/login"
      }
      replace
    />
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<PublicLayout />}>
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<ProtectedRoute role="seeker" />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/ai" element={<AIPage />} />
          </Route>
          <Route element={<ProtectedRoute role="employer" />}>
            <Route path="/employer" element={<EmployerPage />} />
            <Route path="/employer/jobs" element={<EmployerJobsPage />} />
            <Route path="/employer/jobs/new" element={<JobFormPage />} />
            <Route path="/employer/jobs/:id/edit" element={<JobFormPage />} />
            <Route path="/employer/profile" element={<EmployerProfilePage />}/>
            <Route
              path="/employer/jobs/:jobId/applicants"
              element={<ApplicantsPage />}
            />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
