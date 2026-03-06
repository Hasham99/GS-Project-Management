import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Plus, Folder, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const Projects = () => {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    }
  });

  const createProject = useMutation({
    mutationFn: async (newProject) => {
      return await api.post('/projects', newProject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      setShowModal(false);
      setName('');
      setDescription('');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createProject.mutate({ name, description });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Projects</h1>
          <p className="text-surface-500">Manage your active projects and teams.</p>
        </div>
        {user?.globalRole !== 'User' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus size={18} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map(project => (
            <div key={project._id} className="card hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors">
                  <Folder size={24} />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  project.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-700'
                }`}>
                  {project.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-1">{project.name}</h3>
              <p className="text-surface-500 text-sm mb-4 line-clamp-2">{project.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                <div className="flex items-center space-x-2 text-xs text-surface-400">
                  <Calendar size={14} />
                  <span>{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <Link to={`/projects/${project._id}`} className="text-primary-600 text-sm font-medium hover:text-primary-800">
                  View Board →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Basic Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-surface-900 mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Project Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="E.g. Website Redesign"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="What is this project about?"/>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createProject.isPending} className="btn-primary">
                  {createProject.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
