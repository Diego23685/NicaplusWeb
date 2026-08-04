import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de Peticiones: Adjunta el token correspondiente
api.interceptors.request.use((config) => {
    // Revisamos ambos tokens por compatibilidad de tu app
    const token = localStorage.getItem('token_cliente') || localStorage.getItem('nicaplus_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor de Respuestas: Captura errores globales
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const urlPeticion = error.config?.url || '';

        // 1. Si el error 401 proviene del LOGIN o REGISTRO, NO redirigir.
        // Dejamos que el componente (ClientesLoginRegister) maneje y muestre el mensaje de error.
        if (urlPeticion.includes('/Auth/') || urlPeticion.includes('/login')) {
            return Promise.reject(error);
        }

        // 2. Si es 401 en cualquier OTRA ruta protegida (sesión expirada mientras navega):
        if (error.response?.status === 401) {
            localStorage.removeItem('token_cliente');
            localStorage.removeItem('nicaplus_token');
            delete api.defaults.headers.common['Authorization'];
            
            // Solo redirigir si no estamos ya en la tienda/catalogo para evitar recargas en bucle
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);

export default api;