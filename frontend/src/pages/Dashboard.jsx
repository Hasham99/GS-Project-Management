import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle, Clock, AlertCircle, UserPlus } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('User');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    }
  });

  const { data: userWorkItems = [] } = useQuery({
    queryKey: ['my-dashboard-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/workitems/my-tasks');
      return data;
    }
  });

  const completedTasks = userWorkItems.filter(t => t.status === 'Done' || t.status === 'Closed').length;
  const urgentTasks = userWorkItems.filter(t => t.priority === 'Urgent').length;

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    try {
      const { data } = await api.post('/users/invite', { name: inviteName, email: inviteEmail, globalRole: inviteRole });
      setInviteSuccess(data.message);
      setInviteEmail('');
      setInviteName('');
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to invite user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Welcome back, {user?.name.split(' ')[0]}!</h1>
          <p className="text-surface-500">Here's what's happening in your workspace today.</p>
        </div>
        <div className="flex space-x-3">
          {(user?.globalRole === 'Admin' || user?.globalRole === 'Manager' || user?.globalRole === 'Super Admin') && (
            <button onClick={() => setShowInviteModal(true)} className="btn-secondary flex items-center space-x-2">
              <UserPlus size={18} />
              <span>Invite Member</span>
            </button>
          )}
          {user?.globalRole !== 'User' && (
            <Link to="/projects" className="btn-primary flex items-center space-x-2">
              <Plus size={18} />
              <span>Projects</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-l-4 border-primary-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
              <Folder size={24} className="lucide lucide-folder" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Active Projects</p>
              <h3 className="text-2xl font-bold text-surface-900">{projects?.length || 0}</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-green-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">My Completed Tasks</p>
              <h3 className="text-2xl font-bold text-surface-900">{completedTasks}</h3>
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-orange-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Urgent Priority Tasks</p>
              <h3 className="text-2xl font-bold text-surface-900">{urgentTasks}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-surface-900 mb-4">My Priority Tasks</h2>
          {userWorkItems.length === 0 ? (
            <p className="text-sm text-surface-500">No active tasks assigned to you right now.</p>
          ) : (
            <div className="space-y-3">
              {userWorkItems
                .filter(t => t.status !== 'Done')
                .sort((a,b) => (a.priority === 'Urgent' ? -1 : 1))
                .slice(0, 5)
                .map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 border border-surface-100 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-surface-800">{task.title}</span>
                    <span className="text-xs text-surface-500">{task.projectId?.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase ${
                    task.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-surface-200 text-surface-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-surface-900 mb-4">Recent Projects</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-surface-200 rounded"></div>
            <div className="h-12 bg-surface-200 rounded"></div>
          </div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-8 text-surface-500">
            <AlertCircle size={48} className="mx-auto text-surface-300 mb-4" />
            <p className="mb-4">You don't have any projects yet.</p>
            {user?.globalRole !== 'User' && (
              <Link to="/projects" className="btn-secondary">Go to Projects</Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 text-sm text-surface-500">
                  <th className="pb-3 font-medium">Project Name</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {projects?.slice(0, 5).map((project) => (
                  <tr key={project._id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50">
                    <td className="py-4">
                      <div className="font-medium text-surface-900">{project.name}</div>
                      <div className="text-sm text-surface-400 truncate max-w-xs">{project.description}</div>
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-medium">
                        {project.myRole}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link to={`/projects/${project._id}`} className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                        View Board
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-surface-900 mb-4">Invite Team Member</h2>
            {inviteSuccess && <div className="p-3 mb-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{inviteSuccess}</div>}
            {inviteError && <div className="p-3 mb-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{inviteError}</div>}
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
                <input required type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} className="input-field" placeholder="John Doe"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Email Address</label>
                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="input-field" placeholder="john@example.com"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="input-field cursor-pointer">
                  <option value="User">User</option>
                  {user?.globalRole === 'Super Admin' && <option value="Admin">Admin</option> }
                  <option value="Manager">Manager</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => { setShowInviteModal(false); setInviteSuccess(''); setInviteError(''); }} className="btn-secondary">Close</button>
                <button type="submit" className="btn-primary">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Add missing icon
const Folder = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
);

export default Dashboard;
