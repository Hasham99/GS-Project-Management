import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRegister from './pages/AdminRegister';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectAnalytics from './pages/ProjectAnalytics';
import PlatformReleases from './pages/PlatformReleases';
import UserWorkItems from './pages/UserWorkItems';
import AssignedTasks from './pages/AssignedTasks';
import Users from './pages/Users';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="projects/:id/analytics" element={<ProjectAnalytics />} />
          <Route path="projects/:id/releases" element={<PlatformReleases />} />
          <Route path="workitems" element={<UserWorkItems />} />
          <Route path="assigned-tasks" element={<AssignedTasks />} />
          <Route path="users" element={<Users />} />
          {/* Default fallback inside layout */}
          <Route path="*" element={<div className="text-center py-20 text-xl font-medium text-surface-500">Work in Progress</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
