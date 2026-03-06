import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, AlertCircle, Clock, Users, Target } from 'lucide-react';

const ProjectAnalytics = () => {
  const { id: projectId } = useParams();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`);
      return data;
    }
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/analytics`);
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-surface-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-surface-200 rounded-xl"></div>
          <div className="h-40 bg-surface-200 rounded-xl"></div>
          <div className="h-40 bg-surface-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Helpers to safely get counts
  const getStatusCount = (status) => analytics?.statusCounts?.find(s => s._id === status)?.count || 0;
  const getPriorityCount = (priority) => analytics?.priorityCounts?.find(p => p._id === priority)?.count || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4 pb-6 border-b border-surface-200">
        <Link to={`/projects/${projectId}`} className="p-2 bg-white border border-surface-200 rounded-lg text-surface-500 hover:text-surface-900 shadow-sm transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">{project?.name} <span className="text-primary-600 font-light">Analytics</span></h1>
          <p className="text-surface-500 mt-1">High-level insights & progress report</p>
        </div>
      </div>

      {/* Top Value Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0 shadow-lg shadow-primary-500/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-primary-100 font-medium">Total Tasks</p>
              <h3 className="text-4xl font-bold mt-2">{analytics?.summary?.totalTasks || 0}</h3>
            </div>
            <Target size={32} className="text-primary-200 opacity-50" />
          </div>
        </div>
        
        <div className="card bg-white shadow-sm border border-surface-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-surface-500 font-medium">Completed Tasks</p>
              <h3 className="text-4xl font-bold mt-2 text-surface-900">{analytics?.summary?.completedTasks || 0}</h3>
            </div>
            <CheckCircle2 size={32} className="text-green-500 opacity-50" />
          </div>
          <div className="mt-4 pt-4 border-t border-surface-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-500 font-medium">Completion Rate</span>
              <span className="text-green-600 font-bold">{analytics?.summary?.completionRate}%</span>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-1.5 mt-2">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${analytics?.summary?.completionRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="card bg-white shadow-sm border border-surface-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-surface-500 font-medium">Urgent Issues</p>
              <h3 className="text-4xl font-bold mt-2 text-surface-900">{getPriorityCount('Urgent')}</h3>
            </div>
            <AlertCircle size={32} className="text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
          <h3 className="text-lg font-bold text-surface-900 mb-6 flex items-center space-x-2">
            <Clock size={18} className="text-surface-400" />
            <span>Task Progress</span>
          </h3>
          <div className="space-y-4">
            {[
              { label: 'To Do', value: getStatusCount('Todo'), color: 'bg-surface-300' },
              { label: 'In Progress', value: getStatusCount('InProgress'), color: 'bg-blue-500' },
              { label: 'Under Review', value: getStatusCount('Review'), color: 'bg-purple-500' },
              { label: 'Done', value: getStatusCount('Done'), color: 'bg-green-500' }
            ].map(stat => (
              <div key={stat.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-surface-700">{stat.label}</span>
                  <span className="font-bold text-surface-900">{stat.value}</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-2">
                  <div className={`${stat.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${analytics?.summary?.totalTasks ? (stat.value / analytics.summary.totalTasks) * 100 : 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority & Workload */}
        <div className="space-y-8">
          {/* Priority breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
             <h3 className="text-lg font-bold text-surface-900 mb-4 flex items-center space-x-2">
              <AlertCircle size={18} className="text-surface-400" />
              <span>Priority Breakdown</span>
            </h3>
            <div className="flex space-x-2 mt-6">
              {[
                { label: 'Urgent', value: getPriorityCount('Urgent'), color: 'bg-red-500' },
                { label: 'High', value: getPriorityCount('High'), color: 'bg-orange-500' },
                { label: 'Medium', value: getPriorityCount('Medium'), color: 'bg-yellow-500' },
                { label: 'Low', value: getPriorityCount('Low'), color: 'bg-green-500' }
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} h-12 rounded-lg flex items-center justify-center text-white font-bold transition-all duration-500 hover:opacity-90`} style={{ flex: stat.value || 0.1 }} title={`${stat.label}: ${stat.value}`}>
                  {stat.value > 0 ? stat.value : ''}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs font-semibold text-surface-400 px-1">
              <span>Urgent</span>
              <span>Low</span>
            </div>
          </div>

          {/* User Workload */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
            <h3 className="text-lg font-bold text-surface-900 mb-6 flex items-center space-x-2">
              <Users size={18} className="text-surface-400" />
              <span>Active Workload (Pending Tasks)</span>
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {analytics?.workload?.length === 0 ? (
                <div className="text-center py-6 text-surface-400 text-sm">No active assigned tasks right now.</div>
              ) : (
                analytics?.workload?.sort((a,b) => b.count - a.count).map(user => (
                  <div key={user._id} className="flex items-center justify-between border-b border-surface-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-surface-800">{user.name}</span>
                    </div>
                    <span className="px-3 py-1 bg-surface-100 text-surface-800 rounded-full text-xs font-bold">
                      {user.count} tasks
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;
