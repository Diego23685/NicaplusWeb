import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para inyectar datos de sesión si es necesario en el futuro
api.interceptors.request.use((config) => {
    return config;
});

export default api;