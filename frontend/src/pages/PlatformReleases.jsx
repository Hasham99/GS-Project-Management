import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { format } from 'date-fns';

const PlatformReleases = () => {
  const { id: projectId } = useParams();
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`);
      return data;
    }
  });

  const { data: releases, isLoading } = useQuery({
    queryKey: ['releases', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/releases/project/${projectId}`);
      return data;
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ releaseId, status }) => {
      return await api.put(`/releases/${releaseId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', projectId] });
    }
  });

  const platforms = ['Apple', 'Android', 'Web'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-4 mb-8">
        <Link to={`/projects/${projectId}`} className="text-surface-500 hover:text-primary-600 transition-colors">
          ← Back to Board
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{project?.name || 'Loading...'} Releases</h1>
          <p className="text-surface-500">Track platform deployments from 'Under Review' to 'Live'</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex space-x-6 pb-4">
        {platforms.map(platform => {
          const platformReleases = releases?.filter(r => r.platform === platform) || [];
          
          return (
            <div key={platform} className="w-[350px] flex-shrink-0 flex flex-col bg-surface-100/50 rounded-xl rounded-t-xl overflow-hidden">
              <div className="p-4 bg-surface-200/50 border-b border-surface-200 flex items-center justify-between">
                <h3 className="font-bold text-surface-800 flex items-center space-x-2">
                  <span>{platform} Commits</span>
                </h3>
                <span className="bg-surface-300 text-surface-700 text-xs px-2 py-1 rounded-full">
                  {platformReleases.length}
                </span>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-4">
                {platformReleases.map(release => (
                  <div key={release._id} className="bg-white p-4 rounded-lg shadow-sm border border-surface-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                            release.status === 'Live' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {release.status}
                        </span>
                        {release.version && (
                          <span className="ml-2 text-xs font-semibold text-surface-600">v{release.version}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-surface-400">
                        {format(new Date(release.createdAt), 'MMM d, p')}
                      </span>
                    </div>

                    <div className="text-xs text-surface-600 mb-3 ml-1 border-l-2 border-surface-200 pl-3">
                      <p className="font-semibold text-surface-700 mb-1">{release.workItems.length} Tasks Included:</p>
                      <ul className="space-y-1">
                        {release.workItems.map(item => (
                          <li key={item._id} className="truncate select-none text-surface-500">
                            <span className="font-medium mr-1.5">{item.type}</span> {item.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-100">
                      <span className="text-[10px] text-surface-400">Pushed by {release.createdBy.name}</span>
                      
                      {release.status === 'Under Review' ? (
                        <button 
                          onClick={() => updateStatus.mutate({ releaseId: release._id, status: 'Live' })}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Publish to Live →
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 font-medium flex items-center space-x-1">
                          <span>✓ Published</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {platformReleases.length === 0 && (
                  <div className="text-center py-8 text-surface-400 text-sm">
                    No active releases for {platform}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformReleases;
