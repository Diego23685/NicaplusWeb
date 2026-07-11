import api from './api';

// Interfaces para tipar las peticiones
export interface ClienteRegistroData {
    nombre: string;
    telefono: string;
    email: string;
    password?: string;
}

export interface ClienteLoginData {
    email: string;
    password?: string;
}

export const authService = {
    // Registro de cliente (no devuelve token ahora, pide confirmación)
    registroCliente: async (data: ClienteRegistroData) => {
        const response = await api.post('/Auth/registro-cliente', data);
        return response.data; // { mensaje: "..." }
    },

    // Login de cliente (devuelve token y perfil)
    loginCliente: async (data: ClienteLoginData) => {
        const response = await api.post('/Auth/login-cliente', data);
        return response.data; // { token: "...", cliente: {...} }
    },

    // Confirmar el email desde el enlace que llega al correo
    confirmarEmail: async (token: string) => {
        const response = await api.get(`/Auth/confirmar-email?token=${token}`);
        return response.data;
    },

    // Solicitar recuperación de contraseña
    recuperarPassword: async (email: string) => {
        const response = await api.post('/Auth/recuperar-password', { email });
        return response.data;
    },

    // Enviar la nueva contraseña con el token recibido
    restablecerPassword: async (token: string, nuevaPassword: string) => {
        const response = await api.post('/Auth/restablecer-password', { token, nuevaPassword });
        return response.data;
    }
};