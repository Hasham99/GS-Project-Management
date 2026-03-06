import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Plus, UserPlus, BarChart2, Edit2, Trash2, X } from 'lucide-react';
import { useQuill } from '../hooks/useQuill';
import 'quill/dist/quill.snow.css';
import useAuthStore from '../store/useAuthStore';

const ProjectDetail = () => {
  const { user } = useAuthStore();
  const { id: projectId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [assignToAll, setAssignToAll] = useState(true);
  const [assigneeId, setAssigneeId] = useState('');

  // Task Detail & Edit States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');

  const { quill: createQuill, quillRef: createQuillRef } = useQuill({
    modules: { toolbar: [['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}]] },
    placeholder: 'Task details...'
  });
  
  const { quill: editQuill, quillRef: editQuillRef } = useQuill({
    modules: { toolbar: [['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}]] }
  });

  // Keep createQuill synchronized with taskDesc
  useEffect(() => {
    if (createQuill) {
      createQuill.on('text-change', () => {
        setTaskDesc(createQuill.root.innerHTML);
      });
    }
  }, [createQuill]);

  // Keep editQuill synchronized with editDesc when editing
  useEffect(() => {
    if (editQuill && isEditingItem) {
      if (editQuill.root.innerHTML !== editDesc) {
         editQuill.clipboard.dangerouslyPasteHTML(editDesc);
      }
      editQuill.on('text-change', () => {
        setEditDesc(editQuill.root.innerHTML);
      });
    }
  }, [editQuill, isEditingItem]);

  // Add Member States
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState('Viewer');
  const [memberAddError, setMemberAddError] = useState('');
  
  // Platform Release States
  const [selectedDoneItems, setSelectedDoneItems] = useState([]);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releasePlatform, setReleasePlatform] = useState('Web');
  const [releaseVersion, setReleaseVersion] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`);
      return data;
    }
  });

  const { data: workItems, isLoading } = useQuery({
    queryKey: ['workitems', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/workitems/project/${projectId}`);
      return data;
    }
  });

  const { data: members } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/members`);
      return data;
    }
  });

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: showAddMemberModal
  });

  const createTask = useMutation({
    mutationFn: async (newTask) => {
      return await api.post('/workitems', newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workitems', projectId] });
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('Medium');
    }
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    createTask.mutate({ 
      projectId, 
      title: taskTitle, 
      description: taskDesc, 
      priority: taskPriority,
      type: 'TASK',
      assignToAll,
      assigneeId: !assignToAll && assigneeId ? assigneeId : undefined
    });
  };

  const addMemberToProject = useMutation({
    mutationFn: async ({ userId, role }) => {
      return await api.post(`/projects/${projectId}/members`, { userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setShowAddMemberModal(false);
      setMemberUserId('');
      setMemberAddError('');
    },
    onError: (err) => {
      setMemberAddError(err.response?.data?.message || 'Failed to add member');
    }
  });

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!memberUserId) return;
    addMemberToProject.mutate({ userId: memberUserId, role: memberRole });
  };

  const updateStatus = useMutation({
    mutationFn: async ({ itemId, status }) => {
      return await api.put(`/workitems/${itemId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workitems', projectId] });
    }
  });

  const updateTaskMeta = useMutation({
    mutationFn: async ({ itemId, title, description, priority }) => {
      return await api.put(`/workitems/${itemId}`, { title, description, priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workitems', projectId] });
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
      queryClient.invalidateQueries({ queryKey: ['workitems', projectId] });
      setShowDetailModal(false);
      setSelectedItem(null);
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      navigate('/projects');
    }
  });

  const handleDeleteProject = () => {
    if (window.confirm('Are you sure you want to delete this project? All associated tasks will be lost.')) {
      deleteProjectMutation.mutate();
    }
  };

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

  const createRelease = useMutation({
    mutationFn: async (releaseData) => {
      return await api.post('/releases', releaseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workitems', projectId] });
      // Clear selection after successful push
      setSelectedDoneItems([]);
      setShowReleaseModal(false);
      setReleaseVersion('');
    }
  });

  const handlePushToReview = (e) => {
    e.preventDefault();
    createRelease.mutate({
      projectId,
      platform: releasePlatform,
      version: releaseVersion,
      workItemIds: selectedDoneItems,
    });
  };

  const toggleSelection = (itemId) => {
    setSelectedDoneItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const columns = ['Todo', 'InProgress', 'Review', 'Done'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{project?.name || 'Loading...'} Board</h1>
          <p className="text-surface-500">{project?.description}</p>
        </div>
        <div className="flex space-x-3">
          {(project?.myRole === 'Manager' || project?.myRole === 'Admin' || user?.globalRole === 'Super Admin') && (
            <Link to={`/projects/${projectId}/analytics`} className="btn-secondary flex items-center space-x-2 border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 ring-0">
              <BarChart2 size={18} />
              <span>Analytics</span>
            </Link>
          )}
          {(project?.myRole === 'Manager' || project?.myRole === 'Admin') && (
            <button onClick={() => setShowAddMemberModal(true)} className="btn-secondary flex items-center space-x-2">
              <UserPlus size={18} />
              <span>Add Member</span>
            </button>
          )}
          <Link to={`/projects/${projectId}/releases`} className="btn-secondary flex items-center space-x-2">
            <span>View Releases</span>
          </Link>
          {(project?.myRole === 'Manager' || user?.globalRole === 'Admin' || user?.globalRole === 'Super Admin') && (
            <button 
              onClick={handleDeleteProject} 
              className="btn-secondary flex items-center space-x-2 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
            >
              <Trash2 size={18} />
              <span>Delete Project</span>
            </button>
          )}
          <button onClick={() => setShowTaskModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex space-x-6 pb-4">
        {columns.map(col => (
          <div key={col} className="w-80 shrink-0 flex flex-col bg-surface-100/50 rounded-xl rounded-t-xl overflow-hidden">
            <div className="p-4 bg-surface-200/50 border-b border-surface-200">
              <h3 className="font-semibold text-surface-800 flex items-center justify-between">
                {col}
                <span className="bg-surface-300 text-surface-700 text-xs px-2 py-1 rounded-full">
                  {workItems?.filter(i => i.status === col || (col === 'Todo' && i.status === 'Backlog')).length || 0}
                </span>
              </h3>
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {workItems?.filter(i => i.status === col || (col === 'Todo' && i.status === 'Backlog')).map(item => (
                <div key={item._id} onClick={() => openTaskDetail(item)} className="bg-white p-4 rounded-lg shadow-sm border border-surface-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-2 border-b border-surface-50 pb-2">
                    <span className="text-[10px] font-bold tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase">{item.type}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-medium text-surface-400">{item.priority}</span>
                      {col === 'Done' && (
                        <input 
                          type="checkbox" 
                          checked={selectedDoneItems.includes(item._id)}
                          onChange={() => toggleSelection(item._id)}
                          className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
                        />
                      )}
                    </div>
                  </div>
                  <div className="w-[60%] truncate font-semibold text-surface-800 text-sm mb-1">{item.title}</div>
                  {!item.assignToAll && item.assigneeId && (
                    <div className="text-[10px] text-primary-600 bg-primary-50 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded mb-1">
                      <span>👤</span><span className="truncate max-w-25">{item.assigneeId.name}</span>
                    </div>
                  )}
                  <p className="w-[60%] truncate text-xs text-surface-500 mb-3">{stripHtml(item.description)}</p>
                  
                  {/* Status shift controls (mock drag & drop) */}
                  <div className="flex justify-between mt-2 pt-2 border-t border-surface-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ itemId: item._id, status: col === 'Done' ? 'Review' : col === 'Review' ? 'InProgress' : 'Todo' }); }}
                      disabled={col === 'Todo'}
                      className="text-xs text-surface-400 hover:text-primary-600 disabled:opacity-30"
                    >
                      ← Back
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ itemId: item._id, status: col === 'Todo' ? 'InProgress' : col === 'InProgress' ? 'Review' : 'Done' }); }}
                      disabled={col === 'Done'}
                      className="text-xs text-surface-400 hover:text-primary-600 disabled:opacity-30"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {col === 'Done' && selectedDoneItems.length > 0 && (
              <div className="p-3 bg-white border-t border-surface-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button onClick={() => setShowReleaseModal(true)} className="w-full btn-primary text-sm py-2">
                  Push {selectedDoneItems.length} to Review
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-surface-900 mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Title</label>
                <input required type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="input-field" placeholder="E.g. Setup Database"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                <div className="bg-white rounded-md border border-surface-300">
                  <div ref={createQuillRef} className="h-24" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-surface-700 mb-1">Priority</label>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="input-field cursor-pointer">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input type="checkbox" id="assignAll" checked={assignToAll} onChange={(e) => setAssignToAll(e.target.checked)} className="rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="assignAll" className="text-sm text-surface-700">Assign to all users</label>
              </div>
              {!assignToAll && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Assign To</label>
                  <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="input-field cursor-pointer">
                    <option value="">Select User...</option>
                    {members?.filter(m => m.userId.globalRole !== 'Super Admin' && m.userId.globalRole !== 'Admin').map(m => (
                      <option key={m.userId._id} value={m.userId._id}>{m.userId.name} ({m.roleInProject})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createTask.isPending} className="btn-primary">
                  {createTask.isPending ? 'Creating...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Push Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-surface-900 mb-2">Push Commits for Review</h2>
            <p className="text-sm text-surface-500 mb-4">You are pushing {selectedDoneItems.length} task(s) to be reviewed.</p>
            <form onSubmit={handlePushToReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Target Platform</label>
                <select value={releasePlatform} onChange={e => setReleasePlatform(e.target.value)} className="input-field cursor-pointer">
                  <option value="Web">Web Application</option>
                  <option value="Apple">iOS / Apple App Store</option>
                  <option value="Android">Android / Google Play Store</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Release Version (Optional)</label>
                <input type="text" value={releaseVersion} onChange={e => setReleaseVersion(e.target.value)} className="input-field" placeholder="E.g. v2.1.0"/>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowReleaseModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createRelease.isPending} className="btn-primary">
                  {createRelease.isPending ? 'Pushing...' : 'Push to Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-surface-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-surface-900 mb-4">Add Project Member</h2>
            {memberAddError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {memberAddError}
              </div>
            )}
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Select User</label>
                <select required value={memberUserId} onChange={e => setMemberUserId(e.target.value)} className="input-field cursor-pointer">
                  <option value="">Select a user...</option>
                  {allUsers?.map(sysUser => (
                    <option key={sysUser._id} value={sysUser._id}>
                      {sysUser.name} ({sysUser.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Project Role</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)} className="input-field cursor-pointer">
                  <option value="Viewer">Viewer</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={addMemberToProject.isPending} className="btn-primary">
                  {addMemberToProject.isPending ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Task Detail / Edit Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-surface-100 bg-surface-50/50">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold tracking-wider text-primary-600 bg-primary-100 px-2 py-1 rounded uppercase">
                  {selectedItem.type}
                </span>
                <span className="text-sm font-medium text-surface-500">
                  {selectedItem.projectId?.name || project?.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {((project?.myRole === 'Manager' || project?.myRole === 'Admin') || user?.globalRole === 'Admin' || user?.globalRole === 'Super Admin' || selectedItem.reporterId?._id === user?._id || selectedItem.reporterId === user?._id) && !isEditingItem && (
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

            {/* Modal Body */}
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
                    <div>
                      <span className="block text-surface-500 text-xs font-medium mb-1">Assignee</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-surface-800">{!selectedItem.assignToAll && selectedItem.assigneeId ? selectedItem.assigneeId.name : 'All Users'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-surface-500 text-xs font-medium mb-1">Reporter</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-surface-800">{selectedItem.reporterId?.name || 'Unknown'}</span>
                      </div>
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
                      <div ref={editQuillRef} className="h-48" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Edit Mode) */}
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

export default ProjectDetail;
