import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Shield, User as UserIcon } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuthStore();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: currentUser?.globalRole !== 'User' // Only fetch for admins/managers
  });

  if (currentUser?.globalRole === 'User') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-surface-500">
          <Shield size={48} className="mx-auto mb-4 text-surface-300" />
          <h2 className="text-xl font-medium text-surface-900 mb-2">Access Denied</h2>
          <p>You need Administrator or Manager privileges to view the user directory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">User Directory</h1>
          <p className="text-surface-500">Manage all users within the workspace.</p>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-surface-200 rounded"></div>
            <div className="h-12 bg-surface-200 rounded"></div>
            <div className="h-12 bg-surface-200 rounded"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 text-sm text-surface-500">
                  <th className="pb-3 font-medium">User Name</th>
                  <th className="pb-3 font-medium">Global Role</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((sysUser) => (
                  <tr key={sysUser._id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                          {sysUser.avatar ? (
                            <img src={sysUser.avatar} alt={sysUser.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            sysUser.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-surface-900 flex items-center space-x-2">
                            <span>{sysUser.name}</span>
                            {sysUser._id === currentUser._id && (
                              <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">You</span>
                            )}
                          </div>
                          <div className="text-sm text-surface-400">{sysUser.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1 ${
                        sysUser.globalRole === 'Super Admin' || sysUser.globalRole === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        sysUser.globalRole === 'Manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-surface-100 text-surface-700'
                      }`}>
                        {sysUser.globalRole === 'Super Admin' || sysUser.globalRole === 'Admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                        <span>{sysUser.globalRole}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
