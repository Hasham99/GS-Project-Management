import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { CheckCircle2, Circle, Folder, BarChart2, Edit2, Trash2, X } from 'lucide-react';
import { useQuill } from '../hooks/useQuill';
import 'quill/dist/quill.snow.css';

const UserWorkItems = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/workitems/my-tasks');
      return data;
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ itemId, status }) => {
      return await api.put(`/workitems/${itemId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    }
  });

  // Task Detail & Edit States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');

  const { quill, quillRef } = useQuill();

  // Keep quill synchronized with editDesc when editing
  useEffect(() => {
    if (quill && isEditingItem) {
      if (quill.root.innerHTML !== editDesc) {
         quill.clipboard.dangerouslyPasteHTML(editDesc);
      }
      quill.on('text-change', () => {
        setEditDesc(quill.root.innerHTML);
      });
    }
  }, [quill, isEditingItem]);

  const updateTaskMeta = useMutation({
    mutationFn: async ({ itemId, title, description, priority }) => {
      return await api.put(`/workitems/${itemId}`, { title, description, priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      setShowDetailModal(false);
      setSelectedItem(null);
      setIsEditingItem(false);
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (itemId) => {
      return await api.delete(`/workitems/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      setShowDetailModal(false);
      setSelectedItem(null);
    }
  });

  const openTaskDetail = (item) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditDesc(item.description);
    setEditPriority(item.priority);
    setIsEditingItem(false);
    setShowDetailModal(true);
  };

  const stripHtml = (html) => {
     if(!html) return '';
     return html.replace(/<[^>]+>/g, '');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-surface-100 text-surface-700 border-surface-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-surface-200">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">My Tasks</h1>
          <p className="text-surface-500 mt-1">Tasks explicitly assigned to you across all projects.</p>
        </div>
        <div className="flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-lg font-medium">
          <BarChart2 size={20} />
          <span>{tasks?.length || 0} Pending Tasks</span>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-surface-100 rounded-xl"></div>
            <div className="h-16 bg-surface-100 rounded-xl"></div>
          </div>
        ) : tasks?.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 size={48} className="mx-auto text-surface-300 mb-4" />
            <h3 className="text-xl font-medium text-surface-900">You're all caught up!</h3>
            <p className="text-surface-500 mt-2">There are no tasks specifically assigned to your queue.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-surface-200">
            <table className="w-full text-left border-collapse bg-white">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr className="text-sm text-surface-500 uppercase tracking-wider font-semibold">
                  <th className="p-4">Task Details</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Priority & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {tasks?.map((item) => (
                  <tr key={item._id} onClick={() => openTaskDetail(item)} className="hover:bg-surface-50 transition-colors group cursor-pointer">
                    <td className="p-4">
                      <div className="flex items-start space-x-3">
                        {item.status === 'Done' ? (
                          <CheckCircle2 size={20} className="text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <Circle size={20} className="text-surface-300 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">{item.title}</div>
                          <div className="text-sm text-surface-500 mt-1 line-clamp-1 max-w-md">{stripHtml(item.description)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center space-x-1 text-sm bg-surface-100 text-surface-700 px-2.5 py-1 rounded-md font-medium">
                        <Folder size={14} />
                        <span>{item.projectId?.name || 'Unknown'}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-2 items-start" onClick={(e) => e.stopPropagation()}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <select 
                          value={item.status} 
                          onChange={(e) => updateStatus.mutate({ itemId: item._id, status: e.target.value })}
                          className={`text-sm rounded-md border-surface-200 cursor-pointer shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                            item.status === 'Done' ? 'bg-green-50 text-green-700 border-green-200 font-medium' :
                            item.status === 'Review' ? 'bg-purple-50 text-purple-700 border-purple-200 font-medium' :
                            item.status === 'InProgress' ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium' :
                            'bg-surface-50 text-surface-600'
                          }`}
                        >
                          <option value="Todo">To Do</option>
                          <option value="InProgress">In Progress</option>
                          <option value="Review">Review</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Detail / Edit Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-surface-100 bg-surface-50/50">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold tracking-wider text-primary-600 bg-primary-100 px-2 py-1 rounded uppercase">
                  {selectedItem.type}
                </span>
                <span className="text-sm font-medium text-surface-500">
                  {selectedItem.projectId?.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {(user?.globalRole === 'Admin' || user?.globalRole === 'Super Admin' || selectedItem.reporterId?._id === user?._id || selectedItem.reporterId === user?._id) && !isEditingItem && (
                  <>
                    <button onClick={() => setIsEditingItem(true)} className="p-2 text-surface-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => { if(window.confirm('Are you sure you want to delete this task?')) deleteTask.mutate(selectedItem._id); }} className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button onClick={() => { setShowDetailModal(false); setSelectedItem(null); }} className="p-2 text-surface-400 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!isEditingItem ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-surface-900 leading-tight pr-4">{selectedItem.title}</h2>
                    <span className="shrink-0 px-3 py-1 bg-surface-100 text-surface-800 rounded-lg text-sm font-bold border border-surface-200">
                      {selectedItem.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm mt-4 p-4 bg-surface-50 rounded-xl border border-surface-100">
                    <div>
                      <span className="block text-surface-500 text-xs font-medium mb-1">Priority</span>
                      <span className="font-semibold text-surface-800">{selectedItem.priority}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider mb-3">Description</h3>
                    <div className="prose prose-sm max-w-none prose-p:text-surface-600 prose-headings:text-surface-900 prose-a:text-primary-600">
                      {selectedItem.description ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedItem.description }} />
                      ) : (
                        <p className="text-surface-400 italic">No description provided.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Title</label>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="input-field text-lg font-medium" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-surface-700 mb-1">Priority</label>
                    <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="input-field cursor-pointer">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                    <div className="bg-white rounded-md border border-surface-300">
                      <div ref={quillRef} className="h-48" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isEditingItem && (
               <div className="flex justify-end items-center space-x-3 px-6 py-4 border-t border-surface-100 bg-surface-50">
                <button onClick={() => setIsEditingItem(false)} className="btn-secondary">Cancel</button>
                <button 
                  onClick={() => updateTaskMeta.mutate({ itemId: selectedItem._id, title: editTitle, description: editDesc, priority: editPriority })}
                  disabled={updateTaskMeta.isPending}
                  className="btn-primary"
                >
                  {updateTaskMeta.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserWorkItems;
