import { Outlet, Navigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LogOut, LayoutDashboard, Folder, CheckSquare, Users } from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Sidebar sidebar */}
      <aside className="w-64 bg-surface-900 text-white flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-primary-500 flex items-center justify-center font-bold text-lg">
            GS
          </div>
          <span className="text-xl font-bold tracking-wide">ProjectHQ</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link to="/projects" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
            <Folder size={20} />
            <span className="font-medium">Projects</span>
          </Link>
          {user?.globalRole === 'User' ? (
            <Link to="/workitems" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
              <CheckSquare size={20} />
              <span className="font-medium">My Tasks</span>
            </Link>
          ) : (
            <>
              <Link to="/assigned-tasks" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
                <CheckSquare size={20} />
                <span className="font-medium">Assigned Tasks</span>
              </Link>
              <Link to="/users" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-surface-300 hover:bg-surface-800 hover:text-white transition-colors">
                <Users size={20} />
                <span className="font-medium">Directory</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-surface-800 mt-auto">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-surface-400 capitalize">{user.globalRole}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-surface-800 hover:bg-red-600/90 text-surface-300 hover:text-white py-2 rounded transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-semibold text-surface-800">
            {/* Can make dynamic based on route */}
            Workspace
          </h2>
          <div>
            {/* Add universal search or notifications here */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-50 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
