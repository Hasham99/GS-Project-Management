import axios from 'axios';

const api = axios.create({
  baseURL: 'https://project-management.garibsons.app/api',
  withCredentials: true, // Important for cookies (JWT)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
