import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const AdminRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setCredentials } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/users/admin-register', { name, email, password });
      setCredentials(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register admin account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-center items-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-surface-900 tracking-tight">
          Admin Portal Setup
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600">
          Create an administrative account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-surface-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Company Name / Full Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Admin Name"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email address</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="admin@example.com"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••"/>
            </div>

            <button type="submit" disabled={isLoading} className="w-full btn-primary flex justify-center py-2.5">
              {isLoading ? 'Setting up Admin...' : 'Register as Admin'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-surface-500">Already have an admin account? </span>
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
