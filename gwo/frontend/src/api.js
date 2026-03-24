import axios from 'axios';

const API = axios.create({
    baseURL: `http://${window.location.hostname}:8000/api`,
});

// Interceptor to inject JWT Token if the user is authenticated
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
