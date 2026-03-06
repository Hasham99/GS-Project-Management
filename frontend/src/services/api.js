import axios from 'axios';

const api = axios.create({
  // Using a relative path so it automatically uses your domain!
  baseURL: '/api', 
  withCredentials: true, // Important for cookies (JWT)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;